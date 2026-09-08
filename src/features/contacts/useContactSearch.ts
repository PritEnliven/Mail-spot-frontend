import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContactAutocompleteOption } from '@models/Contact';
import { searchContacts as searchContactsApi } from '@services/contact/contactService';

const AUTOCOMPLETE_LIMIT = 20;
const DEBOUNCE_MS = 300;

function mapToAutocompleteOptions(items: any[]): ContactAutocompleteOption[] {
    return (items ?? []).map((item) => ({
        value: item.email || item._id,
        name: item.name || item.email,
        email: item.email,
        label: item.name || item.email,
        isSuggestion: Boolean(item.isSuggestion),
    }));
}

export function useContactSearch() {
    const [options, setOptions] = useState<ContactAutocompleteOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestQueryRef = useRef('');

    const runSearch = useCallback(async (query: string) => {
        latestQueryRef.current = query;
        setIsSearching(true);

        try {
            const response = await searchContactsApi(query, AUTOCOMPLETE_LIMIT);
            if (latestQueryRef.current !== query) return;

            if (response?.statusCode === 200) {
                const list = Array.isArray(response.data) ? response.data : response.data?.contacts ?? [];
                setOptions(mapToAutocompleteOptions(list));
            } else {
                setOptions([]);
            }
        } catch {
            if (latestQueryRef.current === query) {
                setOptions([]);
            }
        } finally {
            if (latestQueryRef.current === query) {
                setIsSearching(false);
            }
        }
    }, []);

    const search = useCallback((query: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            void runSearch(query);
        }, DEBOUNCE_MS);
    }, [runSearch]);

    const loadInitial = useCallback(() => {
        void runSearch('');
    }, [runSearch]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return {
        options,
        isSearching,
        search,
        loadInitial,
    };
}
