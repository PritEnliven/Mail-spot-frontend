import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import { getCounts, getEmailsService, searchAndFilterEmailService } from '@services/email/emailService';
import { getBoxes } from '@services/mailbox/mailboxService';
import { getUserPermissions } from '@services/settings/settingsService';
import { buildParentFolderOptions, resolveAllSidebarItems } from '@utils/emailUtil';
import {
    fetchEmailsWithCache,
    markEmailsReadInCache,
    removeEmailsFromCache,
    invalidateMailboxCache,
} from '@services/email/emailCacheService';
import {
    manageCache,
    enforceSizeLimit,
    prunePaginationWindow,
    refreshCache,
    getCacheStats,
    PAGINATION_WINDOW_SIZE
} from '../db/emailCacheRepository';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export interface BoxCount {
    isTotal: boolean;
    unreadCount: number;
    totalCount: number;
}

export interface AdminSettingsPermissions {
    userId?: string;
    role: 'user' | 'admin';
    fileSize: number;
    allowedFileTypes: any[];
    sendToOutsideDomain: boolean;
    receiveFromOutsideDomain: boolean;
    both?: boolean;
    aiFeatures: boolean;
}

interface SidebarStateProps {
    boxes: any[];
    customBoxes: any[];
    otherMenu: any[];
    boxCounts: Record<string, BoxCount>;
    parentFolderOptions: any[];
    delimiter: string | null;
}

type SidebarItemType = {
    color: any;
    id: string;
    boxName: string | any;
    label: string;
    icon: string;
    activeIcon: string;
    boxKey: string;
    unreadCount?: number;
    category: 'boxes' | 'customBoxes' | 'otherMenu';
};

interface MailDataType {
    /* Mail List State */
    boxName: string;
    boxTitle: string;
    totalEmailBadge: number;
    emails: Email[];
    pagination: Pagination | null;
    mailListPage: number;
    emailDetailSelected: Email | null;
    activeEmailMessageId: string | null;

    /* Search */
    allSearchResult: boolean | false;
    searchTerm: string;
    filterForm: FilterEmailFormValues | null;

    /* Sidebar */
    sidebarState: SidebarStateProps;
    setSidebarState: (state: SidebarStateProps) => void;
    setSidebarStateFromAPI: () => void;
    sidebarItems: SidebarItemType[];
    setSidebarItems: (items: SidebarItemType[]) => void;
    socketId: string | null;
    isSidebarDataReady: boolean;
    setIsSidebarDataReady: (ready: boolean) => void;

    userPermissions: AdminSettingsPermissions | null;
    setUserPermissions: (permissions: AdminSettingsPermissions | null) => void;


    /* Mail actions */
    setBoxName: (box: string) => void;
    setBoxTitle: (boxTitle: string) => void;
    setTotalEmailBadge: (totalEmailBadge: number) => void;
    // setEmails: (emails: Email[]) => void;
    setEmails: (emails: Email[] | ((prevEmails: Email[]) => Email[])) => void;
    setPagination: (pagination: Pagination | null) => void;
    setMailListPage: (page: number) => void;
    setEmailDetailSelected: (email: Email | null) => void;
    setActiveEmailMessageId: (messageId: string | null) => void;
    setSearchTerm: (term: string) => void;
    setFilterForm: (form: FilterEmailFormValues | null) => void;
    setSocketId: (socketId: string | null) => void;

    /* API */
    fetchEmails: (page?: number, boxName?: string, isPrevious?: boolean, mailAction?: string, forceRefresh?: boolean) => Promise<void>;
    fetchSearchEmails: (isPrevious?: boolean) => Promise<void>;

    /* Mail mutations */
    updateEmailReadState: (messageIds: string[], isRead: boolean) => void;
    deleteEmailState: (messageIds: string[]) => void;

    /* Events */
    updateBoxCount: (boxName: string, unreadDecrement: number, totalDecrement: number) => void;
    setAllSearchResult: (value: boolean) => void;

