import { useParams } from 'react-router-dom';
import { useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { getSingleEmailService } from '../../services/email/emailService';
import EmailRow from '../../features/emails/EmailRow';
import { useMailData, useMailSelection, useMailUI } from '../../context/index';
import EmailSkeletonLoader from '@components/ui/EmailSkeletonLoader';
import SimpleBar from 'simplebar-react';
import { useEmailAction } from '@hooks/useEmailAction';
import { handleEmailDeletion, verifyBoxName } from '@utils/emailUtil';
import NoEmailList from '@components/ui/email/NoEmailList';
import { useScreen } from '@context/ScreenContext';

// Lazy loaded components
const EmailDetail = lazy(() => import('../../features/emails/EmailDetail'));

const MailBoxPage = () => {
    const emailScrollRef = useRef<HTMLDivElement | null>(null);
    const { boxName } = useParams<{ boxName: string }>();
    const { setBoxName, fetchEmails, emails, emailDetailSelected, setEmailDetailSelected, activeEmailMessageId, setActiveEmailMessageId } = useMailData();
    const { selectedEmails, toggleEmailSelection } = useMailSelection();
    const { setToolbarState, isLoading, setIsLoading, openModal, isMailListOpen, activeModals, closeModal, setIsMailListOpen } = useMailUI();

    const { markAsRead, markAsUnread, deleteEmail } = useEmailAction();
    const { isDesktop } = useScreen();
    const currentActiveBox = boxName || '';
    const isDraftBox = boxName ? verifyBoxName(boxName, 'draft') : false;

    // Ref to track the current markAsRead timeout
    const markAsReadTimeoutRef = useRef<number | null>(null);

    /**
     * Holds the latest versions of every value that the stable row callbacks need.
     * Updated synchronously on every render — never triggers a re-render itself.
     * This is the standard "latest-ref" pattern for creating stable useCallback
     * wrappers that still see fresh values at call-time.
     */
    const latestRef = useRef<Record<string, any>>({});
    latestRef.current = {
        markAsRead,
        markAsUnread,
        deleteEmail,
        activeEmailMessageId,
        openModal,
        closeModal,
        setToolbarState,
        activeModals,
        toggleEmailSelection,
        isDesktop,
        setEmailDetailSelected,
        setActiveEmailMessageId,
        setIsMailListOpen,
        currentActiveBox,
        boxName,
        isDraftBox,
    };

    useEffect(() => {
        if (!boxName) return;

        let isCancelled = false;
        let isLoading = false;

        const loadEmails = async () => {
            if (isLoading) return;

            setIsLoading(true);
            isLoading = true;

            try {
                await fetchEmails(1, boxName);
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
            isLoading = false;
            if (markAsReadTimeoutRef.current) {
                clearTimeout(markAsReadTimeoutRef.current);
                markAsReadTimeoutRef.current = null;
            }
        };
    }, [boxName]);

    // ---------------------------------------------------------------------------
    // Stable row callbacks — empty dependency arrays are intentional.
    // All dynamic values are read from latestRef.current at call-time so that
    // React.memo on EmailRow can skip re-renders when unrelated state changes.
    // ---------------------------------------------------------------------------

    const onOpenEmail = useCallback(async (
        uid: number,
        messageId: string,
        isSearch: boolean,
        mongoId?: string
    ) => {
        try {
            const l = latestRef.current;
            const payload = {
                current_active_box: l.currentActiveBox,
                uid,
                messageId,
                isSearch,
                ...(mongoId ? { id: mongoId } : {}),
            };

            let data = await getSingleEmailService(payload);
            if (data.isScheduled) {
                data.emailList.isSchedule = true;
            }

            if (l.boxName && verifyBoxName(l.boxName, 'draft')) {
                data.emailList.isDraftMail = true;
                data.emailList.draftEmailId = data.emailList.id;
                data.emailList.draftMessageId = data.emailList.messageId;
                console.log("Open Compose Modal");
                l.openModal('compose', { emailData: data.emailList });
            }

            l.setEmailDetailSelected(data.emailList);
            l.setActiveEmailMessageId(messageId);
            const isRead = data.emailList.flags.includes("\\Seen");

            if (!l.isDesktop) {
                l.setIsMailListOpen(false);
            }

            l.setToolbarState({
                showBack: !l.isDesktop,
                showSelectAll: l.isDesktop,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !isRead,
                showMarkAsUnread: isRead,
                showMove: true,
            });

            if (l.boxName && verifyBoxName(l.boxName, 'schedule')) {
                return;
            }

            if (!isRead) {
                if (markAsReadTimeoutRef.current) {
                    clearTimeout(markAsReadTimeoutRef.current);
                }
                markAsReadTimeoutRef.current = window.setTimeout(() => {
                    latestRef.current.markAsRead([messageId]);
                    markAsReadTimeoutRef.current = null;
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to fetch email detail', error);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onMarkReadUnread = useCallback((messageIds: string[], shouldMarkAsRead: boolean) => {
        const l = latestRef.current;
        if (shouldMarkAsRead) {
            l.markAsRead(messageIds);
        } else {
            l.markAsUnread(messageIds);
        }
        if (l.activeEmailMessageId) {
            l.setToolbarState({
                showBack: false,
                showSelectAll: true,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !shouldMarkAsRead,
                showMarkAsUnread: shouldMarkAsRead,
                showMove: true,
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onDelete = useCallback((messageIds: string[], isDraftEmail: boolean) => {
        const l = latestRef.current;
        l.openModal('confirmDelete', {
            onConfirm: async () => {
                if (l.isDraftBox) {
                    const composeModal = l.activeModals.find((modal: any) => modal.type === 'compose');
                    if (composeModal) {
                        l.closeModal(composeModal.id);
                    }
                }
                return handleEmailDeletion(messageIds, isDraftEmail, {
                    deleteFn: l.deleteEmail,
                    successMessage: 'Email deleted successfully',
                    errorMessage: 'Failed to delete email',
                });
            }
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onToggleSelection = useCallback((messageId: string) => {
        latestRef.current.toggleEmailSelection(messageId);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ---------------------------------------------------------------------------

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

    return (
        <>
            {/* START:: Mail received box */}
            <div className={`mail-message-box ${isSchedule ? 'schedule-message-box' : ''}`} id="mailMessageBoxSection" style={mailListStyleOpenViaSearch}>
                <div className="mail-received-table-news">
                    {emails.length === 0 && !isLoading ? (
                        <NoEmailList />
                    ) : (
                        <SimpleBar
                            style={{ paddingLeft: '1px', marginLeft: '-1px' }}
                            autoHide={false}
                            forceVisible="y"
                            className="mailReceivedTableNewsSimpleBar"
                        >
                            <table className="table" id="email-list-table">
                                <tbody id="email-list">
                                    {isLoading ? (
                                        <EmailSkeletonLoader count={10} />
                                    ) :
                                        emails.length > 0 ? (
                                            emails.map((email: any) => {
                                                const isRead = email.flags.includes("\\Seen");
                                                const isSelected = selectedEmails.has(email.messageId);
                                                const isActive = activeEmailMessageId === (isSchedule ? email._id : email.messageId);
                                                return (
                                                    <EmailRow
                                                        key={email.messageId}
                                                        email={email}
                                                        isRead={isRead}
                                                        isSelected={isSelected}
                                                        isActive={isActive}
                                                        isSearch={false}
                                                        boxName={currentActiveBox}
                                                        onOpenEmail={onOpenEmail}
                                                        onMarkReadUnread={onMarkReadUnread}
                                                        onDelete={onDelete}
                                                        onToggleSelection={onToggleSelection}
                                                    />
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
