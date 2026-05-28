import { postData } from '../apiService';

interface ReadUnreadEmailsPayload {
    messageIds: string[];
    current_active_box: string;
    markAsRead: boolean;
}

interface DeleteEmailsPayload {
    messageIds: string[];
    current_active_box: string;
    isDraftMail: boolean;
}

interface MarkedAsLabelPayload {
    messageIds: string[];
    current_active_box: string;
    label: string;
}


interface MoveToFolderPayload {
    messageIds: string[];
    current_active_box: string;
    folder: string;
}

interface RefreshMailBoxPayload {
    current_active_box: string;
    lastEmailMessageId: string;
}

async function refreshMailBox(payload: RefreshMailBoxPayload) {
    try {
        const response = await postData('email/refresh-emails', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function readUnreadEmails(payload: ReadUnreadEmailsPayload) {
    try {
        const response = await postData('email/read-unread-emails', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteEmails(payload: DeleteEmailsPayload) {
    try {
        const response = await postData('email/delete-emails', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function markedAsLabel(payload: MarkedAsLabelPayload) {
    try {
        const response = await postData('email/markedAsLabel', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function moveToFolder(payload: MoveToFolderPayload) {
    try {
        const response = await postData('email/moveToFolder', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function removeLabel(payload: MarkedAsLabelPayload) {
    try {
        const response = await postData('email/removeLabel', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    refreshMailBox,
    readUnreadEmails,
    deleteEmails,
    markedAsLabel,
    moveToFolder,
    removeLabel
};