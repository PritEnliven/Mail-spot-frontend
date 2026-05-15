import { postData } from '../apiService';

export interface GetThreadEmailsPayload {
    messageId: string,
    threadId: string,
}

async function getAllThreadEmails(payload: GetThreadEmailsPayload) {
    try {
        const response = await postData('email/fetch-threadEmails', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}


export {
    getAllThreadEmails
}