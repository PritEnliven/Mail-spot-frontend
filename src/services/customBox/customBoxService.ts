import { postData } from '../apiService';

interface createCustomBoxPayload {
    folderName: string;
    folderIconColor: string;
    parentFolder?: string;
}

interface editCustomBoxPayload {
    editFolderId: string;
    folderName: string;
    parentFolder?: string;
    folderIconColor: string;
}

interface deleteCustomBoxPayload {
    boxName: string;
    boxKey: string;
}

async function createCustomBox(payload: createCustomBoxPayload) {
    try {
        const response = await postData('customBox/create', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function editCustomBox(payload: editCustomBoxPayload) {
    try {
        const response = await postData('customBox/edit', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteCustomBox(payload: deleteCustomBoxPayload) {
    try {
        const response = await postData('customBox/delete', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    createCustomBox,
    editCustomBox,
    deleteCustomBox
}