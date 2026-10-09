import type { ContactAutocompleteOption, ContactGroupMember } from '@models/Contact';

function trimEmail(value: unknown): string {
    return String(value ?? '').trim();
}

export function getMemberEmailsFromGroupItem(item: any): string[] {
    if (!item || typeof item !== 'object') return [];

    const fromMembers: string[] = Array.isArray(item.members)
        ? item.members
            .map((member: ContactGroupMember | string) => {
                if (typeof member === 'string') return trimEmail(member);
                return trimEmail(member?.email);
            })
            .filter((email: string): email is string => Boolean(email))
        : [];

    if (fromMembers.length > 0) {
        return [...new Set(fromMembers)];
    }

    const fromIds: string[] = Array.isArray(item.memberIds)
        ? item.memberIds
            .map((id: string) => trimEmail(id))
            .filter((id: string) => id.includes('@'))
        : [];

    return [...new Set(fromIds)];
}

export function isContactGroupSearchItem(item: any): boolean {
    if (!item || typeof item !== 'object') return false;
    if (item.isGroup === true || item.type === 'group' || item.kind === 'group') return true;
    if (Array.isArray(item.members)) return true;
    if (typeof item.memberCount === 'number' && Array.isArray(item.memberIds)) return true;
    return false;
}

export function mapGroupToAutocompleteOption(item: any): ContactAutocompleteOption | null {
    const memberEmails = getMemberEmailsFromGroupItem(item);
    const name = trimEmail(item?.name) || 'Group';
    const groupId = trimEmail(item?._id || item?.id || item?.groupId || name);
    if (!groupId && memberEmails.length === 0) return null;

    const memberCount =
        typeof item?.memberCount === 'number' ? item.memberCount : memberEmails.length;

    return {
        value: `group:${groupId}`,
        name,
        email: '',
        label: memberCount > 0 ? `${name} (${memberCount})` : name,
        isGroup: true,
        memberEmails,
        memberCount,
    };
}

export function mapContactToAutocompleteOption(item: any): ContactAutocompleteOption {
    const emails = Array.isArray(item?.emails)
        ? item.emails.map((e: string) => trimEmail(e)).filter(Boolean)
        : [];
    const email = trimEmail(item?.email || emails[0]);
    return {
        value: email || trimEmail(item?._id),
        name: trimEmail(item?.name) || email,
        email,
        label: trimEmail(item?.name) || email,
        isSuggestion: Boolean(
            item?.isSuggestion
            || item?.isSuggested
            || item?.is_suggestion
            || item?.suggested
            || item?.type === 'suggestion',
        ),
    };
}

/**
 * Flatten contact/search payload into display order:
 * groups first, then suggestions, then individual contacts.
 */
export function extractContactSearchItems(data: unknown, responseRoot?: any): any[] {
    const rootSuggestions = Array.isArray(responseRoot?.suggestions)
        ? responseRoot.suggestions
        : [];

    if (Array.isArray(data)) {
        const groups = data.filter(isContactGroupSearchItem);
        const rest = data.filter((item) => !isContactGroupSearchItem(item));
        if (rootSuggestions.length > 0) {
            return [
                ...groups,
                ...rootSuggestions.map((item: any) => (
                    item && typeof item === 'object' ? { ...item, isSuggestion: true } : item
                )),
                ...rest,
            ];
        }
        return [...groups, ...rest];
    }

    if (!data || typeof data !== 'object') {
        return rootSuggestions.map((item: any) => (
            item && typeof item === 'object' ? { ...item, isSuggestion: true } : item
        ));
    }

    const record = data as Record<string, unknown>;

    if (
        record.data
        && typeof record.data === 'object'
        && !Array.isArray(record.data)
        && (
            Array.isArray((record.data as any).contacts)
            || Array.isArray((record.data as any).groups)
            || Array.isArray((record.data as any).suggestions)
            || Array.isArray((record.data as any).suggested)
            || Array.isArray((record.data as any).suggestedContacts)
        )
    ) {
        return extractContactSearchItems(record.data, responseRoot);
    }

    const groups = Array.isArray(record.groups) ? record.groups : [];
    const suggestions =
        (Array.isArray(record.suggestions) && record.suggestions)
        || (Array.isArray(record.suggested) && record.suggested)
        || (Array.isArray(record.suggestedContacts) && record.suggestedContacts)
        || rootSuggestions;
    const contacts = Array.isArray(record.contacts)
        ? record.contacts
        : Array.isArray(record.list)
            ? record.list
            : [];

    const suggestionItems = suggestions.map((item: any) => (
        item && typeof item === 'object' ? { ...item, isSuggestion: true } : item
    ));

    const suggestionKeys = new Set(
        suggestionItems
            .map((item: any) => trimEmail(item?.email || item?.emails?.[0] || item?._id).toLowerCase())
            .filter(Boolean),
    );

    const contactItems = contacts.filter((item: any) => {
        if (isContactGroupSearchItem(item)) return false;
        const key = trimEmail(item?.email || item?.emails?.[0] || item?._id).toLowerCase();
        return !key || !suggestionKeys.has(key);
    });

    const groupItems = [
        ...groups,
        ...contacts.filter(isContactGroupSearchItem),
    ];

    return [...groupItems, ...suggestionItems, ...contactItems];
}

export function mapSearchItemsToAutocompleteOptions(items: any[]): ContactAutocompleteOption[] {
    return (items ?? [])
        .map((item) => (
            isContactGroupSearchItem(item)
                ? mapGroupToAutocompleteOption(item)
                : mapContactToAutocompleteOption(item)
        ))
        .filter((opt): opt is ContactAutocompleteOption => Boolean(opt?.value));
}
