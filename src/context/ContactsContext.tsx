import type { ContactAutocompleteOption } from '@models/Contact';
import { searchContacts as searchContactsApi } from '@services/contact/contactService';
import { getActiveAccountId } from '@services/apiService';
import {
    extractContactSearchItems,
    mapSearchItemsToAutocompleteOptions,
} from '@utils/contactSearchUtil';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAccount } from '@context/AccountContext';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

interface ContactsType {
    contacts: ContactAutocompleteOption[];
    setContacts: (contacts: ContactAutocompleteOption[]) => void;
    fetchContacts: () => Promise<void>;
    searchContacts: (query: string) => void;
    loadMoreContacts: () => void;
    resetContactSuggestions: () => void;
    hasMoreContacts: boolean;
    isLoadingContacts: boolean;
    isLoadingMoreContacts: boolean;
    clearContacts: () => void;
}

const ContactsContext = createContext<ContactsType | undefined>(undefined);

function optionKey(opt: ContactAutocompleteOption): string {
    if (opt.isGroup) {
        return (opt.value || opt.name || '').trim().toLowerCase();
    }
    return (opt.email || opt.value || '').trim().toLowerCase();
}

function mergeUnique(
    existing: ContactAutocompleteOption[],
    incoming: ContactAutocompleteOption[],
): ContactAutocompleteOption[] {
    const seen = new Set(existing.map(optionKey).filter(Boolean));
    const added = incoming.filter((opt) => {
        const key = optionKey(opt);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    return [...existing, ...added];
}

/** Groups first, then suggested addresses, then saved contacts. */
function withSearchPriorityOrder(options: ContactAutocompleteOption[]): ContactAutocompleteOption[] {
    const groups: ContactAutocompleteOption[] = [];
    const suggestions: ContactAutocompleteOption[] = [];
    const addressBook: ContactAutocompleteOption[] = [];

    for (const item of options) {
        if (item.isGroup) groups.push(item);
        else if (item.isSuggestion) suggestions.push(item);
        else addressBook.push(item);
    }

    return [...groups, ...suggestions, ...addressBook];
}

function extractTotal(data: unknown): number | null {
    if (data && typeof data === 'object' && typeof (data as any).total === 'number') {
        return (data as any).total;
    }
    return null;
}

export const useContacts = () => {
    const ctx = useContext(ContactsContext);
    if (!ctx) throw new Error('useContacts must be used inside ContactsProvider');
    return ctx;
};

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
    const { activeAccountId } = useAccount();
    const [contacts, setContacts] = useState<ContactAutocompleteOption[]>([]);
    const [hasMoreContacts, setHasMoreContacts] = useState(false);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);
    const [isLoadingMoreContacts, setIsLoadingMoreContacts] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);
    const queryRef = useRef('');
    const pageRef = useRef(1);
    const hasMoreRef = useRef(false);
    const isLoadingRef = useRef(false);
    const contactsRef = useRef<ContactAutocompleteOption[]>([]);

    contactsRef.current = contacts;

    const clearContacts = useCallback(() => {
        requestIdRef.current += 1;
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        queryRef.current = '';
        pageRef.current = 1;
        hasMoreRef.current = false;
        isLoadingRef.current = false;
        setHasMoreContacts(false);
        setIsLoadingContacts(false);
        setIsLoadingMoreContacts(false);
        setContacts([]);
    }, []);

    const runSearch = useCallback(async (query: string, page: number, append: boolean) => {
        const requestId = ++requestIdRef.current;
        const accountIdAtStart = getActiveAccountId();

        isLoadingRef.current = true;
        if (append) {
            setIsLoadingMoreContacts(true);
        } else {
            setIsLoadingContacts(true);
            setIsLoadingMoreContacts(false);
        }

        try {
            const response = await searchContactsApi(query, PAGE_SIZE, page);
            if (requestId !== requestIdRef.current) return;
            if (accountIdAtStart !== getActiveAccountId()) return;

            if (response?.statusCode === 200) {
                const rawList = extractContactSearchItems(response.data, response);
                const mapped = mapSearchItemsToAutocompleteOptions(rawList);
                const total = extractTotal(response.data) ?? extractTotal(response);

                const previous = contactsRef.current;
                const next = withSearchPriorityOrder(
                    append ? mergeUnique(previous, mapped) : mapped,
                );
                const addedCount = append ? next.length - previous.length : mapped.length;
                setContacts(next);

                let hasMore = mapped.length >= PAGE_SIZE;
                if (total != null) {
                    const loadedThrough = (page - 1) * PAGE_SIZE + mapped.length;
                    if (loadedThrough >= total) {
                        hasMore = false;
                    }
                }

                if (append && (mapped.length === 0 || addedCount === 0)) {
                    hasMore = false;
                }

                pageRef.current = page;
                queryRef.current = query;
                hasMoreRef.current = hasMore;
                setHasMoreContacts(hasMore);
            } else if (!append) {
                setContacts([]);
                hasMoreRef.current = false;
                setHasMoreContacts(false);
                pageRef.current = 1;
                queryRef.current = query;
            }
        } catch (error) {
            if (requestId !== requestIdRef.current) return;
            console.error('Failed to search contacts:', error);
            if (!append) {
                setContacts([]);
                hasMoreRef.current = false;
                setHasMoreContacts(false);
            }
        } finally {
            if (requestId === requestIdRef.current) {
                isLoadingRef.current = false;
                setIsLoadingContacts(false);
                setIsLoadingMoreContacts(false);
            }
        }
    }, []);

    const searchContacts = useCallback((query: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        setIsLoadingContacts(true);
        setIsLoadingMoreContacts(false);
        debounceRef.current = setTimeout(() => {
            pageRef.current = 1;
            hasMoreRef.current = false;
            void runSearch(query, 1, false);
        }, SEARCH_DEBOUNCE_MS);
    }, [runSearch]);

    const fetchContacts = useCallback(async () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        pageRef.current = 1;
        queryRef.current = '';
        hasMoreRef.current = false;
        setIsLoadingMoreContacts(false);
        await runSearch('', 1, false);
    }, [runSearch]);

    const resetContactSuggestions = useCallback(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        requestIdRef.current += 1;
        pageRef.current = 1;
        queryRef.current = '';
        hasMoreRef.current = false;
        isLoadingRef.current = false;
        setIsLoadingContacts(false);
        setIsLoadingMoreContacts(false);
        setHasMoreContacts(false);
        setContacts([]);
    }, []);

    const loadMoreContacts = useCallback(() => {
        if (isLoadingRef.current) return;
        if (!hasMoreRef.current) return;
        const nextPage = Math.max(1, pageRef.current) + 1;
        void runSearch(queryRef.current, nextPage, true);
    }, [runSearch]);

    useEffect(() => {
        clearContacts();
        if (activeAccountId && localStorage.getItem('token')) {
            void runSearch('', 1, false);
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
        loadMoreContacts,
        resetContactSuggestions,
        hasMoreContacts,
        isLoadingContacts,
        isLoadingMoreContacts,
        clearContacts,
    };

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};
