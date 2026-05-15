import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { getEmailsService, searchAndFilterEmailService } from '@services/email/emailService';
import type { Email } from '@models/Email';
import type { Pagination } from '@models/Pagination';
import type { FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';
import { buildParentFolderOptions, resolveAllSidebarItems } from '@utils/emailUtil';
import { getBoxes } from '@services/mailbox/mailboxService';
import { getUserPermissions } from '@services/settings/settingsService';

export interface BoxCount {
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
    fetchEmails: (page?: number, boxName?: string, isPrevious?: boolean) => Promise<void>;
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
}

const MailDataContext = createContext<MailDataType | undefined>(undefined);

export const useMailData = () => {
    const ctx = useContext(MailDataContext);
    if (!ctx) throw new Error('useMailData must be used inside MailDataProvider');
    return ctx;
};

export const MailDataProvider = ({ children }: { children: ReactNode }) => {
    const [boxName, setBoxName] = useState('');
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

    const [sidebarState, setSidebarState] = useState<SidebarStateProps>({
        boxes: [],
        customBoxes: [],
        otherMenu: [],
        boxCounts: {},
        parentFolderOptions: [],
    });

    const [sidebarItems, setSidebarItems] = useState<SidebarItemType[]>([]);

    paginationRef.current = pagination;

    useEffect(() => {
        const loadUserPermissions = async () => {
            try {
                const response = await getUserPermissions();
                if (response?.statusCode === 200) {
                    setUserPermissions(response.data ?? null);
                }
            } catch {
                setUserPermissions(null);
            }
        };

        loadUserPermissions();
    }, []);

    /* -------------------- API Functions -------------------- */
    const fetchEmails = useCallback(
        async (page = mailListPage, boxName?: string, isPrevious?: boolean) => {
            if (!boxName) return;

            try {
                console.log('fetchEmails called with page:', page, 'paginationRef.current:', paginationRef.current);
                let payload = {
                    current_active_box: boxName,
                    vPage: page,
                    lastMailId: isPrevious ? '' : paginationRef.current?.lastMailId ?? '',
                    firstMailId: isPrevious ? paginationRef.current?.firstMailId ?? '' : '',
                    totalCount: page === 1 ? null : (paginationRef.current?.totalEmails ?? 0),
                };
                console.log('Payload totalCount:', payload.totalCount);

                if (page === 1) {
                    payload.lastMailId = "";
                    payload.firstMailId = "";
                }

                const response = await getEmailsService(payload);
                if (response.statusCode === 200) {
                    setEmails(response.data.emailList || []);
                    setPagination(response.data.pagination);
                    setMailListPage(page);
                    setTotalEmailBadge(response.data.pagination.totalEmails);
                }
            } catch (error) {
                console.error('Failed to fetch emails:', error);
            }
        },
        [mailListPage]
    );

    const fetchSearchEmails = useCallback(
        async (isPrevious = false) => {
            if (!searchTerm && !filterForm) return;

            try {
                const cursor = isPrevious
                    ? pagination?.firstMailId
                    : pagination?.lastMailId;

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
                messageIds.includes(email.messageId) && !email.flags?.includes('\\Seen')
            ).length;
        } else {
            // Marking as unread: increment unread count for emails that were read
            unreadCountChange = emails.filter(email =>
                messageIds.includes(email.messageId) && email.flags?.includes('\\Seen')
            ).length;
        }

        setEmails(prev =>
            prev.map(email =>
                messageIds.includes(email.messageId)
                    ? { ...email, flags: isRead ? [...email.flags, '\\Seen'] : email.flags.filter(flag => flag !== '\\Seen') }
                    : email
            )
        );

        void unreadCountChange;
    };

    const deleteEmailState = (messageIds: string[]) => {
        // Count how many unread emails are being deleted
        const unreadDeletedCount = emails
            .filter(email => messageIds.includes(email.messageId) && !email.flags?.includes('\\Seen'))
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

            const addedUnreadCount = toAdd.filter(email => !email.flags?.includes('\\Seen')).length;

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
                            unreadCount: (prevSidebar.boxCounts[boxName]?.unreadCount || 0) + addedUnreadCount,
                            totalCount: (prevSidebar.boxCounts[boxName]?.totalCount || 0) + addedEmailsCount
                        }
                    }
                }));
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
                email => !email.flags?.includes('\\Seen')
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
        const response = await getBoxes()
        const boxCounts: Record<string, BoxCount> = {};

        [...response.boxes, ...response.customBoxes, ...response.otherMenu].forEach(
            box => {
                if (box.value) {
                    boxCounts[box.value] = {
                        unreadCount: box.count ?? 0,
                        totalCount: box.totalCount ?? box.count ?? 0,
                    };
                }
            }
        );

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
        });
        return response;
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
                        unreadCount: newUnreadCount,
                        totalCount: newTotalCount,
                    }
                }
            };
        });
    };

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
        deleteEmail
    };

    return (
        <MailDataContext.Provider value={value}>
            {children}
        </MailDataContext.Provider>
    );
};
