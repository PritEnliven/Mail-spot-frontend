import type { Email } from '@models/Email';
import type { ModalClosePayload } from '@models/ModalClosePayload';
import type { ModalType } from '@models/ModalType';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface ToolbarState {
    showBack: boolean;
    showSelectAll: boolean;
    showRefresh: boolean;
    showDelete: boolean;
    showMarkAsRead: boolean;
    showMarkAsUnread: boolean;
    showMove: boolean;
}


export interface ActiveModal {
    id: string;
    type: ModalType;
    props?: any;
    onSuccess?: () => void;
    onError?: () => void;
    onCancel?: () => void;
    onClose?: (payload: ModalClosePayload) => void;
}

interface MailUIType {
    toolbarState: ToolbarState;
    isLoading: boolean;
    activeModals: ActiveModal[];
    activeEmailMessageId: string | null;
    setIsLoading: (loading: boolean) => void;
    setToolbarState: (state: Partial<ToolbarState> | null) => void;
    openModal: (type: ModalType, props?: any) => string;
    closeModal: (id?: string) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    isMailListOpen: boolean;
    setIsMailListOpen: (open: boolean) => void;
    isComposeExpanded: boolean;
    setIsComposeExpanded: (open: boolean) => void;
    isSidebarExpandedMobile: boolean;
    setIsSidebarExpandedMobile: (open: boolean) => void;
    activeBoxId: string;
    setActiveBoxId: (boxId: string) => void;
}

interface MailUIProviderProps {
    children: ReactNode;
    emails: Email[];
    selectedEmails: Set<string>;
    activeEmailMessageId: string | null;
}

const MailUIContext = createContext<MailUIType | undefined>(undefined);

export const useMailUI = () => {
    const ctx = useContext(MailUIContext);
    if (!ctx) throw new Error('useMailUI must be used inside MailUIProvider');
    return ctx;
};

export const MailUIProvider = ({ children, emails, selectedEmails, activeEmailMessageId }: MailUIProviderProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeModals, setActiveModals] = useState<ActiveModal[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMailListOpen, setIsMailListOpen] = useState(true);
    const [customToolbarState, setCustomToolbarState] = useState<ToolbarState | null>(null);
    const [isComposeExpanded, setIsComposeExpanded] = useState(false);
    const [isSidebarExpandedMobile, setIsSidebarExpandedMobile] = useState(false);
    const [activeBoxId, setActiveBoxId] = useState<string>('box-li-0');

    // Add this effect to reset customToolbarState when selection changes
    useEffect(() => {
        setCustomToolbarState(null);
    }, [selectedEmails, activeEmailMessageId]);

    // Derived toolbar state - computes the default state based on selection
    const derivedToolbarState = useMemo(() => {
        // If no emails selected, show only refresh
        if (selectedEmails.size === 0 && !activeEmailMessageId) {
            return {
                showBack: !isMailListOpen,
                showSelectAll: true,
                showRefresh: true,
                showDelete: false,
                showMarkAsRead: false,
                showMarkAsUnread: false,
                showMove: false,
            };
        }

        // If single email is active (detail view)
        if (activeEmailMessageId && selectedEmails.size === 0) {
            const activeEmail = emails.find(email => email.messageId === activeEmailMessageId);
            if (activeEmail) {
                const isRead = activeEmail.isSeen;
                return {
                    showBack: !isMailListOpen,
                    showSelectAll: true,
                    showRefresh: false,
                    showDelete: true,
                    showMarkAsRead: !isRead,
                    showMarkAsUnread: isRead,
                    showMove: true,
                };
            }
        }

        // If emails are selected (bulk selection or single selection)
        if (selectedEmails.size > 0) {
            const selectedEmailsData = emails.filter(email => selectedEmails.has(email.messageId));
            const hasReadEmails = selectedEmailsData.some(email => email.isSeen);
            const hasUnreadEmails = selectedEmailsData.some(email => !email.isSeen);

            return {
                showBack: !isMailListOpen,
                showSelectAll: true,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: hasUnreadEmails,
                showMarkAsUnread: hasReadEmails && !hasUnreadEmails,
                // Show move whenever exactly one email is selected, regardless of activeEmailMessageId
                showMove: selectedEmails.size > 0,
            };
        }

        // Default state
        return {
            showBack: !isMailListOpen,
            showSelectAll: true,
            showRefresh: true,
            showDelete: false,
            showMarkAsRead: false,
            showMarkAsUnread: false,
            showMove: false,
        };
    }, [emails, selectedEmails, activeEmailMessageId, isMailListOpen]);

    const toolbarState = customToolbarState || derivedToolbarState;

    const setToolbarState = (state: Partial<ToolbarState> | null) => {
        if (state === null) {
            setCustomToolbarState(null);
        } else {
            setCustomToolbarState(prev => ({
                ...(prev || derivedToolbarState),
                ...state
            }));
        }
    };

    const openModal = (type: ModalType, props?: any) => {
        const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setActiveModals(prev => {
            const existingModalIndex = prev.findIndex(modal => modal.type === type);

            // if (existingModalIndex >= 0) {
            //     const updatedModals = [...prev];
            //     const existingModal = updatedModals[existingModalIndex];
            //     existingModal.props = props;
            //     updatedModals.splice(existingModalIndex, 1);
            //     return [...updatedModals, existingModal];
            // }

            if (existingModalIndex >= 0) {
                // Only update props of the existing modal in-place, don't reorder
                return prev.map((modal, index) =>
                    index === existingModalIndex
                        ? { ...modal, props }
                        : modal
                );
            }

            return [...prev, { id: modalId, type, props}];
        });
        return modalId;
    };

    const closeModal = (id?: string) => {
        setActiveModals(prev => {
            if (!id) {
                return prev.slice(0, -1);
            }
            return prev.filter(modal => modal.id !== id);
        });
    };


    const value = {
        toolbarState,
        isLoading,
        activeModals,
        activeEmailMessageId,
        setIsLoading,
        setToolbarState,
        openModal,
        closeModal,
        isSidebarOpen,
        setIsSidebarOpen,
        isMailListOpen,
        setIsMailListOpen,
        isComposeExpanded,
        setIsComposeExpanded,
        isSidebarExpandedMobile,
        setIsSidebarExpandedMobile,
        activeBoxId,
        setActiveBoxId
    };

    return (
        <MailUIContext.Provider value={value}>
            {children}
        </MailUIContext.Provider>
    );
};
