import { getData, postData } from '../apiService';

async function getBoxes() {
    try {
        const response = await getData('email/get-boxes');
        return response.data;
    } catch (error: any) {
        return error;
    }
}

async function refreshFolders() {
    try {
        const response = await postData('email/refresh-folders', {});
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    getBoxes,
    refreshFolders
};