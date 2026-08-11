import NoEmailList from '@components/ui/email/NoEmailList';
import EmailSkeletonLoader from '@components/ui/EmailSkeletonLoader';
import { useScreen } from '@context/ScreenContext';
import { useEmailAction } from '@hooks/useEmailAction';
import { useSwipeGesture, type SwipeDirection } from '@hooks/useSwipeGesture';
import { handleEmailDeletion, verifyBoxName } from '@utils/emailUtil';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import SimpleBar from 'simplebar-react';
import { useMailData, useMailSelection, useMailUI } from '../../context/index';
import EmailRow from '../../features/emails/EmailRow';
import { MAIL_ACTION } from '../../constants/mailAction';
import { getSingleEmailService } from '../../services/email/emailService';
import { useSettings } from '@context/SettingsContext';
import { useShortcutAction } from '@hooks/useShortcutAction';
import EmailDetailSkeletonLoader from '@components/ui/EmailDetailSkeletonLoader';
import { useNavigate } from 'react-router-dom';

// Lazy loaded components
const EmailDetail = lazy(() => import('../../features/emails/EmailDetail'));

const MailBoxPage = () => {
    const emailScrollRef = useRef<HTMLDivElement | null>(null);
    // const { boxName } = useParams<{ boxName: string }>();
    const { boxName, sidebarState, sidebarItems, setBoxName, fetchEmails, emails, emailDetailSelected, setEmailDetailSelected, activeEmailMessageId, setActiveEmailMessageId, isSidebarDataReady, isSidebarLoading, readUnreadFilter, setReadUnreadFilter, boxTitle } = useMailData();
    const isSearchOrFilterMailList = boxTitle === 'Search Results';
    const { selectedEmails } = useMailSelection();
    const { setToolbarState, isLoading, setIsLoading, openModal, isMailListOpen, activeModals, closeModal, setIsMailListOpen } = useMailUI();
    const { settings } = useSettings();
    const { markAsRead, markAsUnread, deleteEmail } = useEmailAction();
    const { isDesktop } = useScreen();
    const currentActiveBox = boxName || '';
    const isDraftBox = boxName ? verifyBoxName(boxName, 'draft') : false;
    const simpleBarRef = useRef<any>(null);
    const [isEmailDetailLoading, setIsEmailDetailLoading] = useState(false);
    const navigate = useNavigate();

    useShortcutAction('new_compose', () => openModal('compose'));
    useShortcutAction('go_to_inbox', () => navigate('/mail/INBOX'));

    // Ref to track the current markAsRead timeout
    const markAsReadTimeoutRef = useRef<number | null>(null);
    const swipeNavInFlightRef = useRef(false);
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
            }
            else {
                // Default behavior - take the last part
                urlBoxName = pathParts[pathParts.length - 1];
            }

            // Decode URL-encoded characters (like %20 to space)
            urlBoxName = decodeURIComponent(urlBoxName);

            try {
                await fetchEmails(1, urlBoxName || boxName);
                setTimeout(scrollMailListToTop, 0);
            }
            finally {
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

    const openEmailDetailHandler = useCallback(async (
        currentActiveBox: string,
        uid: number,
        messageId: string,
        isSearch: boolean
    ) => {
        // Clear pending mark-as-read from the previously open email before switching
        if (markAsReadTimeoutRef.current) {
            clearTimeout(markAsReadTimeoutRef.current);
            markAsReadTimeoutRef.current = null;
        }

        let loaderTimeout: number | null = window.setTimeout(() => {
            setIsEmailDetailLoading(true);
            loaderTimeout = null;
        }, 200);

        try {
            const isAlreadyViewingEmail = !isDesktop && !!activeEmailMessageId && !isMailListOpen;

            setActiveEmailMessageId(messageId);
            // Keep current detail mounted while fetching the next mail so the mobile
            // list header (profile / inbox counts) cannot flash between swipes.
            if (!isAlreadyViewingEmail) {
                setEmailDetailSelected(null);
            }

            if (!isDesktop) {
                setIsMailListOpen(false);
            }

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

            // Prefer list state for fields kept fresh by socket (isSeen, threadCount).
            // get-single-email often returns threadCount: 1 for a reply, which would skip
            // loading the rest of the thread on first open.
            const emailInList = emails.find(e => e.messageId === messageId);
            const listThreadCount = emailInList?.threadCount ?? 0;
            const apiThreadCount = data.emailList?.threadCount ?? 0;
            setEmailDetailSelected({
                ...data.emailList,
                threadCount: Math.max(listThreadCount, apiThreadCount) || apiThreadCount || 1,
            });

            // Scroll detail pane to top when opening / swiping to another email
            if (emailScrollRef.current) {
                emailScrollRef.current.scrollTop = 0;
            }

            const isRead = emailInList ? emailInList.isSeen : data.emailList.isSeen;
            const markAsReadDelay = settings?.markAsReadDelay ?? 0;
            // On <=992, show Mark as Unread when the open mail is (or will be) read.
            const willAutoMarkAsRead = !isRead && markAsReadDelay !== -1;
            const toolbarIsRead = isRead || willAutoMarkAsRead;

            setToolbarState({
                showBack: !isDesktop,
                showSelectAll: isDesktop,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !isDesktop && !toolbarIsRead,
                showMarkAsUnread: !isDesktop && toolbarIsRead,
                showMove: true,
            });

            if (boxName && verifyBoxName(boxName, 'schedule') && verifyBoxName(boxName, 'draft')) {
                return;
            }

            if (!isRead) {
                const delay = markAsReadDelay;

                // Never
                if (delay === -1) {
                    return;
                }

                // Immediately
                if (delay === 0) {
                    markAsRead([messageId]);
                    return;
                }

                // Delayed mark as read
                markAsReadTimeoutRef.current = window.setTimeout(() => {
                    markAsRead([messageId]);
                    markAsReadTimeoutRef.current = null;
                }, delay * 1000);
            }

        } catch (error) {
            console.error('Failed to fetch email detail', error);
        } finally {
            if (loaderTimeout !== null) {
                clearTimeout(loaderTimeout);
                loaderTimeout = null;
            } else {
                setIsEmailDetailLoading(false);
            }
        }
    }, [
        activeEmailMessageId,
        boxName,
        emails,
        isDesktop,
        isMailListOpen,
        markAsRead,
        openModal,
        setActiveEmailMessageId,
        setEmailDetailSelected,
        setIsMailListOpen,
        setToolbarState,
        settings?.markAsReadDelay,
    ]);

    const handleSwipeNavigate = useCallback((direction: SwipeDirection) => {
        if (!activeEmailMessageId || emails.length === 0 || swipeNavInFlightRef.current) return;

        const currentIndex = emails.findIndex((email) => email.messageId === activeEmailMessageId);
        if (currentIndex < 0) return;

        // Swipe left → next (down the list); swipe right → previous (up the list)
        const targetIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
        if (targetIndex < 0 || targetIndex >= emails.length) return;

        const target = emails[targetIndex];
        if (!target?.messageId) return;

        swipeNavInFlightRef.current = true;
        void openEmailDetailHandler(
            currentActiveBox,
            target.uid,
            target.messageId,
            !!target.isSearchEmail || isSearchOrFilterMailList
        ).finally(() => {
            swipeNavInFlightRef.current = false;
        });
    }, [
        activeEmailMessageId,
        currentActiveBox,
        emails,
        isSearchOrFilterMailList,
        openEmailDetailHandler,
    ]);

    const swipeHandlers = useSwipeGesture({
        enabled: !isDesktop && !!activeEmailMessageId && !isDraftBox,
        onSwipe: handleSwipeNavigate,
    });

    const isSchedule = boxName?.toLocaleLowerCase().includes('schedule');
    // On mobile the detail panel is only mounted for an active email, so collapsing the
    // list without one would leave a blank screen.
    const isMailListCollapsed = !isMailListOpen && (isDesktop || !!activeEmailMessageId);
    const mailListStyleOpenViaSearch = isMailListCollapsed ? { width: '0px', 'min-width': '0px', 'border-right': '0px', overflow: 'hidden', opacity: '0' } : {};
    const mailDetailStyleOpenViaSearch = isMailListCollapsed ? { width: '100%' } : {};

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

    useEffect(() => {
        if (!isSearchOrFilterMailList || !activeEmailMessageId) return;

        const isInFilteredList = emails.some(email => email.messageId === activeEmailMessageId);
        if (!isInFilteredList) {
            setEmailDetailSelected(null);
            setActiveEmailMessageId(null);
            setToolbarState({
                showBack: false,
                showSelectAll: true,
                showRefresh: true,
                showDelete: false,
                showMarkAsRead: false,
                showMarkAsUnread: false,
                showMove: false,
            });

            if (!isDesktop) {
                setIsMailListOpen(true);
            }
        }
    }, [emails, isSearchOrFilterMailList, activeEmailMessageId, setEmailDetailSelected, setActiveEmailMessageId, setToolbarState, setIsMailListOpen, isDesktop]);

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
            {(isDesktop || !!activeEmailMessageId) && (
                <div
                    id="emailDetailSection"
                    className="mail-details-box"
                    style={mailDetailStyleOpenViaSearch}
                    ref={emailScrollRef}
                    onTouchStart={swipeHandlers.onTouchStart}
                    onTouchEnd={swipeHandlers.onTouchEnd}
                    onTouchCancel={swipeHandlers.onTouchCancel}
                >
                    {!isDraftBox && activeEmailMessageId && isEmailDetailLoading ? (
                        <EmailDetailSkeletonLoader />
                    ) : !isDraftBox && activeEmailMessageId && emailDetailSelected ? (
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
