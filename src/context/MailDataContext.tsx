import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { buildSearchFilterPayload } from '@utils/filterUtil';
import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import {
    DEFAULT_SORT_ORDER,
    isArrangeBy,
    isSortOrder,
    type ArrangeBy,
    type SortOrder,
} from '@constants/arrangeBy';
import { getCounts, getEmailsService, searchAndFilterEmailService } from '@services/email/emailService';
import { getBoxes, refreshFolders } from '@services/mailbox/mailboxService';
import { getUserPermissions } from '@services/settings/settingsService';
import { appendArrangedPage, mergeIntoArrangedList } from '@utils/arrangeEmailUtil';
import { buildParentFolderOptions, ensureContactInOtherMenu, resolveAllSidebarItems, verifyBoxName } from '@utils/emailUtil';
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
    localFolders: any[];
    otherMenu: any[];
    boxCounts: Record<string, BoxCount>;
    parentFolderOptions: any[];
    delimiter: string | null;
    folderMapping?: Record<string, string> | null;
}

export type SidebarApiResult = Pick<
    SidebarStateProps,
    'boxes' | 'customBoxes' | 'localFolders' | 'otherMenu' | 'boxCounts'
> & { delimiter?: string | null; folderMapping?: Record<string, string> | null; refreshed?: boolean };

