import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContactAutocompleteOption } from '@models/Contact';
import { searchContacts as searchContactsApi } from '@services/contact/contactService';
import {
    extractContactSearchItems,
    mapSearchItemsToAutocompleteOptions,
} from '@utils/contactSearchUtil';

const AUTOCOMPLETE_LIMIT = 150;
const DEBOUNCE_MS = 300;

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
                const list = extractContactSearchItems(response.data, response);
                setOptions(mapSearchItemsToAutocompleteOptions(list));
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
