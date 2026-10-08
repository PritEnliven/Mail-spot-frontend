import { useCallback, useEffect, useRef, useState } from 'react';
import type {
    ContactGroup,
    ContactGroupSortField,
    ContactGroupSortOrder,
} from '@models/Contact';
import { getContactGroupsList } from '@services/contact/contactService';
import { getActiveAccountId } from '@services/apiService';
import { useAccount } from '@context/AccountContext';

const DEFAULT_LIMIT = 25;

export const CONTACT_GROUPS_LIST_REFRESH_EVENT = 'contact-groups-list-refresh';

export const CONTACT_GROUP_PAGE_LIMIT_OPTIONS = [
    { label: '10', value: '10' },
    { label: '25', value: '25' },
    { label: '50', value: '50' },
    { label: '100', value: '100' },
];

function normalizeGroupsPayload(data: unknown): {
    groups: ContactGroup[];
    total: number;
} {
    if (!data || typeof data !== 'object') {
        return { groups: [], total: 0 };
    }

    const payload = data as Record<string, unknown>;
    const rawGroups = Array.isArray(payload.groups)
        ? payload.groups
        : Array.isArray(data)
            ? data
            : [];

    const groups = rawGroups as ContactGroup[];
    const total = typeof payload.total === 'number' ? payload.total : groups.length;

    return { groups, total };
}

export function useContactGroupsList(enabled = true) {
    const { activeAccountId } = useAccount();
    const [groups, setGroups] = useState<ContactGroup[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimitState] = useState(DEFAULT_LIMIT);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<ContactGroupSortField>('name');
    const [order, setOrder] = useState<ContactGroupSortOrder>('asc');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const setLimit = useCallback((nextLimit: number) => {
        setLimitState(nextLimit);
        setPage(1);
    }, []);

    const fetchList = useCallback(async () => {
        if (!enabled) return;

        const requestId = ++requestIdRef.current;
        const accountIdAtStart = getActiveAccountId();

        setIsLoading(true);
        setError(null);

        try {
            const response = await getContactGroupsList({
                q: searchQuery,
                page,
                limit,
                sort,
                order,
            });

            if (requestId !== requestIdRef.current) return;
            if (accountIdAtStart !== getActiveAccountId()) return;

            if (response?.statusCode === 200) {
                const { groups: nextGroups, total: nextTotal } = normalizeGroupsPayload(
                    response.data,
                );
                setGroups(nextGroups);
                setTotal(nextTotal);
            } else {
                setError(response?.message || 'Failed to load groups');
                setGroups([]);
                setTotal(0);
            }
        } catch {
            if (requestId !== requestIdRef.current) return;
            setError('Failed to load groups');
            setGroups([]);
            setTotal(0);
        } finally {
            if (requestId === requestIdRef.current) {
                setIsLoading(false);
            }
        }
    }, [enabled, limit, order, page, searchQuery, sort]);

    useEffect(() => {
        requestIdRef.current += 1;
        setGroups([]);
        setTotal(0);
        setError(null);
        setPage(1);
        setSearchQuery('');
    }, [activeAccountId]);

    useEffect(() => {
        if (!enabled) return;
        void fetchList();
    }, [fetchList, activeAccountId, enabled]);

    const updateGroup = useCallback((updated: ContactGroup) => {
        if (!updated?._id) return;
        setGroups((prev) => prev.map((group) => (
            group._id === updated._id ? { ...group, ...updated } : group
        )));
    }, []);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
    const rangeEnd = Math.min(page * limit, total);

    return {
        groups,
        page,
        limit,
        total,
        totalPages,
        rangeStart,
        rangeEnd,
        searchQuery,
        sort,
        order,
        isLoading,
        error,
        setPage,
        setLimit,
        setSearchQuery,
        setSort,
        setOrder,
        updateGroup,
        refresh: fetchList,
    };
}