    /* Socket */
    addNewEmail: (email: Email | Email[]) => void;
    updateEmail: (email: Email) => void;
    deleteEmail: (emailId: string) => void;

    /* Read/Unread filter */
    readUnreadFilter: string;
    setReadUnreadFilter: (filter: string) => void;

    /* Sidebar loading state */
    isSidebarLoading: boolean;
    setIsSidebarLoading: (loading: boolean) => void;
    isSidebarCountLoading: boolean;
    setIsSidebarCountLoading: (loading: boolean) => void;
    isTotalCountLoading: boolean;
    setIsTotalCountLoading: (loading: boolean) => void;

}

const MailDataContext = createContext<MailDataType | undefined>(undefined);

export const useMailData = () => {
    const ctx = useContext(MailDataContext);
    if (!ctx) throw new Error('useMailData must be used inside MailDataProvider');
    return ctx;
};

export const MailDataProvider = ({ children }: { children: ReactNode }) => {
    const [boxName, setBoxName] = useState('INBOX');
    const [boxTitle, setBoxTitle] = useState('');
    const [totalEmailBadge, setTotalEmailBadge] = useState(0);
    const [emails, setEmails] = useState<Email[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const paginationRef = useRef<Pagination | null>(null);
    const [mailListPage, setMailListPage] = useState(1);
    const [emailDetailSelected, setEmailDetailSelected] = useState<Email | null>(null);
    const [activeEmailMessageId, setActiveEmailMessageId] = useState<string | null>(null);
    const [allSearchResult, setAllSearchResult] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterForm, setFilterForm] = useState<FilterEmailFormValues | null>(null);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<AdminSettingsPermissions | null>(null);
    const [readUnreadFilter, setReadUnreadFilter] = useState<string>('all');
    const [isSidebarLoading, setIsSidebarLoading] = useState<boolean>(false);
    const [isSidebarCountLoading, setIsSidebarCountLoading] = useState<boolean>(false);
    const [isTotalCountLoading, setIsTotalCountLoading] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>('guest');

    useEffect(() => {
        // Run comprehensive cache management on app startup
        void manageCache();
    }, []);

    const [sidebarState, setSidebarState] = useState<SidebarStateProps>({
        boxes: [],
        customBoxes: [],
        otherMenu: [],
        boxCounts: {},
        parentFolderOptions: [],
        delimiter: null,
    });

    const [sidebarItems, setSidebarItems] = useState<SidebarItemType[]>([]);
    const [isSidebarDataReady, setIsSidebarDataReady] = useState(false);

    paginationRef.current = pagination;

    useEffect(() => {
        const loadUserPermissions = async () => {
            try {
                const response = await getUserPermissions();
                if (response?.statusCode === 200) {
                    setUserPermissions(response.data ?? null);
                    // Set userId from permissions response
                    if (response.data?.userId) {
                        setUserId(response.data.userId);
                    }
                }
            } catch {
                setUserPermissions(null);
                // Fallback: try to get userId from JWT token
                const fallbackUserId = getUserIdFromToken();
                setUserId(fallbackUserId);
            }
        };

        loadUserPermissions();
    }, []);

    // Helper to get userId from JWT token
    const getUserIdFromToken = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return 'guest';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub ?? payload.userId ?? 'guest';
        } catch {
            return 'guest';
        }
    };

    /* -------------------- API Functions -------------------- */
    const fetchEmails = useCallback(
        async (page = mailListPage, boxNameParam?: string, isPrevious?: boolean, mailAction: string = 'all', forceRefresh = false) => {

            if (!boxNameParam) return;

            try {

                if (mailAction === 'all') {
                    setReadUnreadFilter('all');
                }

                // Determine isReadTotal based on mailAction (not state to avoid closure issue)
                let isReadTotal: boolean | null = null;
                if (mailAction === 'unread') isReadTotal = false;
                else if (mailAction === 'read') isReadTotal = true;
                // For 'all', isReadTotal remains null

                // Use cache-first approach for 'all' mailAction
                if (mailAction === 'all') {
                    const { emails: emailList, pagination: paginationData, fromCache } = await fetchEmailsWithCache({
                        userId,
                        boxName: boxNameParam,
                        page,
                        lastMailId: isPrevious ? '' : paginationRef.current?.lastMailId ?? '',
                        firstMailId: isPrevious ? paginationRef.current?.firstMailId ?? '' : '',
                        totalCount: page === 1 ? null : (paginationRef.current?.totalEmails ?? 0),
                        mailAction,
                        isPrevious,
                        forceRefresh,
                    });

                    // Optional: log for debugging
                    console.debug(`[MailData] fetchEmails page=${page} fromCache=${fromCache}`);

                    if (boxNameParam && page === 1) {
                        setIsTotalCountLoading(true);

                        getCounts(boxNameParam, false, isReadTotal).then((boxCountResponse) => {
                            if (boxCountResponse.statusCode === 200 && boxCountResponse.data) {
                                setPagination(prevPagination => prevPagination ? {
                                    ...prevPagination,
                                    totalEmails: boxCountResponse.data.totalCount,
                                    startCount: 1,
                                    endCount: emailList.length
                                } : prevPagination);

                                // Update sidebar state for all boxes returned in sidebarCounts
                                setSidebarState(prev => {
                                    const updatedBoxCounts = { ...prev.boxCounts };
                                    if (boxCountResponse.data.sidebarCounts) {
                                        Object.entries(boxCountResponse.data.sidebarCounts).forEach(([name, counts]: [string, any]) => {
                                            updatedBoxCounts[name] = {
                                                isTotal: counts.isTotal,
                                                unreadCount: counts.unreadCount ?? updatedBoxCounts[name]?.unreadCount ?? 0,
                                                totalCount: counts.totalCount ?? updatedBoxCounts[name]?.totalCount ?? 0,
                                            };
                                        });
                                    } else {
                                        // Fallback for single box if sidebarCounts is missing
                                        updatedBoxCounts[boxNameParam] = {
                                            isTotal: boxCountResponse.data.isTotal,
                                            unreadCount: boxCountResponse.data.unreadCount ?? updatedBoxCounts[boxNameParam]?.unreadCount ?? 0,
                                            totalCount: boxCountResponse.data.totalCount ?? updatedBoxCounts[boxNameParam]?.totalCount ?? 0,
                                        };
                                    }
                                    return { ...prev, boxCounts: updatedBoxCounts };
                                });
                            }
                        }).finally(() => {
                            setIsTotalCountLoading(false);
                        });
                    }
                    setEmails(emailList);
                    setPagination(paginationData);
                    setMailListPage(page);
                    setTotalEmailBadge(paginationData.totalEmails);

                    if (!fromCache) {
                        void enforceSizeLimit(userId, boxNameParam);
                        if (page > PAGINATION_WINDOW_SIZE + 5) {
                            void prunePaginationWindow(userId, boxNameParam, page);
                        }
                    }

                } else {
                    let payload = {
                        current_active_box: boxNameParam,
                        vPage: page,
                        lastMailId: isPrevious ? '' : paginationRef.current?.lastMailId ?? '',
                        firstMailId: isPrevious ? paginationRef.current?.firstMailId ?? '' : '',
                        totalCount: page === 1 ? null : (paginationRef.current?.totalEmails ?? 0),
                        mailAction: mailAction,
                    };

                    if (page === 1) {
                        payload.lastMailId = "";
                        payload.firstMailId = "";
                    }

                    const response = await getEmailsService(payload);
                    if (response.statusCode === 200) {
                        const emailList = response.data.emailList || [];
                        const paginationData = response.data.pagination;

                        // Calculate start and end counts if they aren't provided correctly by backend
                        if (page === 1) {
                            paginationData.startCount = 1;
                            paginationData.endCount = emailList.length;
                        } else {
                            paginationData.startCount = (page - 1) * 25 + 1;
                            paginationData.endCount = paginationData.startCount + emailList.length - 1;
                        }

                        setEmails(emailList);
                        setPagination(paginationData);
                        setMailListPage(page);
                        setTotalEmailBadge(paginationData.totalEmails);

                        // If it's page 1, we should also update the counts from the API response if available
                        // or trigger getCounts for the sidebar
                        if (page === 1 && boxNameParam) {
                            setIsTotalCountLoading(true);

                            // Determine isReadTotal based on mailAction
                            let isReadTotal: boolean | null = null;
                            if (mailAction === 'unread') isReadTotal = false;
                            else if (mailAction === 'read') isReadTotal = true;

                            getCounts(boxNameParam, false, isReadTotal).then((boxCountResponse) => {
                                if (boxCountResponse.statusCode === 200 && boxCountResponse.data) {
                                    setPagination(prev => prev ? {
                                        ...prev,
                                        totalEmails: boxCountResponse.data.totalCount
                                    } : prev);

                                    setSidebarState(prev => {
                                        const updatedBoxCounts = { ...prev.boxCounts };
                                        if (boxCountResponse.data.sidebarCounts) {
                                            Object.entries(boxCountResponse.data.sidebarCounts).forEach(([name, counts]: [string, any]) => {
                                                updatedBoxCounts[name] = {
                                                    isTotal: counts.isTotal,
                                                    unreadCount: counts.unreadCount ?? updatedBoxCounts[name]?.unreadCount ?? 0,
                                                    totalCount: counts.totalCount ?? updatedBoxCounts[name]?.totalCount ?? 0,
                                                };
                                            });
                                        } else {
                                            // Fallback for single box if sidebarCounts is missing
                                            updatedBoxCounts[boxNameParam] = {
                                                isTotal: boxCountResponse.data?.isTotal,
                                                unreadCount: boxCountResponse.data.unreadCount ?? updatedBoxCounts[boxNameParam]?.unreadCount ?? 0,
                                                totalCount: updatedBoxCounts[boxNameParam]?.isTotal ? updatedBoxCounts[boxNameParam]?.totalCount : boxCountResponse.data.totalCount ?? 0,
                                            };
                                        }
                                        return { ...prev, boxCounts: updatedBoxCounts };
                                    });
                                }
                            }).finally(() => {
                                setIsTotalCountLoading(false);
                            });
                        }

                        // Update sidebar box unread count when mailAction is read/unread
                        if (mailAction === 'unread') {
                            setSidebarState(prev => ({
                                ...prev,
                                boxCounts: {
                                    ...prev.boxCounts,
                                    [boxNameParam]: {
                                        ...prev.boxCounts[boxNameParam],
                                        unreadCount: response.data.pagination.totalEmails
                                    }
                                }
                            }));

                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch emails:', error);
            }
        },
        [mailListPage, readUnreadFilter, userId]
    );

    const fetchSearchEmails = useCallback(
        async (isPrevious = false) => {
            if (!searchTerm && !filterForm) return;

            try {
                const cursor = isPrevious ? pagination?.firstMailId : pagination?.lastMailId;

                const direction = isPrevious ? 'prev' : 'next';
                const vPage = isPrevious ? Math.max(1, mailListPage - 1) : mailListPage + 1;

                const payload: any = {
                    searchTerm: searchTerm || undefined,
                    limit: 25,
                    cursor: cursor || undefined,
                    direction,
                    vPage,
                    searchQuery: searchTerm || undefined
                };

                // Add filter form fields if they exist
                if (filterForm) {
                    Object.assign(payload, {
                        from: filterForm.from,
                        to: filterForm.to,
                        subject: filterForm.subject,
                        attachmentSizeType: filterForm.attachmentSizeType,
                        dateRange: filterForm.dateRange,
                        isFilter: true
                    });
                }

                const response = await searchAndFilterEmailService(payload);
                if (response.statusCode === 200) {
                    setEmails(response.data.emailList || []);
                    setPagination(response.data.pagination);
                    setMailListPage(vPage);
                    setTotalEmailBadge(response.data.pagination.totalEmails);
                }
            } catch (error) {
                console.error('Failed to fetch search emails:', error);
            }
        },
        [searchTerm, filterForm, pagination, mailListPage]
    );

    /* -------------------- Mail Mutations -------------------- */
    const updateEmailReadState = (messageIds: string[], isRead: boolean) => {
        // Count how many emails are changing read state
        let unreadCountChange = 0;

        if (isRead) {
            // Marking as read: decrement unread count for emails that were unread
            unreadCountChange = emails.filter(email =>
                messageIds.includes(email.messageId) && !email.isSeen
            ).length;
        } else {
            // Marking as unread: increment unread count for emails that were read
            unreadCountChange = emails.filter(email =>
                messageIds.includes(email.messageId) && email.isSeen
            ).length;
        }

        setEmails(prev =>
            prev.map(email =>
                messageIds.includes(email.messageId)
                    ? {
                        ...email,
                        isSeen: isRead,
                        flags: isRead ? [...email.flags, '\\Seen'] : email.flags.filter(flag => flag !== '\\Seen'),
                    }
                    : email
            )
        );

        // Keep IndexedDB consistent — fire-and-forget
        void markEmailsReadInCache(userId, boxName, messageIds, isRead);

        void unreadCountChange;
    };

    const deleteEmailState = (messageIds: string[]) => {
        // Count how many unread emails are being deleted
        const unreadDeletedCount = emails
            .filter(email => messageIds.includes(email.messageId) && !email.isSeen)
            .length;

        setEmails(prev => prev.filter(email => !messageIds.includes(email.messageId)));
        const newPagination = pagination ? {
            ...pagination,
            endCount: pagination.endCount - messageIds.length,
            totalEmails: pagination.totalEmails - messageIds.length
        } : null;
        setPagination(newPagination);
        setTotalEmailBadge(newPagination ? newPagination.totalEmails : 0);

        // Update sidebar state with new unread counts if we have unread emails being deleted
        if (boxName && (unreadDeletedCount > 0 || messageIds.length > 0)) {
            setSidebarState(prev => ({
                ...prev,
                boxCounts: {
                    ...prev.boxCounts,
                    [boxName]: {
                        ...prev.boxCounts[boxName],
                        unreadCount: Math.max(0, (prev.boxCounts[boxName]?.unreadCount || 0) - unreadDeletedCount),
                        totalCount: Math.max(0, (prev.boxCounts[boxName]?.totalCount || 0) - messageIds.length)
                    }
                }
            }));
        }

        // Keep IndexedDB consistent — fire-and-forget
        void removeEmailsFromCache(userId, boxName, messageIds);
    };

    /* -------------------- Socket-safe helpers -------------------- */
    const addNewEmail = (emails: Email | Email[]) => {
        const newEmails = Array.isArray(emails) ? emails : [emails];

        newEmails.forEach((email: Email & { attachments?: any }) => {
            // Handle both cases: email.attachments and email.attachments.attachments
            email.attachments =
                (email.attachments && 'attachments' in email.attachments)
                    ? email.attachments.attachments
                    : email.attachments || [];
        });

        // Only add emails that don't already exist by messageId (also de-dupe within the batch)
        const uniqueNewEmails = newEmails.filter((email, idx, arr) =>
            email?.messageId && arr.findIndex(e => e?.messageId === email.messageId) === idx
        );

        setEmails(prev => {
            const existingIds = new Set(prev.map(e => e.messageId));
            const toAdd = uniqueNewEmails
                .filter(e => e?.messageId && !existingIds.has(e.messageId))
                .map(email => ({ ...email, isSelected: false }));

            const addedEmailsCount = toAdd.length;
            if (addedEmailsCount === 0) return prev;

            const addedUnreadCount = toAdd.filter(email => !email.isSeen).length;

            setTotalEmailBadge(prevBadge => prevBadge + addedEmailsCount);

            setPagination(prevPagination => prevPagination ? {
                ...prevPagination,
                totalEmails: prevPagination.totalEmails + addedEmailsCount,
                endCount: prevPagination.endCount + addedEmailsCount
            } : prevPagination);

            if (boxName) {
                setSidebarState(prevSidebar => ({
                    ...prevSidebar,
                    boxCounts: {
                        ...prevSidebar.boxCounts,
                        [boxName]: {
                            isTotal: false,
                            unreadCount: (prevSidebar.boxCounts[boxName]?.unreadCount || 0) + addedUnreadCount,
                            totalCount: (prevSidebar.boxCounts[boxName]?.totalCount || 0) + addedEmailsCount
                        }
                    }
                }));
            }

            return [...toAdd, ...prev];
        });

        // After updating React state, invalidate the box cache so page 1
        // gets re-fetched from the server next time (new email shifted cursors)
        void invalidateMailboxCache(userId, boxName);
    };

    const updateEmail = (email: Email) => {
        setEmails(prev => prev.map(e => e.messageId === email.messageId ? { ...e, ...email } : e));
    };

    const deleteEmail = (emailIds: string | string[]) => {
        const idsToDelete = Array.isArray(emailIds) ? emailIds : [emailIds];

        setEmails(prevEmails => {
            // Only consider IDs that currently exist in the email list
            const existingIdsSet = new Set(prevEmails.map(e => e.messageId));
            const validIdsToDelete = idsToDelete.filter(id => existingIdsSet.has(id));

            // If none of the IDs exist anymore, do nothing (handles duplicate socket events safely)
            if (validIdsToDelete.length === 0) return prevEmails;

            // Find all emails that will be removed
            const removedEmails = prevEmails.filter(e => validIdsToDelete.includes(e.messageId));

            // Calculate unread count for the removed emails
            const unreadCountToDecrement = removedEmails.filter(
                email => !email.isSeen
            ).length;

            // Filter out the deleted emails
            const updatedEmails = prevEmails.filter(e => !validIdsToDelete.includes(e.messageId));

            const removedCount = removedEmails.length;

            // Update total email badge
            setTotalEmailBadge(prev => Math.max(0, prev - removedCount));

            // Update pagination
            setPagination(prev => prev ? {
                ...prev,
                totalEmails: Math.max(0, prev.totalEmails - removedCount),
                endCount: Math.max(0, prev.endCount - removedCount)
            } : prev);

            // Update sidebar state if boxName is available
            if (boxName && removedCount > 0) {
                setSidebarState(prev => {
                    const currentBox = prev.boxCounts[boxName] || { unreadCount: 0, totalCount: 0 };
                    return {
                        ...prev,
                        boxCounts: {
                            ...prev.boxCounts,
                            [boxName]: {
                                isTotal: false,
                                unreadCount: Math.max(0, currentBox.unreadCount - unreadCountToDecrement),
                                totalCount: Math.max(0, currentBox.totalCount - removedCount)
                            }
                        }
                    };
                });
            }

            return updatedEmails;
        });
    };

    /* -------------------- Sidebar helpers -------------------- */
    const setSidebarStateFromAPI = async () => {
        setIsSidebarLoading(true);
        try {
            const response = await getBoxes()
            const boxCounts: Record<string, BoxCount> = {};

            [...response.boxes, ...response.customBoxes, ...response.otherMenu].forEach(
                box => {
                    if (box.value) {
                        boxCounts[box.value] = {
                            isTotal: box.isTotal,
                            unreadCount: box.count ?? 0,
                            totalCount: box.totalCount ?? box.count ?? 0,
                        };
                    }
                }
            );

            // Fire getCounts without blocking - update counts when response arrives
            if (boxName) {
                setIsSidebarCountLoading(true);
                getCounts(boxName, true, null).then((boxCountResponse) => {
                    if (boxCountResponse.statusCode === 200 && boxCountResponse.data) {
                        setSidebarState(prev => {
                            const updatedBoxCounts = { ...prev.boxCounts };
                            Object.entries(boxCountResponse.data.sidebarCounts).forEach(([boxName, box]: [string, any]) => {
                                updatedBoxCounts[boxName] = {
                                    isTotal: box.isTotal,
                                    unreadCount: box.unreadCount ?? 0,
                                    totalCount: box.totalCount ?? 0,
                                };
                            });
                            return { ...prev, boxCounts: updatedBoxCounts };
                        });
                    }
                }).finally(() => {
                    setIsSidebarCountLoading(false);
                });
            }

            response.boxCounts = boxCounts;

            const sidebarItems = resolveAllSidebarItems(
                response.boxes,
                response.customBoxes,
                response.otherMenu,
                boxCounts
            );

            setSidebarItems(sidebarItems);

            setSidebarState({
                boxes: response.boxes,
                customBoxes: response.customBoxes,
                otherMenu: response.otherMenu,
                boxCounts,
                parentFolderOptions: buildParentFolderOptions(
                    response.boxes,
                    response.customBoxes
                ),
                delimiter: response.delimiter
            });

            setIsSidebarDataReady(true);
            return response;
        } catch (error) {
            console.error('Failed to load sidebar data:', error);
            throw error;
        } finally {
            setIsSidebarLoading(false);
        }
    };

    const updateBoxCount = (
        boxName: string,
        unreadDecrement: number,
        totalDecrement: number
    ) => {
        setSidebarState(prev => {
            const current = prev.boxCounts[boxName] || { unreadCount: 0, totalCount: 0 };

            // Calculate new values
            const newUnreadCount = Math.max(0, (current.unreadCount || 0) + unreadDecrement);
            const newTotalCount = Math.max(0, (current.totalCount || 0) + totalDecrement);

            return {
                ...prev,
                boxCounts: {
                    ...prev.boxCounts,
                    [boxName]: {
                        isTotal: false,
                        unreadCount: newUnreadCount,
                        totalCount: newTotalCount,
                    }
                }
            };
        });
    };

    // Cache management utilities
    const refreshMailboxCache = useCallback(async (boxNameParam?: string) => {
        await refreshCache(userId, boxNameParam);
        // Refetch current page after cache refresh
        if (boxNameParam || boxName) {
            await fetchEmails(mailListPage, boxNameParam || boxName, false, 'all', true);
        }
    }, [userId, boxName, mailListPage, fetchEmails]);

    const getCacheStatistics = useCallback(async () => {
        return await getCacheStats();
    }, []);

    const value = {
        boxName,
        boxTitle,
        totalEmailBadge,
        emails,
        pagination,
        mailListPage,
        emailDetailSelected,
        activeEmailMessageId,
        allSearchResult,
        searchTerm,
        filterForm,
        socketId,
        userPermissions,
        setUserPermissions,
        setBoxName,
        setBoxTitle,
        setEmails,
        setTotalEmailBadge,
        setPagination,
        setMailListPage,
        setEmailDetailSelected,
        setActiveEmailMessageId,
        setSearchTerm,
        setFilterForm,
        fetchEmails,
        fetchSearchEmails,
        updateEmailReadState,
        deleteEmailState,
        updateBoxCount,
        setAllSearchResult,
        setSidebarStateFromAPI,
        sidebarState,
        setSidebarState,
        sidebarItems,
        setSidebarItems,
        setSocketId,
        addNewEmail,
        updateEmail,
        deleteEmail,
        isSidebarDataReady,
        setIsSidebarDataReady,
        readUnreadFilter,
        setReadUnreadFilter,
        isSidebarLoading,
        setIsSidebarLoading,
        isSidebarCountLoading,
        setIsSidebarCountLoading,
        isTotalCountLoading,
        setIsTotalCountLoading,
        // Cache management utilities
        refreshMailboxCache,
        getCacheStatistics
    };

    return (
        <MailDataContext.Provider value={value}>
            {children}
        </MailDataContext.Provider>
    );
};
