import { ATTACHMENT_SIZE_LABELS } from '@constants/attachmentSizeOptions';
import { buildOperatorPattern, resolveOperatorKey } from './operators';
import type { FilterOperatorKey, OperatorToken } from './types';

const DATE_VALUE_PATTERN =
    /^\d{2}\/\d{2}\/\d{4}(?:(?:to|\s+to\s+)\d{2}\/\d{2}\/\d{4})?/i;

const SORTED_SIZE_LABELS = [...ATTACHMENT_SIZE_LABELS].sort((a, b) => b.length - a.length);

export function extractBalancedParenValue(input: string, openParenIndex: number): string | null {
    if (input[openParenIndex] !== '(') return null;

    let depth = 0;
    for (let i = openParenIndex; i < input.length; i++) {
        if (input[i] === '(') depth++;
        else if (input[i] === ')') {
            depth--;
            if (depth === 0) {
                return input.slice(openParenIndex + 1, i);
            }
        }
    }
    return null;
}

function findNextOperatorIndex(query: string, fromIndex: number): number {
    const pattern = buildOperatorPattern();
    pattern.lastIndex = fromIndex;
    const match = pattern.exec(query);
    return match ? match.index : query.length;
}

function extractOperatorValue(
    query: string,
    key: FilterOperatorKey,
    valueStart: number
): { value: string; end: number } | null {
    if (valueStart >= query.length) {
        return { value: '', end: valueStart };
    }

    if (query[valueStart] === '(') {
        const value = extractBalancedParenValue(query, valueStart);
        if (value === null) return null;
        return { value: value.trim(), end: valueStart + value.length + 2 };
    }

    if (key === 'size') {
        const rest = query.slice(valueStart);
        for (const label of SORTED_SIZE_LABELS) {
            if (rest.startsWith(label)) {
                return { value: label, end: valueStart + label.length };
            }
        }
    }

    if (key === 'date') {
        const rest = query.slice(valueStart);
        const match = rest.match(DATE_VALUE_PATTERN);
        if (match) {
            return { value: match[0], end: valueStart + match[0].length };
        }
    }

    if (key === 'from' || key === 'to') {
        const rest = query.slice(valueStart);
        const tokenMatch = rest.match(/^\S+/);
        if (tokenMatch) {
            return { value: tokenMatch[0], end: valueStart + tokenMatch[0].length };
        }
        return { value: '', end: valueStart };
    }

    const end = findNextOperatorIndex(query, valueStart);
    const raw = query.slice(valueStart, end);
    return { value: raw.trim(), end: valueStart + raw.length };
}

export function tokenizeOperators(query: string): OperatorToken[] {
    const tokens: OperatorToken[] = [];
    const pattern = buildOperatorPattern();
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(query)) !== null) {
        const alias = match[1];
        const key = resolveOperatorKey(alias);
        if (!key) continue;

        const valueStart = match.index + match[0].length;
        const extracted = extractOperatorValue(query, key, valueStart);
        if (!extracted) continue;

        tokens.push({
            key,
            value: extracted.value,
            start: match.index,
            end: extracted.end,
        });

        pattern.lastIndex = extracted.end;
    }

    return tokens;
}

export function removeOperatorSpans(query: string, tokens: OperatorToken[]): string {
    if (tokens.length === 0) return query;

    let result = '';
    let cursor = 0;

    for (const token of tokens) {
        result += query.slice(cursor, token.start);
        result += ' ';
        cursor = token.end;
    }

    result += query.slice(cursor);
    return result;
}
