import { describe, expect, it } from 'vitest';
import { buildSearchFilterPayload } from '@utils/filterUtil';
import { buildDisplaySearchQuery, omitFilterCoveredFreeText, promoteSearchQueryToFilterForm, resolveSearchFromQuery } from './searchQueryUtil';

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

    it('does not keep a plain email as free text when it is already the From filter', () => {
        const activeFilter = {
            from: ['raj.v@mail.enlivendc.com'],
            to: [],
            subject: '',
            dateRange: undefined,
        };

        const result = resolveSearchFromQuery('raj.v@mail.enlivendc.com', activeFilter);

        expect(result.filterForm?.from).toEqual(['raj.v@mail.enlivendc.com']);
        expect(result.searchTerm).toBe('');
    });

    it('returns keyword-only search when no filters are active', () => {
        expect(resolveSearchFromQuery('meeting notes')).toEqual({
            filterForm: null,
            searchTerm: 'meeting notes',
        });
    });

    it('keeps a plain name search intact when hasWord is only its first letter', () => {
        const activeFilter = {
            from: [],
            to: [],
            subject: '',
            hasWord: 'r',
            dateRange: undefined,
        };

        const result = resolveSearchFromQuery('raj v', activeFilter);

        expect(result.filterForm?.hasWord).toBe('r');
        expect(result.searchTerm).toBe('raj v');
    });
});

describe('omitFilterCoveredFreeText', () => {
    it('removes a hasWord phrase without eating letters inside another word', () => {
        expect(
            omitFilterCoveredFreeText('raj v invoice', {
                from: [],
                to: [],
                subject: '',
                hasWord: 'r',
            }),
        ).toBe('raj v invoice');

        expect(
            omitFilterCoveredFreeText('raj v invoice', {
                from: [],
                to: [],
                subject: '',
                hasWord: 'invoice',
            }),
        ).toBe('raj v');
    });
});

describe('promoteSearchQueryToFilterForm', () => {
    it('puts plain keyword search into Has the words when opening filter', () => {
        const result = promoteSearchQueryToFilterForm('invoice');

        expect(result.filterForm?.hasWord).toBe('invoice');
        expect(result.searchTerm).toBe('');
    });

    it('puts a bare email into Has the words', () => {
        const result = promoteSearchQueryToFilterForm('raj.v@mail.enlivendc.com');

        expect(result.filterForm?.from ?? []).toEqual([]);
        expect(result.filterForm?.to ?? []).toEqual([]);
        expect(result.filterForm?.hasWord).toBe('raj.v@mail.enlivendc.com');
        expect(result.searchTerm).toBe('');
    });

    it('puts an email typed next to other words into Has the words', () => {
        const result = promoteSearchQueryToFilterForm('raj.v@mail.enlivendc.com invoice');

        expect(result.filterForm?.from ?? []).toEqual([]);
        expect(result.filterForm?.hasWord).toBe('raj.v@mail.enlivendc.com invoice');
        expect(result.searchTerm).toBe('');
    });

    it('keeps an explicit from: address in From and puts a bare address in Has the words', () => {
        const result = promoteSearchQueryToFilterForm('from:(user@mail.com) other@mail.com');

        expect(result.filterForm?.from).toEqual(['user@mail.com']);
        expect(result.filterForm?.to ?? []).toEqual([]);
        expect(result.filterForm?.hasWord).toBe('other@mail.com');
        expect(result.searchTerm).toBe('');
    });

    it('does not put a plain date into Has the words', () => {
        const result = promoteSearchQueryToFilterForm('05/06/2026');

        expect(result.filterForm?.hasWord ?? '').toBe('');
        expect(result.searchTerm).toBe('05/06/2026');
    });

    it('appends free text into Has the words while keeping existing From filter', () => {
        const activeFilter = {
            from: ['user@mail.com'],
            to: [],
            subject: '',
            hasWord: '',
            dateRange: undefined,
        };

        const result = promoteSearchQueryToFilterForm('meeting notes', activeFilter);

        expect(result.filterForm?.from).toEqual(['user@mail.com']);
        expect(result.filterForm?.hasWord).toBe('meeting notes');
        expect(result.searchTerm).toBe('');
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

    it('does not duplicate an email already mapped into From', () => {
        expect(
            buildDisplaySearchQuery(
                { from: ['raj.v@mail.enlivendc.com'], to: [], subject: '' },
                'raj.v@mail.enlivendc.com',
            ),
        ).toBe('from:(raj.v@mail.enlivendc.com)');
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
