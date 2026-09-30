export const ARRANGE_BY = {
    DATE: 'date',
    FROM: 'from',
    TO: 'to',
    SUBJECT: 'subject',
    SIZE: 'size',
} as const;

export type ArrangeBy = (typeof ARRANGE_BY)[keyof typeof ARRANGE_BY];

export const SORT_ORDER = {
    ASC: 'asc',
    DESC: 'desc',
} as const;

export type SortOrder = (typeof SORT_ORDER)[keyof typeof SORT_ORDER];

export const ARRANGE_BY_OPTIONS: { value: ArrangeBy; label: string }[] = [
    { value: ARRANGE_BY.DATE, label: 'Date' },
    { value: ARRANGE_BY.FROM, label: 'From' },
    { value: ARRANGE_BY.TO, label: 'To' },
    { value: ARRANGE_BY.SUBJECT, label: 'Subject' },
    { value: ARRANGE_BY.SIZE, label: 'Size' },
];

/** Defaults when arrangeBy is set and sortOrder is omitted. */
export const DEFAULT_SORT_ORDER: Record<ArrangeBy, SortOrder> = {
    [ARRANGE_BY.DATE]: SORT_ORDER.DESC,
    [ARRANGE_BY.SIZE]: SORT_ORDER.DESC,
    [ARRANGE_BY.FROM]: SORT_ORDER.ASC,
    [ARRANGE_BY.TO]: SORT_ORDER.ASC,
    [ARRANGE_BY.SUBJECT]: SORT_ORDER.ASC,
};

export function getSortOptions(arrangeBy: ArrangeBy): { value: SortOrder; label: string }[] {
    switch (arrangeBy) {
        case ARRANGE_BY.DATE:
            return [
                { value: SORT_ORDER.DESC, label: 'Newest to oldest' },
                { value: SORT_ORDER.ASC, label: 'Oldest to newest' },
            ];
        case ARRANGE_BY.SIZE:
            return [
                { value: SORT_ORDER.DESC, label: 'Largest on top' },
                { value: SORT_ORDER.ASC, label: 'Smallest on top' },
            ];
        case ARRANGE_BY.FROM:
        case ARRANGE_BY.TO:
        case ARRANGE_BY.SUBJECT:
        default:
            return [
                { value: SORT_ORDER.ASC, label: 'A–Z' },
                { value: SORT_ORDER.DESC, label: 'Z–A' },
            ];
    }
}

export function isArrangeBy(value: unknown): value is ArrangeBy {
    return typeof value === 'string' && Object.values(ARRANGE_BY).includes(value as ArrangeBy);
}

export function isSortOrder(value: unknown): value is SortOrder {
    return value === SORT_ORDER.ASC || value === SORT_ORDER.DESC;
}
