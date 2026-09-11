import type { ContactAutocompleteOption } from '@models/Contact';
import { searchContacts as searchContactsApi } from '@services/contact/contactService';
import { getActiveAccountId } from '@services/apiService';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAccount } from '@context/AccountContext';

interface ContactsType {
    contacts: ContactAutocompleteOption[];
    setContacts: (contacts: ContactAutocompleteOption[]) => void;
    fetchContacts: () => Promise<void>;
    searchContacts: (query: string) => void;
    clearContacts: () => void;
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
    const { activeAccountId } = useAccount();
    const [contacts, setContacts] = useState<ContactAutocompleteOption[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    const clearContacts = useCallback(() => {
        requestIdRef.current += 1;
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        setContacts([]);
    }, []);

    const runSearch = useCallback(async (query: string) => {
        const requestId = ++requestIdRef.current;
        const accountIdAtStart = getActiveAccountId();

        try {
            const response = await searchContactsApi(query, 20);
            if (requestId !== requestIdRef.current) return;
            if (accountIdAtStart !== getActiveAccountId()) return;

            if (response?.statusCode === 200) {
                const list = Array.isArray(response.data) ? response.data : response.data?.contacts ?? [];
                setContacts(mapToAutocompleteOptions(list));
            } else {
                setContacts([]);
            }
        } catch (error) {
            if (requestId !== requestIdRef.current) return;
            console.error('Failed to search contacts:', error);
            setContacts([]);
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

    // Drop previous account contacts immediately when the active mailbox changes.
    useEffect(() => {
        clearContacts();
        if (activeAccountId && localStorage.getItem('token')) {
            void runSearch('');
        }
    }, [activeAccountId, clearContacts, runSearch]);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const value = {
        contacts,
        setContacts,
        fetchContacts,
        searchContacts,
        clearContacts,
    };

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};
