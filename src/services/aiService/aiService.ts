
import { getData, postData } from '../apiService';

interface GenerateEmailPayload {
    description: string,
    recepientEmail: string
}

interface GetSmartRepliesPayload {
    emailContent: string
}

async function generateEmail(payload: GenerateEmailPayload) {
    try {
        const response = await postData('email/generate-email', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getSmartReplies(payload: GetSmartRepliesPayload) {
    try {
        const response = await postData('email/smart-replies', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    generateEmail,
    getSmartReplies
}