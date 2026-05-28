import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import { emailDB, type CachedEmail, type EmailPageIndex } from '../db/emailDb';

// ─── Cache Configuration ───────────────────────────────────────────────────
/** Emails are considered fresh for 3 minutes. Tune per environment. */
const CACHE_TTL_MS = 3 * 60 * 1000;

/** Maximum emails per mailbox to prevent unbounded growth */
export const MAX_EMAILS_PER_MAILBOX = 1000;

/** Pagination window size - keep only recent pages */
export const PAGINATION_WINDOW_SIZE = 20;

/** TTL for different mailbox types (in milliseconds) */
export const MAILBOX_TTL = {
  INBOX: 7 * 24 * 60 * 60 * 1000,        // 7 days
  SENT: 30 * 24 * 60 * 60 * 1000,       // 30 days
  DRAFT: 30 * 24 * 60 * 60 * 1000,      // 30 days
  TRASH: 24 * 60 * 60 * 1000,           // 1 day
  SPAM: 24 * 60 * 60 * 1000,            // 1 day
  DEFAULT: 3 * 24 * 60 * 60 * 1000      // 3 days for others
};

/** Get TTL for specific mailbox type */
const getMailboxTTL = (boxName: string): number => {
  const upperBoxName = boxName.toUpperCase();
  return MAILBOX_TTL[upperBoxName as keyof typeof MAILBOX_TTL] || MAILBOX_TTL.DEFAULT;
};

// ─── Key builders (keep all key logic in one place) ──────────────────────────
export const buildEmailKey = (userId: string, boxName: string, messageId: string) =>
    `${userId}|${boxName}|${messageId}`;

export const buildPageKey = (
    userId: string,
    boxName: string,
    page: number,
    mailAction: string
) => `${userId}|${boxName}|${page}|${mailAction}`;

const isFresh = (fetchedAt: number) => Date.now() - fetchedAt < CACHE_TTL_MS;

/**
 * Returns the emails + pagination for a given page if the cache is fresh.
 * Returns null on any miss (missing page index, missing email, or stale TTL).
 */
export async function getEmailPageFromCache(
    userId: string,
    boxName: string,
    page: number,
    mailAction: string
): Promise<{ emails: Email[]; pagination: Pagination } | null> {
    try {
        const pageIndex = await emailDB.emailPageIndexes.get(
            buildPageKey(userId, boxName, page, mailAction)
        );

        if (!pageIndex || !isFresh(pageIndex.fetchedAt)) return null;

        const cacheKeys = pageIndex.messageIds.map((mid) =>
            buildEmailKey(userId, boxName, mid)
        );

        const rows = await emailDB.emails.bulkGet(cacheKeys);

        // Any missing row → treat the whole page as a miss
        if (rows.some((r) => !r || !isFresh(r.fetchedAt))) return null;

        // Restore the original server-defined order
        const byId = new Map(
            (rows as CachedEmail[]).map((e) => [e.messageId, e])
        );
        const orderedEmails = pageIndex.messageIds
            .map((mid) => byId.get(mid))
            .filter(Boolean) as Email[];

        const pagination: Pagination = {
            currentPage: pageIndex.page,
            totalPages: Math.ceil(pageIndex.totalEmails / 25), // Assuming 25 emails per page
            totalEmails: pageIndex.totalEmails,
            emailsPerPage: 25, // Default value
            lastMailId: pageIndex.lastMailId,
            firstMailId: pageIndex.firstMailId,
            hasNextPage: pageIndex.lastMailId !== null && pageIndex.lastMailId !== '',
            hasPreviousPage: pageIndex.page > 1,
            startCount: (pageIndex.page - 1) * 25 + 1,
            endCount: Math.min(pageIndex.page * 25, pageIndex.totalEmails),
            unreadCount: pageIndex.unreadCount ?? orderedEmails.filter(email => !email.isSeen).length,
        };

        return { emails: orderedEmails, pagination };
    } catch {
        // Never let a DB error break the UI — just fall through to API
        return null;
    }
}

/**
 * Persists a full page of emails + its pagination cursor.
 * Uses bulkPut so re-fetching the same page overwrites cleanly.
 */
