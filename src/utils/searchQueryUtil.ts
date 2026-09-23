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

    if (filter.hasWord?.trim()) {
        parts.push(`hasWord:(${filter.hasWord.trim()})`);
    }

    if (filter.doesNotHave?.trim()) {
        parts.push(`doesNotHave:(${filter.doesNotHave.trim()})`);
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

    if (filter.boxName?.trim()) {
        parts.push(`in:(${filter.boxName.trim()})`);
    }

    return parts.join(' ');
}

/** Strip free-text tokens already represented in From/To/Has the words so they are not duplicated. */
export function omitFilterCoveredFreeText(
    freeText: string | null | undefined,
    filter: FilterEmailFormValues | null | undefined,
): string {
    let text = freeText?.trim() ?? '';
    if (!text || !filter) return text;

    const coveredEmails = [...(filter.from ?? []), ...(filter.to ?? [])]
        .map((email) => email.trim())
        .filter(Boolean);

    for (const email of coveredEmails) {
        const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escaped, 'gi'), ' ');
    }

    const hasWord = filter.hasWord?.trim();
    if (hasWord) {
        const escaped = hasWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Whole phrase only — a short hasWord like "r" must not eat letters inside "raj".
        text = text.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, 'gi'), '$1');
    }

    return text.replace(/\s+/g, ' ').trim();
}

function emptyFilterForm(): FilterEmailFormValues {
    return {
        from: [],
        to: [],
        subject: '',
        hasWord: '',
        doesNotHave: '',
        attachmentSize: undefined,
        dateRange: undefined,
        boxName: '',
    };
}

function isPlainDateSearchTerm(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const compactRange = trimmed.match(/^(\d{2}[/-]\d{2}[/-]\d{4})to(\d{2}[/-]\d{2}[/-]\d{4})$/i);
    if (compactRange) {
        return true;
    }

    const parts = trimmed.split(/\s+to\s+/i).map((part) => part.trim()).filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return false;

    return parts.every((part) => /^\d{2}[/-]\d{2}[/-]\d{4}$/.test(part));
}

/**
 * Used when opening the filter panel: map leftover free text into Has the words.
 * Plain dates stay out of Has the words. An email with no from: or to: keyword
 * is free text and goes into Has the words.
 */
export function promoteSearchQueryToFilterForm(
    query: string,
    activeFilterForm: FilterEmailFormValues | null = null,
): {
    filterForm: FilterEmailFormValues | null;
    searchTerm: string;
} {
    const resolved = resolveSearchFromQuery(query, activeFilterForm);
    let filterForm = resolved.filterForm;
    let searchTerm = resolved.searchTerm.trim();

    if (!searchTerm) {
        return resolved;
    }

    // Plain dates should not fill "Has the words"
    if (isPlainDateSearchTerm(searchTerm)) {
        return resolved;
    }

    const base = filterForm ?? emptyFilterForm();
    if (base.hasWord?.trim()) {
        return {
            filterForm: base,
            searchTerm: omitFilterCoveredFreeText(searchTerm, base),
        };
    }

    filterForm = {
        ...base,
        hasWord: searchTerm,
    };

    return {
        filterForm,
        searchTerm: '',
    };
}

export function buildDisplaySearchQuery(
    filterForm: FilterEmailFormValues | null | undefined,
    freeTextSearchTerm?: string | null,
): string {
    const filterPart =
        filterForm && getAppliedFilterCount(filterForm) > 0
            ? buildSearchQueryFromFilters(filterForm)
            : '';
    const searchPart = omitFilterCoveredFreeText(freeTextSearchTerm, filterForm);

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
            hasWord: parsed.hasWord ?? '',
            doesNotHave: parsed.doesNotHave ?? '',
            attachmentSize: parsed.attachmentSize,
            dateRange: parsed.dateRange,
            boxName: parsed.boxName ?? '',
        };

        if (getAppliedFilterCount(filterForm) > 0) {
            return {
                filterForm,
                searchTerm: extractFreeTextSearchTerm(trimmed),
            };
        }
    }

    if (activeFilterForm && getAppliedFilterCount(activeFilterForm) > 0) {
        return {
            filterForm: activeFilterForm,
            searchTerm: omitFilterCoveredFreeText(trimmed, activeFilterForm),
        };
    }

    return { filterForm: null, searchTerm: trimmed };
}
