import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { buildSearchFilterPayload } from '@utils/filterUtil';
import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import { getCounts, getEmailsService, searchAndFilterEmailService } from '@services/email/emailService';
import { getBoxes } from '@services/mailbox/mailboxService';
import { getUserPermissions } from '@services/settings/settingsService';
import { buildParentFolderOptions, resolveAllSidebarItems, verifyBoxName } from '@utils/emailUtil';
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
    allowedFileTypes?: any[];
    sendToOutsideDomain: boolean;
    receiveFromOutsideDomain: boolean;
    both?: boolean;
    aiFeatures: boolean;
}

export interface SidebarStateProps {
    boxes: any[];
    customBoxes: any[];
    otherMenu: any[];
    boxCounts: Record<string, BoxCount>;
    parentFolderOptions: any[];
    delimiter: string | null;
}

export type SidebarApiResult = Pick<
    SidebarStateProps,
    'boxes' | 'customBoxes' | 'otherMenu' | 'boxCounts'
> & { delimiter?: string | null };

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
    headerSearchResults: Email[];
    setHeaderSearchResults: (results: Email[] | ((prev: Email[]) => Email[])) => void;

    /* Sidebar */
    sidebarState: SidebarStateProps;
    setSidebarState: (state: SidebarStateProps) => void;
    setSidebarStateFromAPI: () => Promise<SidebarApiResult>;
    sidebarItems: SidebarItemType[];
    setSidebarItems: (items: SidebarItemType[]) => void;
    socketId: string | null;
    isSidebarDataReady: boolean;
    setIsSidebarDataReady: (ready: boolean) => void;

    userPermissions: AdminSettingsPermissions | null;
    setUserPermissions: (permissions: AdminSettingsPermissions | null) => void;
    refreshUserPermissions: () => Promise<void>;
    permissionsLoaded: boolean;


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
    deleteEmailState: (messageIds: string[], skipSidebarUpdate?: boolean) => void;

    /* Events */
    updateBoxCount: (boxName: string, unreadDecrement: number, totalDecrement: number) => void;
    setAllSearchResult: (value: boolean) => void;
    clearMailSearch: (options?: { restoreMailbox?: boolean; preserveFilter?: boolean }) => Promise<void>;
    mailSearchResetKey: number;

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
    updateEmailAttachment: (messageId: string, attachment: any) => void;

}

const MailDataContext = createContext<MailDataType | undefined>(undefined);

export const useMailData = () => {
    const ctx = useContext(MailDataContext);
    if (!ctx) throw new Error('useMailData must be used inside MailDataProvider');
    return ctx;
};

const getInitialBoxName = (): string => {
    const pathParts = window.location.pathname.split('/');
    const mailIndex = pathParts.indexOf('mail');
    if (mailIndex !== -1 && mailIndex + 1 < pathParts.length) {
        const raw = pathParts.slice(mailIndex + 1).join('/');
        const decoded = decodeURIComponent(raw).trim();
        if (decoded) return decoded;
    }
    return 'INBOX';
};

const getNumericCount = (count: unknown): number | null => {
    const parsedCount = Number(count);
    return Number.isFinite(parsedCount) ? parsedCount : null;
};

