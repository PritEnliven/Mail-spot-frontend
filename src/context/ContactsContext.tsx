import type { ContactAutocompleteOption } from '@models/Contact';
import { searchContacts as searchContactsApi } from '@services/contact/contactService';
import { getActiveAccountId } from '@services/apiService';
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
            isSuggestion: Boolean(
                item.isSuggestion ||
                item.isSuggested ||
                item.is_suggestion ||
                item.suggested ||
                item.type === 'suggestion',
            ),
        };
    });
}

function optionKey(opt: ContactAutocompleteOption): string {
    return (opt.email || opt.value || '').trim().toLowerCase();
}

function itemEmailKey(item: any): string {
    const emails = Array.isArray(item?.emails) ? item.emails : [];
    return String(item?.email || emails[0] || item?._id || '')
        .trim()
        .toLowerCase();
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

/** Suggested addresses first, then saved contacts. Order within each group is kept. */
function withSuggestionsFirst(options: ContactAutocompleteOption[]): ContactAutocompleteOption[] {
    const suggestions: ContactAutocompleteOption[] = [];
    const addressBook: ContactAutocompleteOption[] = [];
    for (const item of options) {
        if (item.isSuggestion) suggestions.push(item);
        else addressBook.push(item);
    }
    if (suggestions.length === 0) return options;
    return [...suggestions, ...addressBook];
}

function mergeSuggestionAndContactRows(suggestions: any[], contacts: any[]): any[] {
    const suggestionItems = suggestions.map((item) =>
        item && typeof item === 'object' ? { ...item, isSuggestion: true } : item,
    );
    const suggestionKeys = new Set(suggestionItems.map(itemEmailKey).filter(Boolean));
    const contactItems = contacts.filter((item) => {
        const key = itemEmailKey(item);
        return !key || !suggestionKeys.has(key);
    });
    return [...suggestionItems, ...contactItems];
}

/**
 * Normalize contact/search payloads.
 * Backend may return:
 * - `{ suggestions, contacts, total }`
 * - `{ data: { suggestions, contacts } }`
 * - flat `contacts` array with `isSuggestion` on rows
 * - `suggestions` as a sibling of `data` on the root response
 */
function extractContactList(data: unknown, responseRoot?: any): any[] {
    const rootSuggestions = Array.isArray(responseRoot?.suggestions)
        ? responseRoot.suggestions
        : [];

    if (Array.isArray(data)) {
        return rootSuggestions.length > 0
            ? mergeSuggestionAndContactRows(rootSuggestions, data)
            : data;
    }

    if (!data || typeof data !== 'object') {
        return rootSuggestions.length > 0
            ? mergeSuggestionAndContactRows(rootSuggestions, [])
            : [];
    }

    const record = data as Record<string, unknown>;

    // Unwrap one nested `{ data: { suggestions, contacts } }` layer.
    if (
        record.data &&
        typeof record.data === 'object' &&
        !Array.isArray(record.data) &&
        (
            Array.isArray((record.data as any).contacts) ||
            Array.isArray((record.data as any).suggestions) ||
            Array.isArray((record.data as any).suggested) ||
            Array.isArray((record.data as any).suggestedContacts)
        )
    ) {
        return extractContactList(record.data, responseRoot);
    }

    const suggestions =
        (Array.isArray(record.suggestions) && record.suggestions) ||
        (Array.isArray(record.suggested) && record.suggested) ||
        (Array.isArray(record.suggestedContacts) && record.suggestedContacts) ||
        rootSuggestions;

    const contacts = Array.isArray(record.contacts)
        ? record.contacts
        : Array.isArray(record.list)
            ? record.list
            : null;

    if (suggestions.length === 0 && !contacts) return [];

    if (!contacts) {
        return mergeSuggestionAndContactRows(suggestions, []);
    }

    return mergeSuggestionAndContactRows(suggestions, contacts);
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
                // Pass full response so suggestions living beside `data` are not dropped.
                const rawList = extractContactList(response.data, response);
                const mapped = mapToAutocompleteOptions(rawList);
                const total = extractTotal(response.data) ?? extractTotal(response);

                const previous = contactsRef.current;
                const next = withSuggestionsFirst(append ? mergeUnique(previous, mapped) : mapped);
                const addedCount = append ? next.length - previous.length : mapped.length;
                setContacts(next);

                // A full page means more may exist. Use total only to stop when exhausted.
                let hasMore = mapped.length >= PAGE_SIZE;
                if (total != null) {
                    const loadedThrough = (page - 1) * PAGE_SIZE + mapped.length;
                    if (loadedThrough >= total) {
                        hasMore = false;
                    }
                }

                // Stop if this page was empty, or append produced no new unique contacts
                // (e.g. backend ignoring page and returning the same first page).
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
        // Show loader as soon as the user types (before debounce fires).
        setIsLoadingContacts(true);
        setIsLoadingMoreContacts(false);
        debounceRef.current = setTimeout(() => {
            pageRef.current = 1;
            hasMoreRef.current = false;
            void runSearch(query, 1, false);
        }, SEARCH_DEBOUNCE_MS);
    }, [runSearch]);

    const fetchContacts = useCallback(async () => {
        // Always restart from page 1 (dropdown open / reopen).
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
        // Dropdown closed — drop pagination so the next open starts from scratch.
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

    // Drop previous account contacts immediately when the active mailbox changes.
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
