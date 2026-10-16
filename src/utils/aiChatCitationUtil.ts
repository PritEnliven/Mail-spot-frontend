import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import type { AiChatCitation } from '@services/aiService/aiChatService';

/** Header title used when AI sources are shown in the main mail list. */
export const AI_SOURCES_BOX_TITLE = 'AI Sources';

/**
 * Map AI chat citations into Email-shaped rows for the main mail list
 * (same list UI as search results).
 */
export function mapAiCitationsToEmails(citations: AiChatCitation[]): Email[] {
    return (citations ?? [])
        .filter((c) => Boolean(c?.mongoId))
        .map((c, i) => {
            const mongoId = c.mongoId || `ai-cite-${i}`;
            const fromValue = (c.from || '').trim();
            const toValue = (c.to || '').trim();

            return {
                id: mongoId,
                _id: mongoId,
                uid: 0,
                messageId: c.messageId || mongoId,
                threadId: c.threadId || c.messageId || mongoId,
                from: fromValue ? [{ name: '', email: fromValue }] : [],
                to: toValue ? [{ name: '', email: toValue }] : [],
                cc: [],
                bcc: [],
                subject: c.subject?.trim() || '(No subject)',
                flags: [],
                isSeen: true,
                body: '',
                bodyText: c.snippet?.trim() || '',
                threadCount: 1,
                remainingAttachments: 0,
                attachments: [],
                userId: '',
                service: '',
                boxName: c.boxName ? [c.boxName] : [],
                isBodyHtml: false,
                customBoxes: [],
                date: c.date || new Date().toISOString(),
                relativeDate: null,
                isSearchEmail: true,
            } as Email;
        });
}

export function buildAiSourcesPagination(total: number): Pagination {
    const count = Math.max(0, total);
    return {
        currentPage: 1,
        totalPages: 1,
        totalEmails: count,
        emailsPerPage: Math.max(count, 1),
        lastMailId: '',
        firstMailId: '',
        hasNextPage: false,
        hasPreviousPage: false,
        startCount: count > 0 ? 1 : 0,
        endCount: count,
        unreadCount: 0,
    };
}

/** Resolve folder for opening a list row that may come from AI / search. */
export function resolveEmailOpenBoxName(
    email: Email | undefined | null,
    fallbackBoxName: string,
): string {
    if (!email) return fallbackBoxName;
    const boxes = email.boxName;
    if (Array.isArray(boxes) && boxes.length > 0 && boxes[0]) {
        return String(boxes[0]);
    }
    if (typeof boxes === 'string' && boxes) {
        return boxes;
    }
    return fallbackBoxName;
}
