import type { AttachmentSizeLabel } from '@constants/attachmentSizeOptions';

export type FilterOperatorKey = 'from' | 'to' | 'subject' | 'size' | 'date';

export type ParsedFilterQuery = {
    from?: string[];
    to?: string[];
    subject?: string;
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
