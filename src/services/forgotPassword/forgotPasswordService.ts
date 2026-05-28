import type { ApiResponse } from '@models/Response';
import { getData, postData, putData } from '../apiService';

interface verifyEmailAndSentMailPayload {
    email: string
}

interface verifyOtpPayload {
    email: string,
    action?: 'forgotPassword',
    code: string
}

interface resetPasswordPayload {
    email: string,
    password: string,
    token: string
}

async function verifyEmailAndSentMail(payload: verifyEmailAndSentMailPayload): Promise<ApiResponse<Response>> {
    try {
        const response = await getData(`auth/verifyEmail/${payload.email}`);
        return response;
    } catch (error: any) {
        console.error('Error searching event:', error);
        return error;
    }
}

async function verifyOtp(payload: verifyOtpPayload): Promise<ApiResponse<Response>> {
    try {
        const response = await postData('auth/verifyCode', payload);
        return response;
    } catch (error: any) {
        console.error('Error searching event:', error);
        return error;
    }
}

async function resetPassword(payload: resetPasswordPayload): Promise<ApiResponse<Response>> {
    try {
        const response = await putData('email/updatePlatformPassword', payload, {
            headers: {
                'Authorization': `Bearer ${payload.token}`
            }
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    resetPassword, verifyEmailAndSentMail,
    verifyOtp
};

