import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import { getAppliedFilterCount } from '@utils/filterUtil';
import {
    extractFreeTextSearchTerm,
    isStructuredFilterQuery,
    parseFilterQueryToFormValues,
} from '@utils/searchQueryParser';

export {
    extractFreeTextSearchTerm,
    isStructuredFilterQuery,
    parseFilterQuery,
    parseFilterQueryToFormValues,
} from '@utils/searchQueryParser';
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
        parts.push(`subject:${filter.subject.trim()}`);
    }

    if (filter.attachmentSize) {
        parts.push(`size:${filter.attachmentSize}`);
    }

    if (filter.dateRange?.length === 1) {
        const formatted = formatDate(filter.dateRange[0], TimeFormat.DDMMYYYY);
        if (formatted) parts.push(`date:${formatted}`);
    } 
    else if (filter.dateRange?.length === 2) {
        const from = formatDate(filter.dateRange[0], TimeFormat.DDMMYYYY);
        const to = formatDate(filter.dateRange[1], TimeFormat.DDMMYYYY);
        if (from && to) parts.push(`date:${from}to${to}`);
    }

    return parts.join(' ');
}

export function buildDisplaySearchQuery(
    filterForm: FilterEmailFormValues | null | undefined,
    freeTextSearchTerm?: string | null,
): string {
    const filterPart =
        filterForm && getAppliedFilterCount(filterForm) > 0
            ? buildSearchQueryFromFilters(filterForm)
            : '';
    const searchPart = freeTextSearchTerm?.trim() ?? '';

    if (filterPart && searchPart) return `${searchPart} ${filterPart}`;
    return filterPart || searchPart;
}

export function parseSearchQueryToFilters(query: string): Partial<FilterEmailFormValues> {
    return parseFilterQueryToFormValues(query);
}

export function resolveSearchFromQuery(
    query: string,
    activeFilterForm: FilterEmailFormValues | null = null,
): {
    filterForm: FilterEmailFormValues | null;
    searchTerm: string;
} {
    const trimmed = query.trim();
    if (!trimmed) {
        return { filterForm: null, searchTerm: '' };
    }

    if (isStructuredFilterQuery(trimmed)) {
        const parsed = parseFilterQueryToFormValues(trimmed);
        const filterForm: FilterEmailFormValues = {
            from: parsed.from ?? [],
            to: parsed.to ?? [],
            subject: parsed.subject ?? '',
            attachmentSize: parsed.attachmentSize,
            dateRange: parsed.dateRange,
        };

        if (getAppliedFilterCount(filterForm) > 0) {
            return {
                filterForm,
                searchTerm: extractFreeTextSearchTerm(trimmed),
            };
        }
    }

    if (activeFilterForm && getAppliedFilterCount(activeFilterForm) > 0) {
        return { filterForm: activeFilterForm, searchTerm: trimmed };
    }

    return { filterForm: null, searchTerm: trimmed };
}
