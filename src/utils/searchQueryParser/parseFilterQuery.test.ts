import { describe, expect, it } from 'vitest';
import { parseFilterQuery } from './parseFilterQuery';

describe('parseFilterQuery', () => {
    it('parses full structured query with parentheses', () => {
        const result = parseFilterQuery(
            'from:(prit.d@enlivendc.com) to:(vishal.d@enlivendc.com) subject:(invoice) size:(Medium (1-5 MB)) date:(05/06/2026 to 10/06/2026)'
        );

        expect(result).toEqual({
            from: 'prit.d@enlivendc.com',
            to: 'vishal.d@enlivendc.com',
            subject: 'invoice',
            attachmentSize: 'Medium (1-5 MB)',
            dateFrom: '2026-06-05',
            dateTo: '2026-06-10',
        });
    });

    it('parses from without parentheses', () => {
        expect(parseFilterQuery('from:prit.d@enlivendc.com')).toEqual({
            from: 'prit.d@enlivendc.com',
        });
    });

    it('parses to without parentheses', () => {
        expect(parseFilterQuery('to:vishal.d@enlivendc.com')).toEqual({
            to: 'vishal.d@enlivendc.com',
        });
    });

    it('parses subject without parentheses', () => {
        expect(parseFilterQuery('subject:invoice')).toEqual({
            subject: 'invoice',
        });
    });

    it('infers from from bare email', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com')).toEqual({
            from: 'prit.d@enlivendc.com',
        });
    });

    it('infers from and to from two bare emails', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com vishal.d@enlivendc.com')).toEqual({
            from: 'prit.d@enlivendc.com',
            to: 'vishal.d@enlivendc.com',
        });
    });

    it('infers from, to, and subject from emails plus text', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com vishal.d@enlivendc.com invoice')).toEqual({
            from: 'prit.d@enlivendc.com',
            to: 'vishal.d@enlivendc.com',
            subject: 'invoice',
        });
    });

    it('parses mixed from keyword and subject text', () => {
        expect(parseFilterQuery('from:prit.d@enlivendc.com invoice')).toEqual({
            from: 'prit.d@enlivendc.com',
            subject: 'invoice',
        });
    });

    it('parses mixed bare email and subject keyword', () => {
        expect(parseFilterQuery('prit.d@enlivendc.com subject:invoice')).toEqual({
            from: 'prit.d@enlivendc.com',
            subject: 'invoice',
        });
    });

    it('does not overwrite explicit from when second email is inferred as to', () => {
        expect(parseFilterQuery('from:abc@test.com xyz@test.com')).toEqual({
            from: 'abc@test.com',
            to: 'xyz@test.com',
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

    it('returns empty object for empty query', () => {
        expect(parseFilterQuery('')).toEqual({});
        expect(parseFilterQuery('   ')).toEqual({});
    });
});
