
import { getData, postData } from '../apiService';

interface addContactPaylod {
    email: [],
    isSuggestion: false
}

async function getAllContacts() {
    try {
        const response = await getData('contact/get');
        return response;
    } catch (error: any) {
        return error;
    }
}

async function addContacts(payload: addContactPaylod) {
    try {
        const response = await postData('contact/add', payload);
        return response;
    } catch (error: any) {
        return error;
    }
}

export {
    addContacts, getAllContacts
};
