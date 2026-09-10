import type { ContactAutocompleteOption } from '@models/Contact';
import { searchContacts as searchContactsApi } from '@services/contact/contactService';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface ContactsType {
    contacts: ContactAutocompleteOption[];
    setContacts: (contacts: ContactAutocompleteOption[]) => void;
    fetchContacts: () => Promise<void>;
    searchContacts: (query: string) => void;
}

const ContactsContext = createContext<ContactsType | undefined>(undefined);

function mapToAutocompleteOptions(items: any[]): ContactAutocompleteOption[] {
    return (items ?? []).map((item) => {
        const emails = Array.isArray(item.emails)
            ? item.emails.map((e: string) => String(e).trim()).filter(Boolean)
            : [];
        const email = (item.email || emails[0] || '').trim();
        return {
            value: email || item._id,
            name: item.name || email,
            email,
            label: item.name || email,
            isSuggestion: Boolean(item.isSuggestion),
        };
    });
}

export const useContacts = () => {
    const ctx = useContext(ContactsContext);
    if (!ctx) throw new Error('useContacts must be used inside ContactsProvider');
    return ctx;
};

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
    const [contacts, setContacts] = useState<ContactAutocompleteOption[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback(async (query: string) => {
        try {
            const response = await searchContactsApi(query, 20);
            if (response?.statusCode === 200) {
                const list = Array.isArray(response.data) ? response.data : response.data?.contacts ?? [];
                setContacts(mapToAutocompleteOptions(list));
            }
        } catch (error) {
            console.error('Failed to search contacts:', error);
        }
    }, []);

    const searchContacts = useCallback((query: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            void runSearch(query);
        }, 300);
    }, [runSearch]);

    const fetchContacts = useCallback(async () => {
        await runSearch('');
    }, [runSearch]);

    const value = {
        contacts,
        setContacts,
        fetchContacts,
        searchContacts,
    };

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};
