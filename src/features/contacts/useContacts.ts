import { useCallback, useEffect, useRef, useState } from 'react';
import type { Contact, ContactSortField } from '@models/Contact';
import { getContactsList } from '@services/contact/contactService';
import { getActiveAccountId } from '@services/apiService';
import { useAccount } from '@context/AccountContext';

const DEFAULT_LIMIT = 50;

export const CONTACTS_LIST_REFRESH_EVENT = 'contacts-list-refresh';

export function useContactsList() {
    const { activeAccountId } = useAccount();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(DEFAULT_LIMIT);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<ContactSortField>('name');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const fetchList = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        const accountIdAtStart = getActiveAccountId();

        setIsLoading(true);
        setError(null);

        try {
            const response = await getContactsList({
                q: searchQuery,
                page,
                limit,
                sort,
            });

            if (requestId !== requestIdRef.current) return;
            if (accountIdAtStart !== getActiveAccountId()) return;

            if (response?.statusCode === 200) {
                setContacts(response.data?.contacts ?? []);
                setTotal(response.data?.total ?? 0);
            } else {
                setError(response?.message || 'Failed to load contacts');
                setContacts([]);
                setTotal(0);
            }
        } catch {
            if (requestId !== requestIdRef.current) return;
            setError('Failed to load contacts');
            setContacts([]);
            setTotal(0);
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, [limit, page, searchQuery, sort]);

    // Clear previous account data as soon as the mailbox changes, then reload.
    useEffect(() => {
        requestIdRef.current += 1;
        setContacts([]);
        setTotal(0);
        setError(null);
        setPage(1);
        setSearchQuery('');
    }, [activeAccountId]);

    useEffect(() => {
        void fetchList();
    }, [fetchList, activeAccountId]);

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
