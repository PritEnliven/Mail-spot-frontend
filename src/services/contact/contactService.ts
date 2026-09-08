import type { ContactFormValues, ContactListResponse, ContactSortField } from '@models/Contact';
import { deleteData, getData, postData, putData } from '../apiService';

export interface GetContactsParams {
    q?: string;
    page?: number;
    limit?: number;
    sort?: ContactSortField;
}

async function getContactsList(params: GetContactsParams = {}) {
    try {
        const response = await getData('contact/get', {
            params: {
                book: true,
                q: params.q ?? '',
                page: params.page ?? 1,
                limit: params.limit ?? 50,
                sort: params.sort ?? 'name',
            },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function searchContacts(q: string, limit = 20) {
    try {
        const response = await getData('contact/search', {
            params: { q, limit },
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function getContactById(contactId: string) {
    try {
        const response = await getData(`contact/get/${contactId}`);
        return response;
    } catch (error: any) {
        return error;
    }
}

async function addContact(payload: ContactFormValues) {
    try {
        const response = await postData('contact/add', {
            name: payload.name,
            email: payload.email,
            phone: payload.phone || undefined,
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function editContact(contactId: string, payload: ContactFormValues) {
    try {
        const response = await putData(`contact/edit/${contactId}`, {
            name: payload.name,
            email: payload.email,
            phone: payload.phone || undefined,
        });
        return response;
    } catch (error: any) {
        return error;
    }
}

async function deleteContact(contactId: string) {
    try {
        const response = await deleteData(`contact/delete/${contactId}`, {});
        return response;
    } catch (error: any) {
        return error;
    }
}

/** @deprecated Use getContactsList or searchContacts */
async function getAllContacts() {
    return getContactsList({ limit: 100 });
}

/** @deprecated Use addContact */
async function addContacts(payload: ContactFormValues) {
    return addContact(payload);
}

export {
    addContact,
    addContacts,
    deleteContact,
    editContact,
    getAllContacts,
    getContactById,
    getContactsList,
    searchContacts,
};

export type { ContactListResponse };
