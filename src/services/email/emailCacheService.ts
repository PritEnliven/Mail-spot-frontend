import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import {
    deleteEmailsFromCache,
    getEmailPageFromCache,
    invalidateBoxCache,
    saveEmailPageToCache,
    updateEmailReadStateInCache,
} from '../../db/emailCacheRepository';
import { getEmailsService } from './emailService';

// Temporary bypass for get-emails: force network reads and skip IndexedDB writes.
// Set this back to false to restore cache-first behavior.
const TEMP_DISABLE_EMAIL_INDEXEDDB_CACHE = true;

export interface FetchEmailsParams {
    userId: string;
    boxName: string;
    page: number;
    lastMailId: string;
    firstMailId: string;
    totalCount: number | null;
    mailAction: string;
    isPrevious?: boolean;
    /** Pass true to skip cache and force an API call (e.g. pull-to-refresh) */
    forceRefresh?: boolean;
}

export interface FetchEmailsResult {
    emails: Email[];
    pagination: Pagination;
    /** True when the response came from IndexedDB, not the network */
    fromCache: boolean;
}

/**
 * Cache-first email fetcher.
 *
 * Strategy:
 *   1. Only 'all' mailAction is cached — 'read' / 'unread' filters are
 *      too dynamic to cache safely without complex invalidation logic.
 *   2. Check IndexedDB for the requested page.
 *   3. On a hit (and within TTL), return instantly from cache.
 *   4. On a miss, call the API, persist the result, then return it.
 */
export async function fetchEmailsWithCache(
    params: FetchEmailsParams
): Promise<FetchEmailsResult> {
    const {
        userId,
        boxName,
        page,
        lastMailId,
        firstMailId,
        totalCount,
        mailAction,
        isPrevious,
        forceRefresh = false,
    } = params;

    const isCacheable = mailAction === 'all' && !TEMP_DISABLE_EMAIL_INDEXEDDB_CACHE;

    // ── 1. Try cache ────────────────────────────────────────────────────────────
    if (isCacheable && !forceRefresh) {
        const cached = await getEmailPageFromCache(userId, boxName, page, mailAction);
        if (cached) {
            return { emails: cached.emails, pagination: cached.pagination, fromCache: true };
        }
    }

    // ── 2. Cache miss → API ─────────────────────────────────────────────────────
    const payload = {
        current_active_box: boxName,
        vPage: page,
        lastMailId: page === 1 ? '' : isPrevious ? '' : lastMailId,
        firstMailId: page === 1 ? '' : isPrevious ? firstMailId : '',
        totalCount: page === 1 ? null : totalCount,
        mailAction,
    };

    const response = await getEmailsService(payload);
    if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch emails (status ${response.statusCode})`);
    }

    const emailList: Email[] = response.data.emailList ?? [];
    const pagination: Pagination = response.data.pagination;

    // ── 3. Persist to cache ─────────────────────────────────────────────────────
    if (isCacheable) {
        // Fire-and-forget — we never want a DB write to slow down the UI
        void saveEmailPageToCache(userId, boxName, page, mailAction, emailList, {
            lastMailId: pagination.lastMailId,
            firstMailId: pagination.firstMailId,
            totalEmails: pagination.totalEmails,
            unreadCount: pagination.unreadCount,
        });
    }

    return { emails: emailList, pagination, fromCache: false };
}

// ─── Mutation helpers (call alongside your existing state mutations) ──────────

export async function saveEmailPageToCacheWrapper(
    userId: string,
    boxName: string,
    page: number,
    mailAction: string,
    emails: Email[],
    pagination: Pick<Pagination, 'lastMailId' | 'firstMailId' | 'totalEmails' | 'unreadCount'>
): Promise<void> {
    await saveEmailPageToCache(userId, boxName, page, mailAction, emails, pagination);
}

export async function markEmailsReadInCache(
    userId: string,
    boxName: string,
    messageIds: string[],
    isRead: boolean
): Promise<void> {
    await updateEmailReadStateInCache(userId, boxName, messageIds, isRead);
}

export async function removeEmailsFromCache(
    userId: string,
    boxName: string,
    messageIds: string[]
): Promise<void> {
    await deleteEmailsFromCache(userId, boxName, messageIds);
}

export async function invalidateMailboxCache(
    userId: string,
    boxName: string
): Promise<void> {
    await invalidateBoxCache(userId, boxName);
}
