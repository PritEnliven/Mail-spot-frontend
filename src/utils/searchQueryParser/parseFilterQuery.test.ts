import { describe, expect, it } from 'vitest';
import { parseFilterQuery, parseFilterQueryToFormValues } from './parseFilterQuery';

describe('parseFilterQuery', () => {
    it('parses full structured query with parentheses', () => {
        const result = parseFilterQuery(
            'from:(prit.d@enlivendc.com) to:(vishal.d@enlivendc.com) subject:(invoice) size:(Medium (1-5 MB)) date:(05/06/2026 to 10/06/2026)'
        );

        expect(result).toEqual({
            from: ['prit.d@enlivendc.com'],
            to: ['vishal.d@enlivendc.com'],
            subject: 'invoice',
            attachmentSize: 'Medium (1-5 MB)',
            dateFrom: '2026-06-05',
            dateTo: '2026-06-10',
        });
    });

    it('parses multiple from and to operators', () => {
        expect(
            parseFilterQuery(
                'from:(user1@mail.com) from:(user2@mail.com) to:(dest1@mail.com) to:(dest2@mail.com)',
            ),
        ).toEqual({
            from: ['user1@mail.com', 'user2@mail.com'],
            to: ['dest1@mail.com', 'dest2@mail.com'],
        });
    });

    it('parses from without parentheses', () => {
        expect(parseFilterQuery('from:prit.d@enlivendc.com')).toEqual({
            from: ['prit.d@enlivendc.com'],
        });
    });

    it('parses to without parentheses', () => {
        expect(parseFilterQuery('to:vishal.d@enlivendc.com')).toEqual({
            to: ['vishal.d@enlivendc.com'],
        });
    });

    it('parses subject without parentheses', () => {
        expect(parseFilterQuery('subject:invoice')).toEqual({
            subject: 'invoice',
        });
    });

    it('infers from from bare email', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com')).toEqual({
            from: ['prit.d@enlivendc.com'],
        });
    });

    it('infers from and to from two bare emails', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com vishal.d@enlivendc.com')).toEqual({
            from: ['prit.d@enlivendc.com'],
            to: ['vishal.d@enlivendc.com'],
        });
    });

    it('infers from and to from emails without treating trailing text as subject', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com vishal.d@enlivendc.com invoice')).toEqual({
            from: ['prit.d@enlivendc.com'],
            to: ['vishal.d@enlivendc.com'],
        });
    });

    it('does not infer subject from trailing text after from keyword', () => {
        expect(parseFilterQuery('from:prit.d@enlivendc.com invoice')).toEqual({
            from: ['prit.d@enlivendc.com'],
        });
    });

    it('does not treat plain text as subject', () => {
        expect(parseFilterQuery('invoice')).toEqual({});
    });

    it('parses mixed bare email and subject keyword', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com subject:invoice')).toEqual({
            from: ['prit.d@enlivendc.com'],
            subject: 'invoice',
        });
    });

    it('does not overwrite explicit from when second email is inferred as to', () => {
        expect(parseFilterQuery('from:abc@test.com xyz@test.com')).toEqual({
            from: ['abc@test.com'],
            to: ['xyz@test.com'],
        });
    });

    it('parses attachment size without outer parentheses', () => {
        expect(parseFilterQuery('size:Medium (1-5 MB)')).toEqual({
            attachmentSize: 'Medium (1-5 MB)',
        });
    });

    it('parses single date', () => {
        expect(parseFilterQuery('date:05/06/2026')).toEqual({
            dateFrom: '2026-06-05',
        });
    });

    it('parses date range', () => {
        expect(parseFilterQuery('date:05/06/2026 to 10/06/2026')).toEqual({
            dateFrom: '2026-06-05',
            dateTo: '2026-06-10',
        });
    });

    it('parses compact date range without spaces around to', () => {
        expect(parseFilterQuery('date:01/06/2026to03/06/2026')).toEqual({
            dateFrom: '2026-06-01',
            dateTo: '2026-06-03',
        });
    });

    it('returns empty object for empty query', () => {
        expect(parseFilterQuery('')).toEqual({});
        expect(parseFilterQuery('   ')).toEqual({});
    });
});

describe('parseFilterQueryToFormValues', () => {
    it('preserves multiple from and to emails in form values', () => {
        expect(
            parseFilterQueryToFormValues(
                'meeting notes from:(user1@mail.com) from:(user2@mail.com) to:(dest1@mail.com) to:(dest2@mail.com)',
            ),
        ).toEqual({
            from: ['user1@mail.com', 'user2@mail.com'],
            to: ['dest1@mail.com', 'dest2@mail.com'],
        });
    });
});
