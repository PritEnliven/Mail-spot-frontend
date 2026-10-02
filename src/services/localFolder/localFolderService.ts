import { getData, postData } from '../apiService';

export interface LocalFolderItem {
    key: string;
    value: string;
    folderId: string;
    displayName: string;
    color: string | null;
    unreadCount?: number;
    count?: number;
}

interface CreateLocalFolderPayload {
    folderName: string;
    color?: string | null;
}

interface RenameLocalFolderPayload {
    folderId: string;
    folderName?: string;
    color?: string | null;
}

interface DeleteLocalFolderPayload {
    folderId: string;
}

interface MoveToLocalFolderPayload {
    messageIds: string[];
    folderId: string;
}

interface MoveToImapPayload {
    messageIds: string[];
    /** IMAP folder the emails should land in (e.g. INBOX). */
    destinationFolder: string;
    /** Source local folder id when known (helps backend resolve local-only emails). */
    folderId?: string;
}

async function listLocalFolders() {
    try {
        const response = await getData('localFolder/list');
        return response;
    } catch (error: any) {
        return error;
    }
}

async function createLocalFolder(payload: CreateLocalFolderPayload) {
    try {
        const response = await postData('localFolder/create', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function renameLocalFolder(payload: RenameLocalFolderPayload) {
    try {
        const response = await postData('localFolder/rename', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteLocalFolder(payload: DeleteLocalFolderPayload) {
    try {
        const response = await postData('localFolder/delete', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function moveToLocalFolder(payload: MoveToLocalFolderPayload) {
    try {
        const response = await postData('localFolder/moveToFolder', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function moveToImap(payload: MoveToImapPayload) {
    try {
        const response = await postData('localFolder/moveToImap', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    listLocalFolders,
    createLocalFolder,
    renameLocalFolder,
    deleteLocalFolder,
    moveToLocalFolder,
    moveToImap,
};
