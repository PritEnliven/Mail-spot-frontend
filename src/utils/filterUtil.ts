import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { attachmentSizeLabelToApiType } from '@constants/attachmentSizeOptions';
import { formatDate, TimeFormat } from '@utils/dateUtil';

export function getAppliedFilterCount(filter: FilterEmailFormValues | null): number {
    if (!filter) return 0;

    let count = 0;

    if (filter.from?.length) count++;
    if (filter.to?.length) count++;
    if (filter.subject?.trim()) count++;
    if (filter.attachmentSize) count++;
    if (filter.dateRange?.length) count++;

    return count;
}

type BuildSearchFilterPayloadOptions = {
    searchText?: string;
    filterForm?: FilterEmailFormValues | null;
    limit?: number;
    cursor?: string;
    direction?: 'next' | 'prev';
    vPage?: number;
};

export function buildSearchFilterPayload({
    searchText = '',
    filterForm = null,
    limit,
    cursor,
    direction,
    vPage,
}: BuildSearchFilterPayloadOptions): Record<string, unknown> {
    const trimmedSearch = searchText.trim();
    const payload: Record<string, unknown> = {};

    if (limit !== undefined) payload.limit = limit;
    if (cursor !== undefined) payload.cursor = cursor;
    if (direction !== undefined) payload.direction = direction;
    if (vPage !== undefined) payload.vPage = vPage;

    const hasStructuredFilters = Boolean(filterForm && getAppliedFilterCount(filterForm) > 0);

    if (trimmedSearch && !hasStructuredFilters) {
        payload.searchTerm = trimmedSearch;
        payload.searchQuery = trimmedSearch;
    }

    if (filterForm) {
        payload.isFilter = true;

        if (filterForm.from?.length) payload.from = filterForm.from;
        if (filterForm.to?.length) payload.to = filterForm.to;
        if (filterForm.subject?.trim()) payload.subject = filterForm.subject.trim();

        const attachmentSizeType = attachmentSizeLabelToApiType(filterForm.attachmentSize);
        if (attachmentSizeType) payload.attachmentSizeType = attachmentSizeType;

        if (filterForm.dateRange?.length === 1) {
            payload.dateRange = formatDate(filterForm.dateRange[0] as Date, TimeFormat.DD_MM_YYYY);
        } else if (filterForm.dateRange?.length === 2) {
            payload.dateRange = `${formatDate(filterForm.dateRange[0] as Date, TimeFormat.DD_MM_YYYY)} to ${formatDate(filterForm.dateRange[1] as Date, TimeFormat.DD_MM_YYYY)}`;
        }
    }

    return payload;
}
