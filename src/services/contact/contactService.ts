import type { ContactFormValues, ContactListResponse, ContactSortField } from '@models/Contact';
import { deleteData, getData, postData, putData } from '../apiService';

export interface GetContactsParams {
    q?: string;
    page?: number;
    limit?: number;
    sort?: ContactSortField;
}

export type ContactExportFormat = 'csv' | 'vcf';

export type ContactExportResult =
    | { success: true; blob: Blob; filename: string }
    | { success: false; message: string; statusCode?: number };

const EXPORT_FILENAME: Record<ContactExportFormat, string> = {
    csv: 'contacts.csv',
    vcf: 'contacts.vcf',
};

function buildContactPayload(payload: ContactFormValues) {
    const emails = (payload.emails?.length
        ? payload.emails
        : payload.email
            ? [payload.email]
            : []
    )
        .map((e) => e.trim())
        .filter(Boolean);

    const phones = (payload.phones?.length
        ? payload.phones
        : payload.phone
            ? [payload.phone]
            : []
    )
        .map((p) => p.trim())
        .filter(Boolean);

    return {
        name: payload.name.trim(),
        email: emails[0] || payload.email,
        emails,
        phone: phones[0] || undefined,
        phones,
        notes: payload.notes?.trim() || undefined,
        address: payload.address?.trim() || undefined,
        birthdate: payload.birthdate?.trim() || undefined,
    };
}

async function parseExportErrorBlob(blob: Blob, fallback: string) {
    try {
        const text = await blob.text();
        const parsed = JSON.parse(text) as { message?: string };
        return parsed?.message || fallback;
    } catch {
        return fallback;
    }
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

async function searchContacts(q: string, limit = 150, page = 1) {
    try {
        const response = await getData('contact/search', {
            params: { q, limit, page },
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
        const response = await postData('contact/add', buildContactPayload(payload));
        return response;
    } catch (error: any) {
        return error;
    }
}

async function editContact(contactId: string, payload: ContactFormValues) {
    try {
        const response = await putData(`contact/edit/${contactId}`, buildContactPayload(payload));
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

async function exportContacts(format: ContactExportFormat): Promise<ContactExportResult> {
    const fallbackMessage = 'Failed to export contacts';
    try {
        const data = await getData('contact/export', {
            params: { format },
            responseType: 'blob',
        });

        if (!(data instanceof Blob)) {
            return { success: false, message: fallbackMessage, statusCode: 500 };
        }

        // Error payloads can arrive as JSON blobs when responseType is blob.
        if (data.type.includes('application/json') || data.type.includes('text/json')) {
            return {
                success: false,
                message: await parseExportErrorBlob(data, fallbackMessage),
                statusCode: 400,
            };
        }

        return {
            success: true,
            blob: data,
            filename: EXPORT_FILENAME[format],
        };
    } catch (error: any) {
        if (error instanceof Blob) {
            return {
                success: false,
                message: await parseExportErrorBlob(error, fallbackMessage),
                statusCode: 500,
            };
        }
        return {
            success: false,
            message: error?.message || fallbackMessage,
            statusCode: error?.statusCode || 500,
        };
    }
}

function downloadBlobFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
    downloadBlobFile,
    editContact,
    exportContacts,
    getAllContacts,
    getContactById,
    getContactsList,
    searchContacts,
};

export type { ContactListResponse };
