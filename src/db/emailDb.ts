import Dexie from 'dexie';
import type { Email } from '@models/Email';

export interface CachedEmail extends Email {
  _cacheKey: string;
  cacheBoxName: string;
  fetchedAt: number;
}

export interface EmailPageIndex {
  /** Primary key: "{userId}|{boxName}|{page}|{mailAction}" */
  id: string;
  userId: string;
  boxName: string;
  page: number;
  mailAction: string;
  messageIds: string[];
  lastMailId: string;
  firstMailId: string;
  totalEmails: number;
  unreadCount: number;
  fetchedAt: number;
}

// Create the database instance
const db = new Dexie('MailSpotDb');

// Define the schema
db.version(2).stores({
  /**
   * _cacheKey     — primary key
   * userId        — for per-user isolation & bulk-delete on logout
   * [userId+cacheBoxName] — compound index for box-level queries
   * fetchedAt     — for TTL pruning
   */
  emails: '_cacheKey, userId, [userId+cacheBoxName], fetchedAt',

  /**
   * id               — primary key
   * userId           — logout cleanup
   * [userId+boxName] — box-level invalidation
   * fetchedAt        — TTL pruning
   * unreadCount      — for proper unread count tracking
   */
  emailPageIndexes: 'id, userId, [userId+boxName], fetchedAt, unreadCount',
});

export const emails = db.table<CachedEmail, string>('emails');
export const emailPageIndexes = db.table<EmailPageIndex, string>('emailPageIndexes');

export { db };

export const emailDB = {
  emails,
  emailPageIndexes,
  db,
  
  // Helper methods
  async clearUserData(userId: string) {
    return db.transaction('rw', emails, emailPageIndexes, async () => {
      await emails.where('userId').equals(userId).delete();
      await emailPageIndexes.where('userId').equals(userId).delete();
    });
  },
  
  async clearBoxData(userId: string, boxName: string) {
    return db.transaction('rw', emails, emailPageIndexes, async () => {
      await emails.where('[userId+cacheBoxName]').equals([userId, boxName]).delete();
      await emailPageIndexes.where('[userId+boxName]').equals([userId, boxName]).delete();
    });
  },
  
  async getDatabaseSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    return 0;
  }
};