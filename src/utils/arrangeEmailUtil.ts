import {
    ARRANGE_BY,
    DEFAULT_SORT_ORDER,
    type ArrangeBy,
    type SortOrder,
} from '@constants/arrangeBy';
import type { Email } from '@models/Email';
import { getParticipantsLabel, getSenderLabel } from '@utils/emailUtil';

export interface ArrangeGroupMeta {
    groupKey: string;
    groupLabel: string;
}

const SIZE_BUCKETS: { max: number; key: string; label: string }[] = [
    { max: 10 * 1024, key: 'tiny', label: 'Tiny' },
    { max: 25 * 1024, key: 'small', label: 'Small' },
    { max: 100 * 1024, key: 'medium', label: 'Medium' },
    { max: 500 * 1024, key: 'large', label: 'Large' },
    { max: 1024 * 1024, key: 'very-large', label: 'Very Large' },
    { max: Number.POSITIVE_INFINITY, key: 'huge', label: 'Huge' },
];

function startOfLocalDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseEmailDate(value: unknown): Date | null {
    if (!value) return null;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateArrangeGroup(email: Email, now = new Date()): ArrangeGroupMeta {
    const date = parseEmailDate(email.date) ?? now;
    const today = startOfLocalDay(now);
    const mailDay = startOfLocalDay(date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    if (mailDay.getTime() === today.getTime()) {
        return { groupKey: 'today', groupLabel: 'Today' };
    }
    if (mailDay.getTime() === yesterday.getTime()) {
        return { groupKey: 'yesterday', groupLabel: 'Yesterday' };
    }
    if (mailDay >= monthStart && mailDay < today) {
        return { groupKey: 'this-month', groupLabel: 'This Month' };
    }
    if (mailDay.getFullYear() === today.getFullYear()) {
        const label = mailDay.toLocaleString('en-US', { month: 'long' });
        return {
            groupKey: `month-${mailDay.getFullYear()}-${mailDay.getMonth()}`,
            groupLabel: label,
        };
    }
    return { groupKey: 'older', groupLabel: 'Older' };
}

function getSizeArrangeGroup(email: Email): ArrangeGroupMeta {
    const size = typeof email.size === 'number' && Number.isFinite(email.size) ? email.size : 0;
    const bucket = SIZE_BUCKETS.find((b) => size <= b.max) ?? SIZE_BUCKETS[SIZE_BUCKETS.length - 1];
    return { groupKey: bucket.key, groupLabel: bucket.label };
}

/** Prefer server-provided group meta when present; otherwise derive from arrangeBy. */
export function getEmailArrangeGroup(
    email: Email,
    arrangeBy: ArrangeBy,
    existingList: Email[] = [],
): ArrangeGroupMeta {
    if (email.groupKey && email.groupLabel) {
        return { groupKey: email.groupKey, groupLabel: email.groupLabel };
    }

    let meta: ArrangeGroupMeta;
    switch (arrangeBy) {
        case ARRANGE_BY.DATE:
            meta = getDateArrangeGroup(email);
            break;
        case ARRANGE_BY.FROM: {
            const label = getSenderLabel(email.from) || '(No Sender)';
            meta = { groupKey: `from:${label.toLowerCase()}`, groupLabel: label };
            break;
        }
        case ARRANGE_BY.TO: {
            const label = getParticipantsLabel(email.to) || '(No Recipients)';
            meta = { groupKey: `to:${label.toLowerCase()}`, groupLabel: label };
            break;
        }
        case ARRANGE_BY.SUBJECT: {
            const label = (email.subject || '').trim() || '(No Subject)';
            meta = { groupKey: `subject:${label.toLowerCase()}`, groupLabel: label };
            break;
        }
        case ARRANGE_BY.SIZE:
            meta = getSizeArrangeGroup(email);
            break;
        default:
            meta = getDateArrangeGroup(email);
    }

    // Reuse an existing row's groupKey when the label already appears in the list
    // so realtime inserts share the same section header as the API response.
    const existing = existingList.find(
        (e) => e.groupLabel && e.groupKey && e.groupLabel === meta.groupLabel,
    );
    if (existing?.groupKey && existing.groupLabel) {
        return { groupKey: existing.groupKey, groupLabel: existing.groupLabel };
    }

    return meta;
}

export function withArrangeMeta(email: Email, arrangeBy: ArrangeBy, existingList: Email[] = []): Email {
    const meta = getEmailArrangeGroup(email, arrangeBy, existingList);
    return {
        ...email,
        groupKey: meta.groupKey,
        groupLabel: meta.groupLabel,
    };
}

function getSortValue(email: Email, arrangeBy: ArrangeBy): string | number {
    switch (arrangeBy) {
        case ARRANGE_BY.DATE:
            return parseEmailDate(email.date)?.getTime() ?? 0;
        case ARRANGE_BY.FROM:
            return (getSenderLabel(email.from) || '').toLowerCase();
        case ARRANGE_BY.TO:
            return (getParticipantsLabel(email.to) || '').toLowerCase();
        case ARRANGE_BY.SUBJECT:
            return (email.subject || '').trim().toLowerCase();
        case ARRANGE_BY.SIZE:
            return typeof email.size === 'number' && Number.isFinite(email.size) ? email.size : 0;
        default:
            return parseEmailDate(email.date)?.getTime() ?? 0;
    }
}

export function compareArrangedEmails(
    a: Email,
    b: Email,
    arrangeBy: ArrangeBy,
    sortOrder: SortOrder,
): number {
    const direction = sortOrder === 'asc' ? 1 : -1;
    const av = getSortValue(a, arrangeBy);
    const bv = getSortValue(b, arrangeBy);

    let primary = 0;
    if (typeof av === 'number' && typeof bv === 'number') {
        primary = av === bv ? 0 : av < bv ? -1 : 1;
    } else {
        primary = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
    }

    if (primary !== 0) return primary * direction;

    // Stable secondary: newer date first within the same arrange value
    const ad = parseEmailDate(a.date)?.getTime() ?? 0;
    const bd = parseEmailDate(b.date)?.getTime() ?? 0;
    if (ad !== bd) return bd - ad;

    return String(a.messageId || '').localeCompare(String(b.messageId || ''));
}

/** Mark first row of each contiguous groupKey as isGroupStart. */
export function recomputeGroupStarts(emails: Email[]): Email[] {
    return emails.map((email, index) => {
        const prev = index > 0 ? emails[index - 1] : null;
        const isGroupStart = !prev || prev.groupKey !== email.groupKey;
        if (email.isGroupStart === isGroupStart) return email;
        return { ...email, isGroupStart };
    });
}

/**
 * Append a server page onto an arranged list without re-sorting existing rows.
 * Dedupes by messageId, then refreshes group-start flags across the boundary.
 */
export function appendArrangedPage(prev: Email[], nextPage: Email[]): Email[] {
    if (!nextPage.length) return prev;

    const seen = new Set<string>();
    for (const email of prev) {
        if (email?.messageId) seen.add(email.messageId);
    }

    const toAppend: Email[] = [];
    for (const email of nextPage) {
        if (!email?.messageId || seen.has(email.messageId)) continue;
        seen.add(email.messageId);
        toAppend.push(email);
    }

    if (toAppend.length === 0) return prev;
    return recomputeGroupStarts([...prev, ...toAppend]);
}

/**
 * Upsert incoming emails into an arranged list: assign group labels, sort by
 * arrangeBy/sortOrder, and refresh isGroupStart flags.
 */
export function mergeIntoArrangedList(
    prev: Email[],
    incoming: Email[],
    arrangeBy: ArrangeBy,
    sortOrder?: SortOrder | null,
): Email[] {
    const order = sortOrder ?? DEFAULT_SORT_ORDER[arrangeBy];
    const byId = new Map<string, Email>();

    for (const email of prev) {
        if (email?.messageId) byId.set(email.messageId, email);
    }

    for (const raw of incoming) {
        if (!raw?.messageId) continue;
        const existing = byId.get(raw.messageId);
        const merged = existing ? { ...existing, ...raw } : { ...raw };
        byId.set(raw.messageId, withArrangeMeta(merged, arrangeBy, prev));
    }

    // Ensure every row has group meta (covers older rows missing fields)
    const annotated = Array.from(byId.values()).map((email) =>
        email.groupKey && email.groupLabel ? email : withArrangeMeta(email, arrangeBy, prev),
    );

    annotated.sort((a, b) => compareArrangedEmails(a, b, arrangeBy, order));
    return recomputeGroupStarts(annotated);
}
