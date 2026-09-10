export type ContactSortField = 'name' | 'email' | 'updatedAt';

export interface Contact {
    _id: string;
    name: string;
    email: string;
    emails?: string[];
    phone: string | null;
    phones?: string[];
    notes?: string | null;
    address?: string | null;
    birthdate?: string | null;
    isSuggestion: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContactListResponse {
    contacts: Contact[];
    page: number;
    limit: number;
    total: number;
}

export interface ContactFormValues {
    name: string;
    email: string;
    emails?: string[];
    phone?: string;
    phones?: string[];
    notes?: string;
    address?: string;
    birthdate?: string;
}

export interface ContactAutocompleteOption {
    value: string;
    name: string;
    email: string;
    label?: string;
    isSuggestion?: boolean;
}

export function getContactEmails(contact: Pick<Contact, 'email' | 'emails'>): string[] {
    if (Array.isArray(contact.emails) && contact.emails.length > 0) {
        return contact.emails.map((e) => e.trim()).filter(Boolean);
    }
    const single = contact.email?.trim();
    return single ? [single] : [];
}

export function getContactPhones(contact: Pick<Contact, 'phone' | 'phones'>): string[] {
    if (Array.isArray(contact.phones) && contact.phones.length > 0) {
        return contact.phones.map((p) => p.trim()).filter(Boolean);
    }
    const single = contact.phone?.trim();
    return single ? [single] : [];
}
