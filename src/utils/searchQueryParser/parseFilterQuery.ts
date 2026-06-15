import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import type { AttachmentSizeLabel } from '@constants/attachmentSizeOptions';
import { isValidAttachmentSizeLabel } from '@constants/attachmentSizeOptions';
import moment from 'moment';
import { removeOperatorSpans, tokenizeOperators } from './tokenize';
import type { ParsedFilterQuery } from './types';

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function parseDateValue(value: string): { dateFrom?: string; dateTo?: string } {
    const trimmed = value.trim();
    const compactRange = trimmed.match(/^(\d{2}\/\d{2}\/\d{4})to(\d{2}\/\d{2}\/\d{4})$/i);
    if (compactRange) {
        const from = moment(compactRange[1], ['DD/MM/YYYY', 'DD-MM-YYYY'], true);
        const to = moment(compactRange[2], ['DD/MM/YYYY', 'DD-MM-YYYY'], true);
        if (from.isValid() && to.isValid()) {
            return {
                dateFrom: from.format('YYYY-MM-DD'),
                dateTo: to.format('YYYY-MM-DD'),
            };
        }
    }

    const parts = trimmed.split(/\s+to\s+/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return {};

    const dates = parts
        .map((part) => moment(part, ['DD/MM/YYYY', 'DD-MM-YYYY'], true))
        .filter((m) => m.isValid());

    if (dates.length === 0) return {};

    if (dates.length === 1) {
        return { dateFrom: dates[0].format('YYYY-MM-DD') };
    }

    return {
        dateFrom: dates[0].format('YYYY-MM-DD'),
        dateTo: dates[1].format('YYYY-MM-DD'),
    };
}

export function extractFreeTextSearchTerm(query: string): string {
    const trimmed = query.trim();
    if (!trimmed) return '';

    const operatorTokens = tokenizeOperators(trimmed);
    let remainder = removeOperatorSpans(trimmed, operatorTokens).trim();
    if (!remainder) return '';

    const inferredEmails = extractEmails(remainder);
    for (const email of inferredEmails) {
        remainder = remainder.replace(email, ' ');
    }

    return remainder.replace(/\s+/g, ' ').trim();
}

function extractEmails(text: string): string[] {
    const emails: string[] = [];
    let match: RegExpExecArray | null;
    const pattern = new RegExp(EMAIL_PATTERN.source, EMAIL_PATTERN.flags);

    while ((match = pattern.exec(text)) !== null) {
        emails.push(match[0]);
    }

    return emails;
}

export function parseFilterQuery(query: string): ParsedFilterQuery {
    const trimmed = query.trim();
    if (!trimmed) return {};

    const operatorTokens = tokenizeOperators(trimmed);
    const result: ParsedFilterQuery = {};

    for (const token of operatorTokens) {
        const value = token.value.trim();
        if (!value) continue;

        switch (token.key) {
            case 'from':
                if (!result.from) result.from = [];
                result.from.push(value);
                break;
            case 'to':
                if (!result.to) result.to = [];
                result.to.push(value);
                break;
            case 'subject':
                if (!result.subject) result.subject = value;
                break;
            case 'size':
                if (isValidAttachmentSizeLabel(value)) {
                    result.attachmentSize = value;
                }
                break;
            case 'date': {
                const dates = parseDateValue(value);
                if (dates.dateFrom) result.dateFrom = dates.dateFrom;
                if (dates.dateTo) result.dateTo = dates.dateTo;
                break;
            }
        }
    }

    const remainder = removeOperatorSpans(trimmed, operatorTokens).trim();
    if (!remainder) return result;

    const inferredEmails = extractEmails(remainder);

    for (const email of inferredEmails) {
        if (!result.from?.length) {
            result.from = [email];
        } else if (!result.to?.length && !result.from.includes(email)) {
            result.to = [email];
        }
    }

    return result;
}

function parsedDatesToDateRange(parsed: ParsedFilterQuery): Date[] | undefined {
    if (parsed.dateFrom && parsed.dateTo) {
        const from = moment(parsed.dateFrom, 'YYYY-MM-DD', true);
        const to = moment(parsed.dateTo, 'YYYY-MM-DD', true);
        if (from.isValid() && to.isValid()) {
            return [from.toDate(), to.toDate()];
        }
    }

    if (parsed.dateFrom) {
        const from = moment(parsed.dateFrom, 'YYYY-MM-DD', true);
        if (from.isValid()) return [from.toDate()];
    }

    return undefined;
}

export function isStructuredFilterQuery(query: string): boolean {
    const trimmed = query.trim();
    if (!trimmed) return false;
    if (tokenizeOperators(trimmed).length > 0) return true;
    return EMAIL_PATTERN.test(trimmed);
}

export function parseFilterQueryToFormValues(query: string): Partial<FilterEmailFormValues> {
    const parsed = parseFilterQuery(query);
    const formValues: Partial<FilterEmailFormValues> = {};

    if (parsed.from?.length) formValues.from = parsed.from;
    if (parsed.to?.length) formValues.to = parsed.to;
    if (parsed.subject) formValues.subject = parsed.subject;
    if (parsed.attachmentSize) {
        formValues.attachmentSize = parsed.attachmentSize as AttachmentSizeLabel;
    }

    const dateRange = parsedDatesToDateRange(parsed);
    if (dateRange) formValues.dateRange = dateRange;

    return formValues;
}
