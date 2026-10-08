export type ContactSortField = 'name' | 'email' | 'updatedAt';

export type ContactGroupSortField = 'name' | 'createdAt' | 'updatedAt' | 'memberCount';
export type ContactGroupSortOrder = 'asc' | 'desc';

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

/** Member shape from `GET /contact/group/get` (and get-by-id). */
export interface ContactGroupMember {
    email: string;
    name: string;
    contactId?: string | null;
}

export interface ContactGroup {
    _id: string;
    name: string;
    userId?: string;
    members?: ContactGroupMember[];
    memberIds?: string[];
    memberCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContactListResponse {
    contacts: Contact[];
    page: number;
    limit: number;
    total: number;
}

export interface ContactGroupListResponse {
    groups: ContactGroup[];
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
    /** Contact-search group row — selecting expands `memberEmails` into the field. */
    isGroup?: boolean;
    memberEmails?: string[];
    memberCount?: number;
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

/** Display label: API `name` first, then `email` when both are present and different. */
export function formatGroupMemberLabel(member: ContactGroupMember): string {
    const name = member.name?.trim() ?? '';
    const email = member.email?.trim() ?? '';

    if (name && email && name !== email) {
        return `${name} ${email}`;
    }

    return name || email;
}

export function getGroupMemberDisplayLabels(group: ContactGroup): string[] {
    if (!Array.isArray(group.members) || group.members.length === 0) {
        return [];
    }

    return group.members
        .map((member) => formatGroupMemberLabel(member))
        .filter(Boolean);
}
