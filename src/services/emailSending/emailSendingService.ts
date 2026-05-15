import { postData } from '../apiService';
import type { Response } from '@models/Response';

interface EmailPayload {
    subject: string;
    html: string;
    to: string;
    cc?: string;
    bcc?: string;
    isSchedule?: boolean;
    isDraftMail?: boolean;
    draftEmailId?: string;
    draftMessageId?: string;
    draftUid?: string;
    attachments?: File[];
}

async function sendEmail(payload: FormData): Promise<Response> {
    try {
        const response = await postData('email/send-email', payload);
        return response;
    }
    catch (error: any) {
        return error;
    }
}

async function sendReply(payload: FormData): Promise<Response> {
    try {
        const response = await postData('email/send-reply', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function saveDraft(payload: EmailPayload): Promise<Response> {
    try {
        const response = await postData('email/save-as-draft', payload);
        return response;
    } 
    catch (error: any) {
        return error;
    }
}

export {
    sendEmail,
    sendReply,
    saveDraft
};

export type { EmailPayload, Response };