
import { postData } from '../apiService';

interface createCustomBoxPayload {
    folderName: string;
    folderIconColor: string;
    parentFolder: string;
    editFolderId: string;
    isEdit: boolean;
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
    deleteCustomBox
}