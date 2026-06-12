import { describe, expect, it } from 'vitest';
import { buildSearchFilterPayload } from '@utils/filterUtil';
import { resolveSearchFromQuery } from './searchQueryUtil';

describe('resolveSearchFromQuery', () => {
    it('combines parsed filters with trailing free-text search term', () => {
        const result = resolveSearchFromQuery('from:(user@mail.com) meeting notes');

        expect(result.filterForm?.from).toEqual(['user@mail.com']);
        expect(result.searchTerm).toBe('meeting notes');
    });

    it('keeps active filters when user types only free text', () => {
        const activeFilter = {
            from: ['user@mail.com'],
            to: [],
            subject: '',
            dateRange: undefined,
        };

        const result = resolveSearchFromQuery('meeting notes', activeFilter);

        expect(result.filterForm).toEqual(activeFilter);
        expect(result.searchTerm).toBe('meeting notes');
    });

    it('returns keyword-only search when no filters are active', () => {
        expect(resolveSearchFromQuery('meeting notes')).toEqual({
            filterForm: null,
            searchTerm: 'meeting notes',
        });
    });
});

describe('buildSearchFilterPayload', () => {
    it('sends searchTerm together with structured filters', () => {
        const payload = buildSearchFilterPayload({
            searchText: 'meeting notes',
            filterForm: {
                from: ['user@mail.com'],
                to: [],
                subject: '',
            },
        });

        expect(payload.searchTerm).toBe('meeting notes');
        expect(payload.from).toEqual(['user@mail.com']);
        expect(payload.isFilter).toBe(true);
        expect(payload.searchQuery).toBeUndefined();
    });
});