export async function saveEmailPageToCache(
    userId: string,
    boxName: string,
    page: number,
    mailAction: string,
    emails: Email[],
    pagination: Pick<Pagination, 'lastMailId' | 'firstMailId' | 'totalEmails' | 'unreadCount'>
): Promise<void> {
    try {
        // Filter out scheduled emails from caching
        const nonScheduledEmails = emails.filter((email) => !email.isSchedule);
        
        // Don't cache if all emails are scheduled
        if (nonScheduledEmails.length === 0) {
            return;
        }

        const now = Date.now();

        const cachedEmails: CachedEmail[] = nonScheduledEmails.map((email) => ({
            ...email,
            _cacheKey: buildEmailKey(userId, boxName, email.messageId),
            userId,
            cacheBoxName: boxName,
            fetchedAt: now,
        }));

        const pageIndex: EmailPageIndex = {
            id: buildPageKey(userId, boxName, page, mailAction),
            userId,
            boxName,
            page,
            mailAction,
            messageIds: nonScheduledEmails.map((e) => e.messageId),
            lastMailId: pagination.lastMailId,
            firstMailId: pagination.firstMailId,
            totalEmails: pagination.totalEmails,
            unreadCount: pagination.unreadCount,
            fetchedAt: now,
        };

        // Parallel writes — emails first since page index references them
        await emailDB.db.transaction('rw', emailDB.emails, emailDB.emailPageIndexes, async () => {
            await emailDB.emails.bulkPut(cachedEmails);
            await emailDB.emailPageIndexes.put(pageIndex);
        });
    } catch (err) {
        console.warn('[EmailCache] saveEmailPageToCache failed silently', err);
    }
}

/**
 * Returns the emails + pagination for a given page if the cache is fresh.
 * Returns null on any miss (missing page index, missing email, or stale TTL).
 */
export async function updateEmailReadStateInCache(
    userId: string,
    boxName: string,
    messageIds: string[],
    isRead: boolean
): Promise<void> {
    try {   
        await emailDB.db.transaction('rw', emailDB.emails, async () => {
            for (const mid of messageIds) {
                const key = buildEmailKey(userId, boxName, mid);
                const cached = await emailDB.emails.get(key);
                if (!cached) continue;
                const flags = cached.flags ?? [];
                const updated = isRead
                    ? [...new Set([...flags, '\\Seen'])]
                    : flags.filter((f) => f !== '\\Seen');
                await emailDB.emails.update(key, { flags: updated });
            }
        });
    } catch (err) {
        console.warn('[EmailCache] updateEmailReadState failed silently', err);
    }
}

