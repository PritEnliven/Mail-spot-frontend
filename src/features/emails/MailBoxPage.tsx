import NoEmailList from '@components/ui/email/NoEmailList';
import EmailSkeletonLoader from '@components/ui/EmailSkeletonLoader';
import { useScreen } from '@context/ScreenContext';
import { useEmailAction } from '@hooks/useEmailAction';
import { handleEmailDeletion, verifyBoxName } from '@utils/emailUtil';
import { Suspense, lazy, useCallback, useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import { useMailData, useMailSelection, useMailUI } from '../../context/index';
import EmailRow from '../../features/emails/EmailRow';
import { MAIL_ACTION } from '../../constants/mailAction';
import { getSingleEmailService } from '../../services/email/emailService';
import { useSettings } from '@context/SettingsContext';
import { useShortcutAction } from '@hooks/useShortcutAction';
import { useNavigate } from 'react-router-dom';

// Lazy loaded components
const EmailDetail = lazy(() => import('../../features/emails/EmailDetail'));

const MailBoxPage = () => {
    const emailScrollRef = useRef<HTMLDivElement | null>(null);
    // const { boxName } = useParams<{ boxName: string }>();
    const { boxName, sidebarState, sidebarItems, setBoxName, fetchEmails, emails, emailDetailSelected, setEmailDetailSelected, activeEmailMessageId, setActiveEmailMessageId, isSidebarDataReady, isSidebarLoading, readUnreadFilter, setReadUnreadFilter, boxTitle } = useMailData();
    const isSearchOrFilterMailList = boxTitle === 'Search Results' || boxTitle === 'Filtered Results';
    const { selectedEmails } = useMailSelection();
    const { setToolbarState, isLoading, setIsLoading, openModal, isMailListOpen, activeModals, closeModal, setIsMailListOpen } = useMailUI();
    const { settings } = useSettings();
    const { markAsRead, markAsUnread, deleteEmail } = useEmailAction();
    const { isDesktop } = useScreen();
    const currentActiveBox = boxName || '';
    const isDraftBox = boxName ? verifyBoxName(boxName, 'draft') : false;
    const simpleBarRef = useRef<any>(null);
    const navigate = useNavigate();

    useShortcutAction(
        'new_compose',
        () => openModal('compose'),
    );

    useShortcutAction(
        'go_to_inbox',
        () => navigate('/mail/INBOX'),
    );

    // Ref to track the current markAsRead timeout
    const markAsReadTimeoutRef = useRef<number | null>(null);
    const scrollMailListToTop = useCallback(() => {
        const scrollEl = simpleBarRef.current?.getScrollElement?.();
        if (scrollEl) {
            scrollEl.scrollTop = 0;
        }
    }, []);

    useEffect(() => {
        if (!boxName || !isSidebarDataReady) return;

        // here fetch boxName from url
        const decodedBoxName = decodeURIComponent(boxName);
        //find that boxName from sidebarItems
        const box = sidebarItems.find((item) => item.id === decodedBoxName);
        if (box) {
            setBoxName(box.id);
        }

        let isCancelled = false;
        let isLoading = false;

        const loadEmails = async () => {
            if (isLoading) return;

            setIsLoading(true);
            isLoading = true;

            const pathParts = location.pathname.split('/');
            let urlBoxName: string;

            if (sidebarState.delimiter === '/') {
                // For '/' delimiter, join all parts after '/mail/'
                const mailIndex = pathParts.indexOf('mail');
                if (mailIndex !== -1 && mailIndex + 1 < pathParts.length) {
                    urlBoxName = pathParts.slice(mailIndex + 1).join('/');
                } else {
                    urlBoxName = pathParts[pathParts.length - 1];
                }
            } else {
                // Default behavior - take the last part
                urlBoxName = pathParts[pathParts.length - 1];
            }

            // Decode URL-encoded characters (like %20 to space)
            urlBoxName = decodeURIComponent(urlBoxName);


            try {
                await fetchEmails(1, urlBoxName || boxName);
                setTimeout(scrollMailListToTop, 0);
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
                isLoading = false;
            }
        };

        setBoxName(boxName);
        loadEmails();

        if (isDraftBox && emailDetailSelected) {
            openModal('compose');
            setToolbarState({
                showBack: false,
                showSelectAll: true,
                showRefresh: true,
                showDelete: false,
                showMarkAsRead: false,
                showMarkAsUnread: false,
                showMove: false,
            });
        } else {
            setToolbarState({
                showBack: false,
                showSelectAll: true,
                showRefresh: true,
                showDelete: false,
                showMarkAsRead: false,
                showMarkAsUnread: false,
                showMove: false,
            });
        }

        return () => {
            isCancelled = true;
            isLoading = false; // Reset flag when component unmounts
            // Clear any pending markAsRead timeout
            if (markAsReadTimeoutRef.current) {
                clearTimeout(markAsReadTimeoutRef.current);
                markAsReadTimeoutRef.current = null;
            }
        };
    }, [boxName, isSidebarDataReady]);

    const markAsReadUnreadEmailHandler = (messageIds: string[], shouldMarkAsRead: boolean) => {
        if (shouldMarkAsRead) {
            markAsRead(messageIds);
        } else {
            markAsUnread(messageIds);
        }

        if (activeEmailMessageId) {
            setToolbarState({
                showBack: false,
                showSelectAll: true,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !shouldMarkAsRead,
                showMarkAsUnread: shouldMarkAsRead,
                showMove: true,
            });
        }
    }

    const setupDeleteConfirmation = (mesageIds: string[], isDraftEmail: boolean) => {
        // TODO: implement add forward email address modal logic
        openModal('confirmDelete', {
            onConfirm: () => deleteEmailHandler(mesageIds, isDraftEmail)
        })
    }

    const deleteEmailHandler = async (messageIds: string[], isDraftEmail: boolean) => {
        // Check if current box is draft and compose modal is open, then close it
        if (isDraftBox) {
            const composeModal = activeModals.find(modal => modal.type === 'compose');
            if (composeModal) {
                closeModal(composeModal.id);
            }
        }

        return handleEmailDeletion(messageIds, isDraftEmail, {
            deleteFn: deleteEmail,
            successMessage: 'Email deleted successfully',
            errorMessage: 'Failed to delete email'
        });
    }

    const openEmailDetailHandler = async (
        currentActiveBox: string,
        uid: number,
        messageId: string,
        isSearch: boolean
    ) => {
        try {

            const payload = {
                current_active_box: currentActiveBox,
                uid,
                messageId,
                isSearch
            };

            let data = await getSingleEmailService(payload);
            if (data.isScheduled) {
                data.emailList.isSchedule = true;
            }

            if (boxName && verifyBoxName(boxName, 'draft')) {
                data.emailList.isDraftMail = true;
                data.emailList.draftEmailId = data.emailList.id;
                data.emailList.draftMessageId = data.emailList.messageId;
                openModal('compose', {
                    emailData: data.emailList
                })
            }

            setEmailDetailSelected(data.emailList);
            setActiveEmailMessageId(messageId);

            // setSelectedEmails(new Set([messageId]));
            const isRead = data.emailList.isSeen;

            // On mobile, hide mail list and show email detail
            if (!isDesktop) {
                setIsMailListOpen(false);
            }

            setToolbarState({
                showBack: !isDesktop,
                showSelectAll: isDesktop,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !isRead,
                showMarkAsUnread: isRead,
                showMove: true,
            });

            if (boxName && verifyBoxName(boxName, 'schedule') && verifyBoxName(boxName, 'draft')) {
                return;
            }

            if (!isRead) {
                const delay = settings?.markAsReadDelay ?? 0;

                // Never
                if (delay === -1) {
                    return;
                }

                // Immediately
                if (delay === 0) {
                    markAsRead([messageId]);
                    return;
                }

                // Clear any existing timeout
                if (markAsReadTimeoutRef.current) {
                    clearTimeout(markAsReadTimeoutRef.current);
                }

                // Delayed mark as read
                markAsReadTimeoutRef.current = window.setTimeout(() => {
                    markAsRead([messageId]);
                    markAsReadTimeoutRef.current = null;
                }, delay * 1000);
            }

        } catch (error) {
            console.error('Failed to fetch email detail', error);
        }
    };

    const isSchedule = boxName?.toLocaleLowerCase().includes('schedule');
    const mailListStyleOpenViaSearch = !isMailListOpen ? { width: '0px', 'min-width': '0px', 'border-right': '0px', overflow: 'hidden', opacity: '0' } : {};
    const mailDetailStyleOpenViaSearch = !isMailListOpen ? { width: '100%' } : {};

    const noConversationSelected = (
        <div className="no-new-mail">
            <div className="d-block text-center">
                <h2 className="new-h2 mb-2">No Conversation Selected</h2>
            </div>
        </div>
    );

    useEffect(() => {
        if (emailDetailSelected && emailScrollRef.current) {
            emailScrollRef.current.scrollTop = 0;

            setTimeout(() => {
                if (emailScrollRef.current) {
                    emailScrollRef.current.scrollTop = 0;
                }
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }, 100);
        }
    }, [emailDetailSelected]);

    const handleMailListFilter = async (action: string) => {
        if (readUnreadFilter === action) return;

        setReadUnreadFilter(action);
        setIsLoading(true);

        try {
            await fetchEmails(1, boxName, false, action);
            setTimeout(scrollMailListToTop, 0);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* START:: Mail received box */}
            <div className={`mail-message-box ${isSchedule ? 'schedule-message-box' : ''}`} id="mailMessageBoxSection" style={mailListStyleOpenViaSearch}>
                {!isSearchOrFilterMailList && (
                    <div className="mail-list-filter">
                        <button
                            type="button"
                            className={`mail-list-filter__segment ${readUnreadFilter === MAIL_ACTION.ALL ? 'mail-list-filter__segment--active' : ''}`}
                            onClick={() => handleMailListFilter(MAIL_ACTION.ALL)}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            className={`mail-list-filter__segment ${readUnreadFilter === MAIL_ACTION.UNREAD ? 'mail-list-filter__segment--active' : ''}`}
                            onClick={() => handleMailListFilter(MAIL_ACTION.UNREAD)}
                        >
                            Unread
                        </button>
                    </div>
                )}
                <div className="mail-received-table-news">
                    {emails.length === 0 && !isLoading && !isSidebarLoading ? (
                        <NoEmailList />
                    ) : (
                        <SimpleBar
                            ref={simpleBarRef}
                            style={{ paddingLeft: '1px', marginLeft: '-1px' }}
                            autoHide={false}
                            forceVisible="y"
                            className="mailReceivedTableNewsSimpleBar"
                        >
                            <table className="table" id="email-list-table">
                                <tbody id="email-list">
                                    {isLoading || isSidebarLoading ? (
                                        <EmailSkeletonLoader count={10} />
                                    ) :
                                        emails.length > 0 ? (
                                            emails.map((email: any, index: number) => {
                                                const isRead = email.isSeen;
                                                const isSelected = selectedEmails.has(email.messageId);
                                                return (
                                                    <EmailRow
                                                        key={email._id ?? email.messageId}
                                                        email={email}
                                                        isRead={isRead}
                                                        isSelected={isSelected}
                                                        isSearch={false}
                                                        index={index}
                                                        emails={emails as any}
                                                        onOpenEmail={(uid: number, messageId: string, isSearch: boolean) => openEmailDetailHandler(currentActiveBox, uid, messageId, isSearch)}
                                                        onMarkReadUnread={markAsReadUnreadEmailHandler}
                                                        onDelete={setupDeleteConfirmation} isActive={email.messageId === activeEmailMessageId} boxName={''} onToggleSelection={() => undefined} />
                                                );
                                            })
                                        ) : (
                                            <NoEmailList />
                                        )}
                                </tbody>
                            </table>
                        </SimpleBar>
                    )}
                </div>
            </div>
            {/* END:: Mail received box */}

            {/* START:: Application Form */}
            {(isDesktop || (!!activeEmailMessageId && !!emailDetailSelected)) && (
                <div id="emailDetailSection" className="mail-details-box" style={mailDetailStyleOpenViaSearch} ref={emailScrollRef}>
                    {!isDraftBox && activeEmailMessageId && emailDetailSelected ? (
                        <Suspense fallback={null}>
                            <EmailDetail email={emailDetailSelected} />
                        </Suspense>
                    ) : (
                        noConversationSelected
                    )}
                </div>
            )}
        </>
    )
}

export default MailBoxPage;
