import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import { parseFilterQueryToFormValues } from '@utils/searchQueryParser';

export { parseFilterQuery, parseFilterQueryToFormValues } from '@utils/searchQueryParser';
export type { ParsedFilterQuery } from '@utils/searchQueryParser';

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
    return parseFilterQueryToFormValues(query);
}
