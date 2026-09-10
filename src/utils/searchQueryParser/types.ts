import type { AttachmentSizeLabel } from '@constants/attachmentSizeOptions';

export type FilterOperatorKey = 'from' | 'to' | 'subject' | 'size' | 'date' | 'hasWord' | 'doesNotHave' | 'in';

export type ParsedFilterQuery = {
    from?: string[];
    to?: string[];
    subject?: string;
    hasWord?: string;
    doesNotHave?: string;
    boxName?: string;
    attachmentSize?: AttachmentSizeLabel;
    dateFrom?: string;
    dateTo?: string;
};

export type OperatorToken = {
    key: FilterOperatorKey;
    value: string;
    start: number;
    end: number;
};

export type RemainderToken = {
    type: 'text';
    value: string;
    start: number;
    end: number;
};

export type QueryToken = OperatorToken | RemainderToken;
