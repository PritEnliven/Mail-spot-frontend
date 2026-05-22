import { deleteData, getData, postData } from '@services/apiService';
import type { Response } from '@services/emailSending/emailSendingService';

interface GetScheduleEmailParams {
    id: string;
}

interface CancelScheduledEmailParams {
    id: string;
}

interface ResendScheduledEmailPayload {
    id: string;
}

async function scheduleEmail(payload: FormData): Promise<Response> {
    try {
        const response = await postData('email/schedule-email', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

// Get a scheduled email by ID
async function getScheduleEmail({ id }: GetScheduleEmailParams): Promise<Response> {
    try {
        const response = await getData(`email/get-scheduled-email/${id}`);
        return response;
    } catch (error: any) {
        return error;
    }
}

// Cancel a scheduled email
async function cancelScheduledEmail({ id }: CancelScheduledEmailParams): Promise<Response> {
    try {
        const response = await deleteData(`email/cancel-scheduled-email/${id}`, {});
        return response;
    } catch (error: any) {
        return error;
    }
}

// Resend a scheduled email
async function resendScheduledEmail(payload: ResendScheduledEmailPayload): Promise<Response> {
    try {
        const response = await postData('email/resend-scheduled-email', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    cancelScheduledEmail, getScheduleEmail, resendScheduledEmail, scheduleEmail
};