type SidebarItemType = {
    color: any;
    id: string;
    boxName: string | any;
    label: string;
    icon: string;
    activeIcon: string;
    boxKey: string;
    unreadCount?: number;
    folderId?: string;
    category: 'boxes' | 'customBoxes' | 'otherMenu' | 'localFolders';
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
    setSidebarStateFromAPI: (boxNameOverride?: string) => Promise<SidebarApiResult>;
    refreshSidebarFolders: () => Promise<SidebarApiResult>;
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
    /** Append next page while Arrange by is active (infinite scroll). */
    loadMoreEmails: () => Promise<void>;
    isLoadingMoreEmails: boolean;
    /** Wipe mailbox UI state and reload INBOX/sidebar for a newly switched account */
    reloadForAccountSwitch: () => Promise<void>;

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

    /* Arrange by / Sort (Outlook-style flat listing when set) */
    arrangeBy: ArrangeBy | null;
    sortOrder: SortOrder | null;
    setArrangeBy: (arrangeBy: ArrangeBy | null) => void;
    setSortOrder: (sortOrder: SortOrder | null) => void;
    setArrangeSort: (arrangeBy: ArrangeBy | null, sortOrder?: SortOrder | null) => void;

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

export const MailDataProvider = ({ children }: { children: ReactNode }) => {
    const [boxName, setBoxName] = useState(getInitialBoxName());
    const [boxTitle, setBoxTitle] = useState('');
    const [totalEmailBadge, setTotalEmailBadge] = useState(0);
    const [emails, setEmails] = useState<Email[]>([]);
    const emailsRef = useRef<Email[]>([]);
    const boxNameRef = useRef(boxName);
    const fetchEmailsRequestIdRef = useRef(0);
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
    const [arrangeBy, setArrangeByState] = useState<ArrangeBy | null>(null);
    const [sortOrder, setSortOrderState] = useState<SortOrder | null>(null);
    const [isSidebarLoading, setIsSidebarLoading] = useState<boolean>(false);
    const [isSidebarCountLoading, setIsSidebarCountLoading] = useState<boolean>(false);
    const [isTotalCountLoading, setIsTotalCountLoading] = useState<boolean>(false);
    const [isLoadingMoreEmails, setIsLoadingMoreEmails] = useState(false);
    const isLoadingMoreEmailsRef = useRef(false);
    const [userId, setUserId] = useState<string>('guest');

    const [sidebarState, setSidebarState] = useState<SidebarStateProps>({
        boxes: [],
        customBoxes: [],
        localFolders: [],
        otherMenu: [],
        boxCounts: {},
        parentFolderOptions: [],
        delimiter: null,
        folderMapping: null,
    });

    const [sidebarItems, setSidebarItems] = useState<SidebarItemType[]>([]);
    const [isSidebarDataReady, setIsSidebarDataReady] = useState(false);

    emailsRef.current = emails;
    boxNameRef.current = boxName;
    paginationRef.current = pagination;
    const mailListPageRef = useRef(mailListPage);
    mailListPageRef.current = mailListPage;
    const searchTermRef = useRef(searchTerm);
    searchTermRef.current = searchTerm;
    const filterFormRef = useRef(filterForm);
    filterFormRef.current = filterForm;
    const arrangeByRef = useRef<ArrangeBy | null>(arrangeBy);
    arrangeByRef.current = arrangeBy;
    const sortOrderRef = useRef<SortOrder | null>(sortOrder);
    sortOrderRef.current = sortOrder;

    const setArrangeBy = useCallback((next: ArrangeBy | null) => {
        setArrangeByState(next);
        arrangeByRef.current = next;
    }, []);

    const setSortOrder = useCallback((next: SortOrder | null) => {
        setSortOrderState(next);
        sortOrderRef.current = next;
    }, []);

    const setArrangeSort = useCallback((nextArrange: ArrangeBy | null, nextSort?: SortOrder | null) => {
        const resolvedSort =
            nextArrange == null
                ? null
                : (nextSort ?? DEFAULT_SORT_ORDER[nextArrange]);
        setArrangeByState(nextArrange);
        setSortOrderState(resolvedSort);
        arrangeByRef.current = nextArrange;
        sortOrderRef.current = resolvedSort;
    }, []);

    const syncArrangeFromResponse = useCallback((data: { arrangeBy?: unknown; sortOrder?: unknown } | undefined) => {
        if (!data) return;
        if (isArrangeBy(data.arrangeBy)) {
            setArrangeByState(data.arrangeBy);
            arrangeByRef.current = data.arrangeBy;
            const echoedSort = isSortOrder(data.sortOrder)
                ? data.sortOrder
                : DEFAULT_SORT_ORDER[data.arrangeBy];
            setSortOrderState(echoedSort);
            sortOrderRef.current = echoedSort;
        }
    }, []);

    const buildGetEmailsPayload = useCallback((
        activeBox: string,
        page: number,
        isPrevious: boolean | undefined,
        mailAction: string,
    ) => {
        const payload: {
            current_active_box: string;
            vPage: number;
            lastMailId: string;
            firstMailId: string;
            totalCount: number | null;
            mailAction: string;
            arrangeBy?: ArrangeBy;
            sortOrder?: SortOrder;
        } = {
            current_active_box: activeBox,
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

        const currentArrange = arrangeByRef.current;
        if (currentArrange) {
            payload.arrangeBy = currentArrange;
            payload.sortOrder = sortOrderRef.current ?? DEFAULT_SORT_ORDER[currentArrange];
        }

        return payload;
    }, []);

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
            if (boxNameParam === 'settings' || boxNameParam === 'calendar' || boxNameParam === 'contact' || !boxNameParam) {
                return;
            }

            const requestId = ++fetchEmailsRequestIdRef.current;
            const requestedBox = boxNameParam;

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
                    const activeBox = boxNameParam || boxName;
                    const payload = buildGetEmailsPayload(activeBox, page, isPrevious, mailAction);

                    const response = await getEmailsService(payload);
                    if (requestId !== fetchEmailsRequestIdRef.current) return;
                    if (boxNameRef.current !== requestedBox) return;
                    if (response.statusCode !== 200) {
                        throw new Error(`Failed to fetch emails (status ${response.statusCode})`);
                    } else {
                        emailList = response.data.emailList ?? [];
                        paginationData = response.data.pagination;
                        syncArrangeFromResponse(response.data);
                    }

                    // Header badge must match pagination "of N" (same get-emails total).
                    // getCounts below only refreshes sidebar folder badges.
                    if (paginationData?.totalEmails != null) {
                        setTotalEmailBadge(Number(paginationData.totalEmails) || 0);
                    }

                    if (boxNameParam && page === 1) {
                        // Local folders are DB-only — do not run IMAP getCounts bootstrap
                        if (!String(boxNameParam).toLowerCase().startsWith('local::')) {
                        setIsTotalCountLoading(true);

                        getCounts(boxNameParam, false, isReadTotal).then((boxCountResponse) => {
                            if (boxCountResponse.statusCode === 200 && boxCountResponse.data) {
                                // Sidebar counts stay on the folder badges. The header badge
                                // and range label both use totalEmails from get-emails.

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
                    }
                    setEmails(emailList);
                    setPagination(paginationData);
                    setMailListPage(page);

                } else {
                    const payload = buildGetEmailsPayload(boxNameParam!, page, isPrevious, mailAction);

                    const response = await getEmailsService(payload);
                    if (requestId !== fetchEmailsRequestIdRef.current) return;
                    if (boxNameRef.current !== requestedBox) return;
                    if (response.statusCode === 200) {
                        const emailList = response.data.emailList || [];
                        const paginationData = response.data.pagination;
                        syncArrangeFromResponse(response.data);

                        setEmails(emailList);
                        setPagination(paginationData);
                        setMailListPage(page);

                        // Header badge must match pagination "of N" (same get-emails total).
                        if (paginationData?.totalEmails != null) {
                            setTotalEmailBadge(Number(paginationData.totalEmails) || 0);
                        }

                        // Page 1: refresh sidebar folder badges only (do not overwrite header badge).
                        if (page === 1 && boxNameParam) {
                            if (!String(boxNameParam).toLowerCase().startsWith('local::')) {
                            setIsTotalCountLoading(true);

                            // Determine isReadTotal based on mailAction
                            let isReadTotal: boolean | null = null;
                            if (mailAction === 'unread') isReadTotal = false;
                            else if (mailAction === 'read') isReadTotal = true;

                            getCounts(boxNameParam, false, isReadTotal).then((boxCountResponse) => {
                                if (boxCountResponse.statusCode === 200 && boxCountResponse.data) {
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
                        }

                        // Update sidebar box unread count when mailAction is unread
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
        [userId, boxName, buildGetEmailsPayload, syncArrangeFromResponse]
    );

    const loadMoreEmails = useCallback(async () => {
        if (!arrangeByRef.current) return;
        if (isLoadingMoreEmailsRef.current) return;

        const currentPagination = paginationRef.current;
        if (!currentPagination?.hasNextPage) return;

        const activeBox = boxName;
        if (!activeBox || activeBox === 'settings' || activeBox === 'calendar' || activeBox === 'contact') {
            return;
        }

        const nextPage = mailListPageRef.current + 1;
        if (currentPagination.totalPages > 0 && nextPage > currentPagination.totalPages) return;

        isLoadingMoreEmailsRef.current = true;
        setIsLoadingMoreEmails(true);

        try {
            const payload = buildGetEmailsPayload(
                activeBox,
                nextPage,
                false,
                readUnreadFilter || 'all',
            );
            const response = await getEmailsService(payload);
            if (response.statusCode !== 200) {
                throw new Error(`Failed to load more emails (status ${response.statusCode})`);
            }

            const nextList = response.data.emailList ?? [];
            const paginationData = response.data.pagination as Pagination | undefined;
            syncArrangeFromResponse(response.data);

            const merged = appendArrangedPage(emailsRef.current, nextList);
            emailsRef.current = merged;
            setEmails(merged);

            if (paginationData) {
                if (paginationData.totalEmails != null) {
                    setTotalEmailBadge(Number(paginationData.totalEmails) || 0);
                }
                setPagination({
                    ...paginationData,
                    startCount: 1,
                    endCount: merged.length > 0
                        ? merged.length
                        : (paginationData.endCount ?? 0),
                });
            }
            setMailListPage(nextPage);
        } catch (error) {
            console.error('Failed to load more emails:', error);
        } finally {
            isLoadingMoreEmailsRef.current = false;
            setIsLoadingMoreEmails(false);
        }
    }, [boxName, buildGetEmailsPayload, readUnreadFilter, syncArrangeFromResponse]);

    const receiveOutsideRef = useRef<boolean | undefined>(undefined);
    useEffect(() => {
        if (!permissionsLoaded || !userPermissions) return;

        const next = Boolean(userPermissions.receiveFromOutsideDomain);
        const previous = receiveOutsideRef.current;
        receiveOutsideRef.current = next;
        if (previous === undefined || previous === next) return;

        // Outside-domain receive changed the mailbox total. Drop whatever page
        // is open and load page 1 from get-emails instead of refreshing it in place.
        setEmails([]);
        setPagination(null);
        setMailListPage(1);
        void fetchEmails(1, boxName, false, readUnreadFilter);
    }, [permissionsLoaded, userPermissions, boxName, readUnreadFilter, fetchEmails]);

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
        setHeaderSearchResults(prev => prev.filter(email => !messageIds.includes(email.messageId)));

        // Derive removals from current list state (same pattern as socket deleteEmail).
        // If the socket already removed these rows, removedCount is 0 → no double-decrement.
        setEmails(prev => {
            const deletedEmails = prev.filter(email => messageIds.includes(email.messageId));
            const removedCount = deletedEmails.length;
            if (removedCount === 0) return prev;

            const unreadDeletedCount = deletedEmails.filter(email => !email.isSeen).length;

            setPagination(prevPagination => prevPagination ? {
                ...prevPagination,
                endCount: Math.max(0, prevPagination.endCount - removedCount),
                totalEmails: Math.max(0, prevPagination.totalEmails - removedCount)
            } : prevPagination);
            
            setTotalEmailBadge(prevBadge => Math.max(0, prevBadge - removedCount));

            // Only update sidebar when explicitly requested (e.g. draft/junk where socket can't help).
            // Spread existing box entry so isTotal stays intact for Junk/Draft/Trash.
            if (skipSidebarUpdate === false && boxName) {
                setSidebarState(prevSidebar => ({
                    ...prevSidebar,
                    boxCounts: {
                        ...prevSidebar.boxCounts,
                        [boxName]: {
                            ...prevSidebar.boxCounts[boxName],
                            unreadCount: Math.max(0, (prevSidebar.boxCounts[boxName]?.unreadCount || 0) - unreadDeletedCount),
                            totalCount: Math.max(0, (prevSidebar.boxCounts[boxName]?.totalCount || 0) - removedCount)
                        }
                    }
                }));
            }

            return prev.filter(email => !messageIds.includes(email.messageId));
        });
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

            const currentArrange = arrangeByRef.current;
            if (currentArrange) {
                return mergeIntoArrangedList(
                    prev,
                    toAdd as Email[],
                    currentArrange,
                    sortOrderRef.current ?? DEFAULT_SORT_ORDER[currentArrange],
                );
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

            // Keep badge in sync when socket wins the race against local deleteEmailState.
            setTotalEmailBadge(prev => Math.max(0, prev - removedCount));

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
    const setSidebarStateFromAPI = async (boxNameOverride?: string): Promise<SidebarApiResult> => {
        setIsSidebarLoading(true);
        try {
            const response = await getBoxes()
            response.otherMenu = ensureContactInOtherMenu(response.otherMenu ?? []);
            const localFolders = response.localFolders ?? [];
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

            localFolders.forEach((folder: any) => {
                const key = folder.value || folder.key;
                if (!key) return;
                boxCounts[key] = {
                    isTotal: false,
                    unreadCount: folder.unreadCount ?? folder.count ?? 0,
                    totalCount: folder.count ?? folder.unreadCount ?? 0,
                };
            });

            // Fire getCounts without blocking - update counts when response arrives
            // Skip for local folders (DB-only; no IMAP count sync)
            const countBox = boxNameOverride || boxName;
            if (countBox && !String(countBox).toLowerCase().startsWith('local::')) {
                setIsSidebarCountLoading(true);
                getCounts(countBox, true, null).then((boxCountResponse) => {
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
            response.localFolders = localFolders;

            const sidebarItems = resolveAllSidebarItems(
                response.boxes,
                response.customBoxes,
                response.otherMenu,
                boxCounts,
                localFolders
            );

            setSidebarItems(sidebarItems);

            setSidebarState({
                boxes: response.boxes,
                customBoxes: response.customBoxes,
                localFolders,
                otherMenu: response.otherMenu,
                boxCounts,
                parentFolderOptions: buildParentFolderOptions(
                    response.boxes,
                    response.customBoxes
                ),
                delimiter: response.delimiter,
                folderMapping: response.folderMapping ?? null,
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

    const applySidebarFoldersResponse = useCallback((
        response: any,
        previous: Pick<SidebarStateProps, 'otherMenu' | 'boxCounts'>
    ): SidebarApiResult => {
        const otherMenu = ensureContactInOtherMenu(response.otherMenu ?? previous.otherMenu ?? []);
        const boxes = response.boxes ?? [];
        const customBoxes = response.customBoxes ?? [];
        const localFolders = response.localFolders ?? [];
        const boxCounts: Record<string, BoxCount> = { ...previous.boxCounts };

        [...boxes, ...customBoxes].forEach((box) => {
            if (box.value) {
                const existing = boxCounts[box.value];
                boxCounts[box.value] = {
                    isTotal: box.isTotal ?? existing?.isTotal ?? false,
                    unreadCount: box.count ?? existing?.unreadCount ?? 0,
                    totalCount: box.totalCount ?? box.count ?? existing?.totalCount ?? 0,
                };
            }
        });

        localFolders.forEach((folder: any) => {
            const key = folder.value || folder.key;
            if (!key) return;
            const existing = boxCounts[key];
            boxCounts[key] = {
                isTotal: false,
                unreadCount: folder.unreadCount ?? folder.count ?? existing?.unreadCount ?? 0,
                totalCount: folder.count ?? existing?.totalCount ?? 0,
            };
        });

        otherMenu.forEach((box) => {
            if (box.value && !boxCounts[box.value]) {
                boxCounts[box.value] = {
                    isTotal: box.isTotal,
                    unreadCount: box.count ?? 0,
                    totalCount: box.totalCount ?? box.count ?? 0,
                };
            }
        });

        setSidebarItems(resolveAllSidebarItems(boxes, customBoxes, otherMenu, boxCounts, localFolders));

        setSidebarState({
            boxes,
            customBoxes,
            localFolders,
            otherMenu,
            boxCounts,
            parentFolderOptions: buildParentFolderOptions(boxes, customBoxes),
            delimiter: response.delimiter ?? null,
            folderMapping: response.folderMapping ?? null,
        });

        setIsSidebarDataReady(true);

        return {
            boxes,
            customBoxes,
            localFolders,
            otherMenu,
            boxCounts,
            delimiter: response.delimiter ?? null,
            folderMapping: response.folderMapping ?? null,
            refreshed: response.refreshed,
        };
    }, []);

    const refreshSidebarFolders = useCallback(async (): Promise<SidebarApiResult> => {
        const response = await refreshFolders();
        if (response?.statusCode !== 200) {
            const message =
                response?.message ||
                response?.error ||
                'Failed to refresh folders';
            throw new Error(typeof message === 'string' ? message : 'Failed to refresh folders');
        }

        const folderData = response.data ?? response;
        return applySidebarFoldersResponse(folderData, {
            otherMenu: sidebarState.otherMenu,
            boxCounts: sidebarState.boxCounts,
        });
    }, [applySidebarFoldersResponse, sidebarState.otherMenu, sidebarState.boxCounts]);

    /** Clear all mailbox UI for previous account, then load INBOX for the new active account */
    const reloadForAccountSwitch = useCallback(async () => {
        // Never keep previous account emails visible while loading the new one
        setEmails([]);
        setPagination(null);
        setEmailDetailSelected(null);
        setActiveEmailMessageId(null);
        setSearchTerm('');
        setFilterForm(null);
        setHeaderSearchResults([]);
        setAllSearchResult(false);
        setMailListPage(1);
        setReadUnreadFilter('all');
        setArrangeByState(null);
        setSortOrderState(null);
        arrangeByRef.current = null;
        sortOrderRef.current = null;
        setTotalEmailBadge(0);
        setMailSearchResetKey((key) => key + 1);
        setIsSidebarDataReady(false);
        setSidebarItems([]);
        setSidebarState({
            boxes: [],
            customBoxes: [],
            localFolders: [],
            otherMenu: [],
            boxCounts: {},
            parentFolderOptions: [],
            delimiter: null,
            folderMapping: null,
        });

        setBoxName('INBOX');
        setBoxTitle('Inbox');

        await setSidebarStateFromAPI('INBOX');
        await fetchEmails(1, 'INBOX', false, 'all', true);
    }, [fetchEmails]);

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
            !verifyBoxName(boxName, 'settings') &&
            !verifyBoxName(boxName, 'contact')
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
        loadMoreEmails,
        isLoadingMoreEmails,
        reloadForAccountSwitch,
        updateEmailReadState,
        deleteEmailState,
        updateBoxCount,
        setAllSearchResult,
        clearMailSearch,
        mailSearchResetKey,
        setSidebarStateFromAPI,
        refreshSidebarFolders,
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
        arrangeBy,
        sortOrder,
        setArrangeBy,
        setSortOrder,
        setArrangeSort,
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
