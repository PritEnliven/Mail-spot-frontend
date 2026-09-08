import { useCallback, useEffect, useRef, useState } from 'react';
import type { Contact, ContactSortField } from '@models/Contact';
import { getContactsList } from '@services/contact/contactService';

const DEFAULT_LIMIT = 50;

export function useContactsList() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(DEFAULT_LIMIT);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<ContactSortField>('name');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchList = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getContactsList({
                q: searchQuery,
                page,
                limit,
                sort,
            });

            if (response?.statusCode === 200) {
                setContacts(response.data?.contacts ?? []);
                setTotal(response.data?.total ?? 0);
            } else {
                setError(response?.message || 'Failed to load contacts');
                setContacts([]);
                setTotal(0);
            }
        } catch {
            setError('Failed to load contacts');
            setContacts([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [limit, page, searchQuery, sort]);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
    const rangeEnd = Math.min(page * limit, total);

    return {
        contacts,
        page,
        limit,
        total,
        totalPages,
        rangeStart,
        rangeEnd,
        searchQuery,
        sort,
        isLoading,
        error,
        setPage,
        setSearchQuery,
        setSort,
        refresh: fetchList,
    };
}
