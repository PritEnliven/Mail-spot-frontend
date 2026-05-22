import { postData, getData } from '../apiService';

export interface BasicInformationPayload {
    name: string;
    email: string;
    platformPassword: string;
}

export interface ImapSettingsPayload {
    imapPassword: string;
    imapServer: string;
    imapHost?: string;
    imapPort: number;
    secureType: string;
}

export interface SmtpSettingsPayload {
    smtpUsername: string;
    smtpPassword: string;
    smtpHost: string;
    smtpPort: number;
    smtpSecureType: string;
}

export interface RegisterPayload {
    email: BasicInformationPayload;
    imap: ImapSettingsPayload;
    smtp: SmtpSettingsPayload;
}

async function checkUserExists(email: string) {
    try {
        return await getData(`auth/userExist/${email}`);
    } catch (error: any) {
        return error;
    }
}

async function verifyImapConnection(payload: RegisterPayload) {
    try {
        return await postData('auth/connection', payload);
    } catch (error: any) {
        return error;
    }
}

async function verifySmtpConnection(payload: SmtpSettingsPayload) {
    try {
        return await postData('auth/verifySmtp', payload);
    } catch (error: any) {
        return error;
    }
}

async function registerUser(payload: RegisterPayload) {
    try {
        return await postData('auth/add-user', payload);
    } catch (error: any) {
        return error;
    }
}

async function fetchAndStoreEmails(email: string, token: string) {
    try {
        return await getData(`email/fetch-and-store-emails/${email}`, {
            Authorization: `Bearer ${token}`
        });
    } catch (error: any) {
        return error;
    }
}

export {
    checkUserExists,
    verifyImapConnection,
    verifySmtpConnection,
    registerUser,
    fetchAndStoreEmails
};
