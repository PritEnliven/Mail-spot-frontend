import type { FilterOperatorKey } from './types';

export type FilterOperatorDef = {
    key: FilterOperatorKey;
    /** Gmail-style alias in query string (size maps to attachmentSize) */
    aliases: string[];
};

export const FILTER_OPERATORS: FilterOperatorDef[] = [
    { key: 'from', aliases: ['from'] },
    { key: 'to', aliases: ['to'] },
    { key: 'subject', aliases: ['subject'] },
    { key: 'size', aliases: ['size'] },
    { key: 'date', aliases: ['date'] },
];

const ALIAS_TO_KEY = new Map<string, FilterOperatorKey>(
    FILTER_OPERATORS.flatMap((op) => op.aliases.map((alias) => [alias, op.key]))
);

export function resolveOperatorKey(alias: string): FilterOperatorKey | undefined {
    return ALIAS_TO_KEY.get(alias.toLowerCase());
}

export function buildOperatorPattern(): RegExp {
    const aliases = FILTER_OPERATORS.flatMap((op) => op.aliases).join('|');
    return new RegExp(`\\b(${aliases}):`, 'gi');
}
