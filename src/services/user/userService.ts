
import { getData, postData } from '../apiService';

interface UpdateImapSmtpDetailsPayload {
    email: {
        email: string;
        name: string;
    };
    imap: {
        password: string;
        host: string;
        port: number;
        secureType: string;
        service: string;
    };
    smtp: {
        password: string;
        host: string;
        port: number;
        secureType: string;
    };
}
async function getUserDetail(email: string) {
    try {
        const response = await getData(`auth/getUserDetail/${email}`);
        return response;
    } catch (error: any) {
        return error;
    }
}


async function updateImapSmtpDetails(payload: UpdateImapSmtpDetailsPayload) {
    try {
        const response = await postData(`email/updateImapSmtp`, payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    getUserDetail,
    updateImapSmtpDetails
}