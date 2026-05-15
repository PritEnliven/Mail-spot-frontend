import { getData, postData } from '../apiService';

interface GetEmailsPayload {
    current_active_box: string;
    vPage: number;
    lastMailId: string;
    firstMailId: string;
    totalCount: number | null;
}

export interface GetSingleEmailPayload {
    current_active_box: string;
    messageId?: string;
    message_id?: string;
    id?: string;
    emailId?: string;
    uid?: number;
    isSearch?: boolean;
}

interface downloadAttachmentPayload {
    downloadType: string;
    customFileName?: string;
    messageId: string;
    currentActiveBox: string;
}

interface FilterEmailPayload {
    limit?: number;
    searchTerm?: string;
    from?: string[];
    to?: string[];
    subject?: string;
    hasAttachments?: boolean;
    attachmentSizeType?: 'small' | 'medium' | 'large' | 'extra-large';
    dateRange?: string | undefined;
    createRule?: boolean;
    actions?: {
        markAsRead: boolean,
        moveToFolder: boolean,
        selectedFolder: string,
        forwardIt: string[],
        deleteIt: boolean,
        neverSendToSpam: boolean
    }
}

async function downloadAttachmentFunc(payLoad: downloadAttachmentPayload) {
    try {
        const response = await getData('email/download-attachment', {
            responseType: 'blob',
            headers: {
                'downloadType': payLoad.downloadType,
                'messageId': payLoad.messageId,
                'current_active_box': payLoad.currentActiveBox,
                'fileName': payLoad.customFileName
            }
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getEmailsService(payload: GetEmailsPayload) {
    try {
        const response = await postData('email/get-emails', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getSingleEmailService(payload: GetSingleEmailPayload) {
    try {
        const response = await postData('email/get-single-email', payload);
        return response.data;
    } catch (error: any) {
        return error;
    }
}

async function filterEmailAndCreateRuleService(payload: FilterEmailPayload) {
    try {
        const response = await postData('email/filter-emails', payload);
        return response.data;
    } catch (error: any) {
        return error;
    }
}


async function searchAndFilterEmailService(payload: FilterEmailPayload): Promise<any> {
    try {
        const config = {
            params: payload
        };
        const response = await getData('email/search', config);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    getEmailsService,
    getSingleEmailService,
    downloadAttachmentFunc,
    searchAndFilterEmailService,
    filterEmailAndCreateRuleService
}