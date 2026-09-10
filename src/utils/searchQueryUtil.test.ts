import { describe, expect, it } from 'vitest';
import { buildSearchFilterPayload } from '@utils/filterUtil';
import { buildDisplaySearchQuery, resolveSearchFromQuery } from './searchQueryUtil';

describe('resolveSearchFromQuery', () => {
    it('combines parsed filters with trailing free-text search term', () => {
        const result = resolveSearchFromQuery('from:(user@mail.com) meeting notes');

        expect(result.filterForm?.from).toEqual(['user@mail.com']);
        expect(result.searchTerm).toBe('meeting notes');
    });

    it('combines parsed filters with leading free-text search term', () => {
        const result = resolveSearchFromQuery('meeting notes from:(user@mail.com)');

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

describe('buildDisplaySearchQuery', () => {
    it('combines structured filters with free-text search term', () => {
        expect(
            buildDisplaySearchQuery(
                { from: ['user@mail.com'], to: [], subject: '' },
                'meeting notes',
            ),
        ).toBe('meeting notes from:(user@mail.com)');
    });

    it('returns only free text when no filters are active', () => {
        expect(buildDisplaySearchQuery(null, 'meeting notes')).toBe('meeting notes');
    });

    it('includes hasWord, doesNotHave, and Search in operators', () => {
        expect(
            buildDisplaySearchQuery(
                {
                    from: [],
                    to: [],
                    subject: '',
                    hasWord: 'invoice',
                    doesNotHave: 'unsubscribe',
                    boxName: 'INBOX',
                },
                'report',
            ),
        ).toBe('report hasWord:(invoice) doesNotHave:(unsubscribe) in:(INBOX)');
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

    it('sends hasWord, doesNotHave, and boxName when set', () => {
        const payload = buildSearchFilterPayload({
            searchText: 'report',
            filterForm: {
                from: ['boss@company.com'],
                to: [],
                subject: '',
                hasWord: 'invoice',
                doesNotHave: 'unsubscribe',
                boxName: 'INBOX',
            },
            limit: 25,
        });

        expect(payload).toMatchObject({
            searchTerm: 'report',
            hasWord: 'invoice',
            doesNotHave: 'unsubscribe',
            boxName: 'INBOX',
            from: ['boss@company.com'],
            limit: 25,
            isFilter: true,
        });
        expect(payload.searchQuery).toBeUndefined();
    });

    it('omits boxName when empty so all mailboxes are searched', () => {
        const payload = buildSearchFilterPayload({
            searchText: 'report',
            filterForm: {
                from: [],
                to: [],
                subject: '',
                hasWord: 'invoice',
                boxName: '',
            },
        });

        expect(payload.hasWord).toBe('invoice');
        expect(payload.boxName).toBeUndefined();
    });
});