export async function deleteEmailsFromCache(
    userId: string,
    boxName: string,
    messageIds: string[]
): Promise<void> {
    try {
        const keys = messageIds.map((mid) => buildEmailKey(userId, boxName, mid));

        await emailDB.db.transaction('rw', emailDB.emails, emailDB.emailPageIndexes, async () => {
            await emailDB.emails.bulkDelete(keys);

            // Remove deleted IDs from every page index that references them
            const pageIndexes = await emailDB.emailPageIndexes
                .where('[userId+boxName]')
                .equals([userId, boxName])
                .toArray();

            const toUpdate = pageIndexes
                .map((idx) => ({
                    ...idx,
                    messageIds: idx.messageIds.filter((mid) => !messageIds.includes(mid)),
                }))
                .filter((idx) => idx.messageIds.length > 0);

            const toDelete = pageIndexes
                .filter((idx) => !toUpdate.find((u) => u.id === idx.id))
                .map((idx) => idx.id);

            if (toUpdate.length) await emailDB.emailPageIndexes.bulkPut(toUpdate);
            if (toDelete.length) await emailDB.emailPageIndexes.bulkDelete(toDelete);
        });
    } catch (err) {
        console.warn('[EmailCache] deleteEmailsFromCache failed silently', err);
    }
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

/**
 * Wipe all cache for one mailbox.
 * Call this when a socket event signals new mail arrived
 * (page 1 is now stale because new emails shifted everything).
 */
export async function invalidateBoxCache(userId: string, boxName: string): Promise<void> {
    try {
        await emailDB.db.transaction('rw', emailDB.emails, emailDB.emailPageIndexes, async () => {
            await emailDB.emails.where('[userId+cacheBoxName]').equals([userId, boxName]).delete();
            await emailDB.emailPageIndexes
                .where('[userId+boxName]')
                .equals([userId, boxName])
                .delete();
        });
    } catch (err) {
        console.warn('[EmailCache] invalidateBoxCache failed silently', err);
    }
}

/**
 * Wipe ALL cached data for a user — call on logout.
 */
export async function clearUserEmailCache(userId: string): Promise<void> {
    try {
        await emailDB.db.transaction('rw', emailDB.emails, emailDB.emailPageIndexes, async () => {
            const emailKeys = await emailDB.emails
                .where('userId')
                .equals(userId)
                .primaryKeys();
            await emailDB.emails.bulkDelete(emailKeys);

            const pageKeys = await emailDB.emailPageIndexes
                .where('userId')
                .equals(userId)
                .primaryKeys();
            await emailDB.emailPageIndexes.bulkDelete(pageKeys);
        });
    } catch (err) {
        console.warn('[EmailCache] clearUserEmailCache failed silently', err);
    }
}

// ─── Cache Management ─────────────────────────────────────────────────────

/**
 * 1️. SIZE LIMIT MANAGEMENT
 * Delete oldest emails when mailbox exceeds MAX_EMAILS_PER_MAILBOX
 */
export async function enforceSizeLimit(userId: string, boxName: string): Promise<void> {
    try {
        const emailCount = await emailDB.emails
            .where('[userId+cacheBoxName]')
            .equals([userId, boxName])
            .count();

        if (emailCount <= MAX_EMAILS_PER_MAILBOX) return;

        console.log(`[EmailCache] Size limit exceeded for ${boxName}: ${emailCount} emails, pruning...`);
        
        // Get oldest emails to delete (delete 20% over the limit)
        const toDeleteCount = Math.max(0, emailCount - MAX_EMAILS_PER_MAILBOX + Math.floor(MAX_EMAILS_PER_MAILBOX * 0.2));
        
        const oldestEmails = await emailDB.emails
            .where('[userId+cacheBoxName]')
            .equals([userId, boxName])
            .toArray()
            .then(emails => emails.sort((a, b) => a.fetchedAt - b.fetchedAt).slice(0, toDeleteCount));

        if (oldestEmails.length === 0) return;

        const keysToDelete = oldestEmails.map((e: CachedEmail) => e._cacheKey);
        
        await emailDB.db.transaction('rw', emailDB.emails, emailDB.emailPageIndexes, async () => {
            // Delete emails
            await emailDB.emails.bulkDelete(keysToDelete);
            
            // Update page indexes to remove deleted message IDs
            const pageIndexes = await emailDB.emailPageIndexes
                .where('[userId+boxName]')
                .equals([userId, boxName])
                .toArray();

            const toUpdate = pageIndexes.map(idx => ({
                ...idx,
                messageIds: idx.messageIds.filter(mid => !oldestEmails.some((e: CachedEmail) => e.messageId === mid))
            })).filter(idx => idx.messageIds.length > 0);

            const toDelete = pageIndexes.filter(idx => 
                !toUpdate.find(u => u.id === idx.id)
            ).map(idx => idx.id);

            if (toUpdate.length) await emailDB.emailPageIndexes.bulkPut(toUpdate);
            if (toDelete.length) await emailDB.emailPageIndexes.bulkDelete(toDelete);
        });

        console.log(`[EmailCache] Deleted ${keysToDelete.length} old emails from ${boxName}`);
    } catch (err) {
        console.warn('[EmailCache] enforceSizeLimit failed silently', err);
    }
}

/**
 * 2️. TTL-BASED CLEANUP
 * Remove emails older than mailbox-specific TTL
 */
export async function pruneStaleEmailCache(): Promise<void> {
    try {
        console.log('[EmailCache] Starting TTL-based cleanup...');
        
        // Get all unique mailbox types
        const allIndexes = await emailDB.emailPageIndexes.toArray();
        const mailboxTypes = new Set(allIndexes.map(idx => idx.boxName));
        
        let totalDeleted = 0;
        
        for (const boxName of mailboxTypes) {
            const ttl = getMailboxTTL(boxName);
            const cutoff = Date.now() - ttl;
            
            // Delete stale emails for this mailbox type
            const staleKeys = await emailDB.emails
                .where('[userId+cacheBoxName]')
                .equals(['*', boxName]) // Wildcard for userId
                .and(email => email.fetchedAt < cutoff)
                .primaryKeys();
            
            if (staleKeys.length > 0) {
                await emailDB.emails.bulkDelete(staleKeys);
                totalDeleted += staleKeys.length;
            }
            
            // Delete stale page indexes
            const stalePageKeys = await emailDB.emailPageIndexes
                .where('boxName')
                .equals(boxName)
                .and(index => index.fetchedAt < cutoff)
                .primaryKeys();
                
            if (stalePageKeys.length > 0) {
                await emailDB.emailPageIndexes.bulkDelete(stalePageKeys);
            }
        }
        
        console.log(`[EmailCache] TTL cleanup completed: deleted ${totalDeleted} stale emails`);
    } catch (err) {
        console.warn('[EmailCache] pruneStaleEmailCache failed silently', err);
    }
}

/**
 * 3️. PAGINATION WINDOW CLEANUP
 * Keep only recent pages within sliding window
 */
export async function prunePaginationWindow(userId: string, boxName: string, currentPage: number): Promise<void> {
    try {
        const minPageToKeep = Math.max(1, currentPage - PAGINATION_WINDOW_SIZE);
        
        // Get page indexes outside the window
        const oldPageIndexes = await emailDB.emailPageIndexes
            .where('[userId+boxName]')
            .equals([userId, boxName])
            .and(index => index.page < minPageToKeep)
            .toArray();
            
        if (oldPageIndexes.length === 0) return;
        
        console.log(`[EmailCache] Pruning pagination window for ${boxName}: pages < ${minPageToKeep}`);
        
        // Collect message IDs from old pages
        const messageIdsToDelete = oldPageIndexes.flatMap(idx => idx.messageIds);
        const emailKeysToDelete = messageIdsToDelete.map(mid => buildEmailKey(userId, boxName, mid));
        const pageKeysToDelete = oldPageIndexes.map(idx => idx.id);
        
        await emailDB.db.transaction('rw', emailDB.emails, emailDB.emailPageIndexes, async () => {
            if (emailKeysToDelete.length > 0) {
                await emailDB.emails.bulkDelete(emailKeysToDelete);
            }
            if (pageKeysToDelete.length > 0) {
                await emailDB.emailPageIndexes.bulkDelete(pageKeysToDelete);
            }
        });
        
        console.log(`[EmailCache] Deleted ${emailKeysToDelete.length} emails from old pages`);
    } catch (err) {
        console.warn('[EmailCache] prunePaginationWindow failed silently', err);
    }
}

/**
 * 4️. USER LOGOUT CLEANUP
 * Already implemented as clearUserEmailCache
 */

/**
 * 5️. MANUAL CACHE REFRESH
 * Force refresh specific mailbox or entire cache
 */
export async function refreshCache(userId: string, boxName?: string): Promise<void> {
    try {
        if (boxName) {
            // Refresh specific mailbox
            await invalidateBoxCache(userId, boxName);
            console.log(`[EmailCache] Refreshed cache for ${boxName}`);
        } else {
            // Refresh all user data
            await clearUserEmailCache(userId);
            console.log(`[EmailCache] Refreshed all cache for user ${userId}`);
        }
    } catch (err) {
        console.warn('[EmailCache] refreshCache failed silently', err);
    }
}

/**
 * COMPREHENSIVE CACHE MANAGEMENT
 * Run all cleanup strategies - call this periodically
 */
export async function manageCache(): Promise<void> {
    try {
        console.log('[EmailCache] Starting comprehensive cache management...');
        
        // 1. TTL-based cleanup
        await pruneStaleEmailCache();
        
        // 2. Get all user-mailbox combinations for size limit check
        const allIndexes = await emailDB.emailPageIndexes.toArray();
        const userMailboxCombos = new Set(
            allIndexes.map(idx => `${idx.userId}|${idx.boxName}`)
        );
        
        // 3. Size limit management for each mailbox
        for (const combo of userMailboxCombos) {
            const [userId, boxName] = combo.split('|');
            await enforceSizeLimit(userId, boxName);
        }
        
        console.log('[EmailCache] Comprehensive cache management completed');
    } catch (err) {
        console.warn('[EmailCache] manageCache failed silently', err);
    }
}

/**
 * Get cache statistics for monitoring
 */
export async function getCacheStats(): Promise<{
    totalEmails: number;
    totalPages: number;
    totalSize: number;
    mailboxStats: Record<string, { emailCount: number; pageCount: number }>;
}> {
    try {
        const totalEmails = await emailDB.emails.count();
        const totalPages = await emailDB.emailPageIndexes.count();
        const totalSize = await emailDB.getDatabaseSize();
        
        // Per-mailbox statisticsLL
        const allIndexes = await emailDB.emailPageIndexes.toArray();
        const mailboxStats: Record<string, { emailCount: number; pageCount: number }> = {};
        
        for (const index of allIndexes) {
            const key = `${index.userId}|${index.boxName}`;
            if (!mailboxStats[key]) {
                mailboxStats[key] = { emailCount: 0, pageCount: 0 };
            }
            mailboxStats[key].pageCount++;
            mailboxStats[key].emailCount += index.messageIds.length;
        }
        
        return { totalEmails, totalPages, totalSize, mailboxStats };
    } catch (err) {
        console.warn('[EmailCache] getCacheStats failed', err);
        return { totalEmails: 0, totalPages: 0, totalSize: 0, mailboxStats: {} };
    }
}