export const MailDataProvider = ({ children }: { children: ReactNode }) => {
    const [boxName, setBoxName] = useState(getInitialBoxName());
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
    const [headerSearchResults, setHeaderSearchResults] = useState<Email[]>([]);
    const [mailSearchResetKey, setMailSearchResetKey] = useState(0);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<AdminSettingsPermissions | null>(null);
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [readUnreadFilter, setReadUnreadFilter] = useState<string>('all');
    const [isSidebarLoading, setIsSidebarLoading] = useState<boolean>(false);
    const [isSidebarCountLoading, setIsSidebarCountLoading] = useState<boolean>(false);
    const [isTotalCountLoading, setIsTotalCountLoading] = useState<boolean>(false);
    const [userId, setUserId] = useState<string>('guest');

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
    const mailListPageRef = useRef(mailListPage);
    mailListPageRef.current = mailListPage;
    const searchTermRef = useRef(searchTerm);
    searchTermRef.current = searchTerm;
    const filterFormRef = useRef(filterForm);
    filterFormRef.current = filterForm;

    const refreshUserPermissions = useCallback(async () => {
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
        } finally {
            setPermissionsLoaded(true);
        }
    }, []);

    useEffect(() => {
        refreshUserPermissions();
    }, [refreshUserPermissions]);

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
        async (page = mailListPage, boxNameParam?: string, isPrevious?: boolean, mailAction: string = 'all', _forceRefresh = false) => {
            let emailList, paginationData;
            if (boxNameParam === 'settings' || boxNameParam === 'calendar' || !boxNameParam) {
                return;
            }

            try {

                setEmailDetailSelected(null);
                setActiveEmailMessageId(null);
                if (mailAction === 'all') {
                    setReadUnreadFilter('all');
                }

                let isReadTotal: boolean | null = null;
                if (mailAction === 'unread') isReadTotal = false;
                else if (mailAction === 'read') isReadTotal = true;

                if (mailAction === 'all') {
                    const payload = {
                        current_active_box: boxName,
                        vPage: page,
                        lastMailId: page === 1 ? '' : isPrevious ? '' : paginationRef.current?.lastMailId ?? '',
                        firstMailId: page === 1 ? '' : isPrevious ? paginationRef.current?.firstMailId ?? '' : '',
                        totalCount: page === 1 ? null : (paginationRef.current?.totalEmails ?? 0),
                        mailAction,
                    };

                    if (page === 1) {
                        payload.lastMailId = '';
                        payload.firstMailId = '';
                    }


                    const response = await getEmailsService(payload);
                    if (response.statusCode !== 200) {
                        throw new Error(`Failed to fetch emails (status ${response.statusCode})`);
                    } else {
                        emailList = response.data.emailList ?? [];
                        paginationData = response.data.pagination;
                    }

                    if (boxNameParam && page === 1) {
                        setIsTotalCountLoading(true);

                        getCounts(boxNameParam, false, isReadTotal).then((boxCountResponse) => {
                            if (boxCountResponse.statusCode === 200 && boxCountResponse.data) {
                                const totalCount = getNumericCount(boxCountResponse.data.totalCount);

                                if (totalCount !== null) {
                                    setTotalEmailBadge(totalCount);
                                }

                                setPagination(prevPagination => prevPagination ? {
                                    ...prevPagination,
                                    totalEmails: totalCount ?? prevPagination.totalEmails,
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
                                    const totalCount = getNumericCount(boxCountResponse.data.totalCount);

                                    setPagination(prev => prev ? {
                                        ...prev,
                                        totalEmails: totalCount ?? prev.totalEmails
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
        // [mailListPage, readUnreadFilter, userId, boxName]
        [userId, boxName]
    );

    const fetchSearchEmails = useCallback(
        async (isPrevious = false) => {
            // Always read from refs — never from stale closure state
            const currentSearchTerm = searchTermRef.current;
            const currentFilterForm = filterFormRef.current;
            const currentPage = mailListPageRef.current;
            const currentPagination = paginationRef.current;

            if (!currentSearchTerm && !currentFilterForm) return;

            const direction = isPrevious ? 'prev' : 'next';
            const vPage = isPrevious ? Math.max(1, currentPage - 1) : currentPage + 1;

            // Use prevCursor/nextCursor (search-specific) not firstMailId/lastMailId (IMAP-specific)
            const cursor = isPrevious
                ? currentPagination?.prevCursor
                : currentPagination?.nextCursor;

            // Guard: never fire with a missing cursor unless it's page 1
            if (vPage > 1 && !cursor) {
                console.warn(`[fetchSearchEmails] No ${isPrevious ? 'prevCursor' : 'nextCursor'} available for page ${vPage} — aborting to prevent wrong results`);
                return;
            }

            try {
                const payload = buildSearchFilterPayload({
                    searchText: currentSearchTerm,
                    filterForm: currentFilterForm,
                    limit: 25,
                    cursor: cursor || undefined,
                    direction,
                    vPage,
                });

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
        [] // refs keep this always fresh — no stale closure possible
    );

    /* -------------------- Mail Mutations -------------------- */
    const updateEmailReadState = (messageIds: string[], isRead: boolean) => {
        let unreadCountChange = 0;

        if (isRead) {
            unreadCountChange = emails.filter(email =>
                messageIds.includes(email.messageId) && !email.isSeen
            ).length;
        } else {
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

        // if (!unreadCountChange || !boxName) return;
        // setSidebarState(prev => {
        //     const currentBox = prev.boxCounts[boxName];

        //     if (!currentBox) return prev;

        //     return {
        //         ...prev,
        //         boxCounts: {
        //             ...prev.boxCounts,
        //             [boxName]: {
        //                 ...currentBox,
        //                 unreadCount: isRead
        //                     ? Math.max(0, currentBox.unreadCount - unreadCountChange)
        //                     : currentBox.unreadCount + unreadCountChange
        //             }
        //         }
        //     };
        // });

        void unreadCountChange;
    };

    // const deleteEmailState = (messageIds: string[]) => {
    //     // Count how many unread emails are being deleted
    //     const unreadDeletedCount = emails
    //         .filter(email => messageIds.includes(email.messageId) && !email.isSeen)
    //         .length;

    //     setEmails(prev => prev.filter(email => !messageIds.includes(email.messageId)));
    //     setHeaderSearchResults(prev => prev.filter(email => !messageIds.includes(email.messageId)));
    //     const newPagination = pagination ? {
    //         ...pagination,
    //         endCount: pagination.endCount - messageIds.length,
    //         totalEmails: pagination.totalEmails - messageIds.length
    //     } : null;

    //     setPagination(newPagination);
    //     setTotalEmailBadge(prevBadge => Math.max(0, prevBadge - messageIds.length));

    //     // Update sidebar state with new unread counts if we have unread emails being deleted
    //     if (boxName && (unreadDeletedCount > 0 || messageIds.length > 0)) {
    //         // setSidebarState(prev => ({
    //         //     ...prev,
    //         //     boxCounts: {
    //         //         ...prev.boxCounts,
    //         //         [boxName]: {
    //         //             ...prev.boxCounts[boxName],
    //         //             unreadCount: Math.max(0, (prev.boxCounts[boxName]?.unreadCount || 0) - unreadDeletedCount),
    //         //             totalCount: Math.max(0, (prev.boxCounts[boxName]?.totalCount || 0) - messageIds.length)
    //         //         }
    //         //     }
    //         // }));
    //     }
    // };

    const deleteEmailState = (messageIds: string[], skipSidebarUpdate = false) => {
        const deletedEmails = emails.filter(email => messageIds.includes(email.messageId));
        const unreadDeletedCount = deletedEmails.filter(email => !email.isSeen).length;
        const removedCount = deletedEmails.length;

        setEmails(prev => prev.filter(email => !messageIds.includes(email.messageId)));
        setHeaderSearchResults(prev => prev.filter(email => !messageIds.includes(email.messageId)));

        if (removedCount === 0) return;

        const newPagination = pagination ? {
            ...pagination,
            endCount: pagination.endCount - removedCount,
            totalEmails: pagination.totalEmails - removedCount
        } : null;
        setPagination(newPagination);
        setTotalEmailBadge(prevBadge => Math.max(0, prevBadge - removedCount));

        // Only update sidebar when explicitly requested (e.g. draft delete where no socket event fires).
        // Spread existing box entry so isTotal stays intact for Junk/Draft/Trash.
        if (skipSidebarUpdate === false && boxName) {
            setSidebarState(prev => ({
                ...prev,
                boxCounts: {
                    ...prev.boxCounts,
                    [boxName]: {
                        ...prev.boxCounts[boxName],
                        unreadCount: Math.max(0, (prev.boxCounts[boxName]?.unreadCount || 0) - unreadDeletedCount),
                        totalCount: Math.max(0, (prev.boxCounts[boxName]?.totalCount || 0) - removedCount)
                    }
                }
            }));
        }
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
                setSidebarState(prevSidebar => {
                    const currentBox = prevSidebar.boxCounts[boxName] || { isTotal: false, unreadCount: 0, totalCount: 0 };
                    return {
                        ...prevSidebar,
                        boxCounts: {
                            ...prevSidebar.boxCounts,
                            [boxName]: {
                                ...currentBox,
                                unreadCount: (currentBox.unreadCount || 0) + addedUnreadCount,
                                totalCount: (currentBox.totalCount || 0) + addedEmailsCount
                            }
                        }
                    };
                });
            }

            return [...toAdd, ...prev];
        });
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
            // setTotalEmailBadge(prev => Math.max(0, prev - removedCount));

            // Update pagination
            setPagination(prev => prev ? {
                ...prev,
                totalEmails: Math.max(0, prev.totalEmails - removedCount),
                endCount: Math.max(0, prev.endCount - removedCount)
            } : prev);

            // Update sidebar state if boxName is available.
            // Preserve isTotal so folders like Junk/Draft/Trash keep showing totalCount
            // (forcing isTotal:false switches the badge to unreadCount and makes it disappear).
            if (boxName && removedCount > 0) {
                setSidebarState(prev => {
                    const currentBox = prev.boxCounts[boxName] || { isTotal: false, unreadCount: 0, totalCount: 0 };
                    return {
                        ...prev,
                        boxCounts: {
                            ...prev.boxCounts,
                            [boxName]: {
                                ...currentBox,
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
    const setSidebarStateFromAPI = async (): Promise<SidebarApiResult> => {
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

    const clearMailSearch = useCallback(async (options?: { restoreMailbox?: boolean; preserveFilter?: boolean }) => {
        const restoreMailbox = options?.restoreMailbox !== false;
        const preserveFilter = options?.preserveFilter === true;

        setSearchTerm('');
        setHeaderSearchResults([]);
        setMailSearchResetKey(key => key + 1);

        if (preserveFilter && filterForm) {
            setAllSearchResult(true);
            try {
                const response = await searchAndFilterEmailService(
                    buildSearchFilterPayload({
                        filterForm,
                        limit: 25,
                        direction: 'next',
                        vPage: 1,
                    })
                );

                if (response?.statusCode === 200) {
                    setEmails(response.data.emailList);
                    setPagination(response.data.pagination);
                    setTotalEmailBadge(response.data.pagination.totalEmails);
                    setBoxTitle('Search Results');
                }
            } catch (error) {
                console.error('Failed to refetch filtered emails:', error);
            }
            return;
        }

        const wasShowingSearchResults = restoreMailbox && (
            allSearchResult || boxTitle === 'Search Results'
        );

        setAllSearchResult(false);
        setFilterForm(null);

        if (
            wasShowingSearchResults &&
            boxName &&
            !verifyBoxName(boxName, 'calendar') &&
            !verifyBoxName(boxName, 'settings')
        ) {
            const activeItem = sidebarItems.find(item => item.boxName === boxName);
            setBoxTitle(activeItem?.label ?? boxName);
            setEmailDetailSelected(null);
            setActiveEmailMessageId(null);
            setMailListPage(1);
            setPagination(null);
            await fetchEmails(1, boxName, false, readUnreadFilter);
        }
    }, [allSearchResult, boxTitle, boxName, filterForm, sidebarItems, fetchEmails, readUnreadFilter]);

    const updateBoxCount = (
        boxName: string,
        unreadDecrement: number,
        totalDecrement: number
    ) => {
        setSidebarState(prev => {
            const current = prev.boxCounts[boxName] || { unreadCount: 0, totalCount: 0 };

            const newUnreadCount = Math.max(0, (current.unreadCount || 0) + unreadDecrement);
            const newTotalCount = Math.max(0, (current.totalCount || 0) + totalDecrement);

            return {
                ...prev,
                boxCounts: {
                    ...prev.boxCounts,
                    [boxName]: {
                        ...current,
                        unreadCount: newUnreadCount,
                        totalCount: newTotalCount,
                    }
                }
            };
        });
    };

    const updateEmailAttachment = useCallback((
        messageId: string,
        attachment: any,
    ) => {
        const patchEmail = (email: Email) => {
            if (email.messageId !== messageId) return email;

            let alreadyPatched = false;
            const incomingFileName = attachment.fileName ?? attachment.filename;

            let nextAttachments = email.attachments.map(att => {
                if (alreadyPatched) return att;

                const attFileName = att.fileName ?? att.filename;
                const isMatch =
                    !!attFileName &&
                    !!incomingFileName &&
                    attFileName === incomingFileName;

                if (isMatch) {
                    alreadyPatched = true;
                    return { ...att, ...attachment, _v: (att._v || 0) + 1 };
                }

                return att;
            });

            if (!alreadyPatched && incomingFileName) {
                nextAttachments = [...nextAttachments, attachment];
                alreadyPatched = true;
            }

            const remainingAttachments =
                alreadyPatched && attachment.customFileName
                    ? Math.max(0, (email.remainingAttachments ?? 0) - 1)
                    : email.remainingAttachments;

            return { ...email, attachments: nextAttachments, remainingAttachments };
        };

        setEmailDetailSelected(prev =>
            prev ? patchEmail(prev) : prev
        );

        setEmails(prev =>
            prev.map(e => patchEmail(e))
        );
    }, [setEmailDetailSelected, setEmails]);

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
        headerSearchResults,
        setHeaderSearchResults,
        socketId,
        userPermissions,
        setUserPermissions,
        permissionsLoaded,
        refreshUserPermissions,
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
        clearMailSearch,
        mailSearchResetKey,
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
        updateEmailAttachment
    };

    return (
        <MailDataContext.Provider value={value}>
            {children}
        </MailDataContext.Provider>
    );
};
