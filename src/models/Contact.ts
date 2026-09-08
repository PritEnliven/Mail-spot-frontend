export type ContactSortField = 'name' | 'email' | 'updatedAt';

export interface Contact {
    _id: string;
    name: string;
    email: string;
    phone: string | null;
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
    phone?: string;
}

export interface ContactAutocompleteOption {
    value: string;
    name: string;
    email: string;
    label?: string;
    isSuggestion?: boolean;
}
