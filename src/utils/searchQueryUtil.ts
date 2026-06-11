import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { isValidAttachmentSizeLabel } from '@constants/attachmentSizeOptions';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import moment from 'moment';

const FILTER_KEYS = ['from', 'to', 'subject', 'size', 'date'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

function extractBalancedParenValue(input: string, openParenIndex: number): string | null {
    if (input[openParenIndex] !== '(') return null;

    let depth = 0;
    for (let i = openParenIndex; i < input.length; i++) {
        if (input[i] === '(') depth++;
        else if (input[i] === ')') {
            depth--;
            if (depth === 0) {
                return input.slice(openParenIndex + 1, i);
            }
        }
    }
    return null;
}

function findFilterTokens(query: string): Array<{ key: FilterKey; value: string }> {
    const tokens: Array<{ key: FilterKey; value: string }> = [];
    const keyPattern = new RegExp(`\\b(${FILTER_KEYS.join('|')}):\\(`, 'g');
    let match: RegExpExecArray | null;

    while ((match = keyPattern.exec(query)) !== null) {
        const key = match[1] as FilterKey;
        const openParenIndex = match.index + match[0].length - 1;
        const value = extractBalancedParenValue(query, openParenIndex);
        if (value === null) continue;

        tokens.push({ key, value });
        keyPattern.lastIndex = openParenIndex + value.length + 2;
    }

    return tokens;
}

function parseDateRangeValue(value: string): Date[] | undefined {
    const parts = value.split(/\s+to\s+/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return undefined;

    const dates = parts
        .map((part) => moment(part, ['DD/MM/YYYY', 'DD-MM-YYYY'], true))
        .filter((m) => m.isValid())
        .map((m) => m.toDate());

    return dates.length > 0 ? dates : undefined;
}

export function buildSearchQueryFromFilters(filter: FilterEmailFormValues): string {
    const parts: string[] = [];

    filter.from?.forEach((email) => {
        if (email.trim()) parts.push(`from:(${email.trim()})`);
    });

    filter.to?.forEach((email) => {
        if (email.trim()) parts.push(`to:(${email.trim()})`);
    });

    if (filter.subject?.trim()) {
        parts.push(`subject:(${filter.subject.trim()})`);
    }

    if (filter.attachmentSize) {
        parts.push(`size:(${filter.attachmentSize})`);
    }

    if (filter.dateRange?.length === 1) {
        const formatted = formatDate(filter.dateRange[0], TimeFormat.DDMMYYYY);
        if (formatted) parts.push(`date:(${formatted})`);
    } else if (filter.dateRange?.length === 2) {
        const from = formatDate(filter.dateRange[0], TimeFormat.DDMMYYYY);
        const to = formatDate(filter.dateRange[1], TimeFormat.DDMMYYYY);
        if (from && to) parts.push(`date:(${from} to ${to})`);
    }

    return parts.join(' ');
}

export function parseSearchQueryToFilters(query: string): Partial<FilterEmailFormValues> {
    const result: Partial<FilterEmailFormValues> = {};
    const tokens = findFilterTokens(query);

    const fromEmails: string[] = [];
    const toEmails: string[] = [];

    for (const { key, value } of tokens) {
        switch (key) {
            case 'from':
                if (value.trim()) fromEmails.push(value.trim());
                break;
            case 'to':
                if (value.trim()) toEmails.push(value.trim());
                break;
            case 'subject':
                if (value.trim()) result.subject = value.trim();
                break;
            case 'size':
                if (isValidAttachmentSizeLabel(value.trim())) {
                    result.attachmentSize = value.trim();
                }
                break;
            case 'date': {
                const dateRange = parseDateRangeValue(value);
                if (dateRange) result.dateRange = dateRange;
                break;
            }
        }
    }

    if (fromEmails.length) result.from = fromEmails;
    if (toEmails.length) result.to = toEmails;

    return result;
}
