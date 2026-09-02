import CopyEmail from "@components/ui/email/CopyEmail";
import EmailBody from "@components/ui/email/EmailBody";
import EmailDetailAttachmentPreview from "@components/ui/email/EmailDetailAttachmentPreview";
import EmailRecipientList from "@components/ui/email/EmailRecipientList";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import { useAttachmentDownload } from "@hooks/useAttachmentDownload";
import { useHorizontalScrollbar } from "@hooks/useHorizontalScrollbar";
import { useReplyForward } from "@hooks/useReplyForward";
import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
import replyIcon from "@images/arrow-uturn-left-icon.svg";
import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
import forwardIcon from "@images/arrow-uturn-right-icon.svg";
import chevronDownIcon from "@images/chevron-down-icon.svg";
import chevronDownIconHover from "@images/chevron-down-icon-hover.svg";
import chevronUpIcon from "@images/chevron-up-icon.svg";
import chevronUpIconHover from "@images/chevron-up-icon-hover.svg";
import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
import attachmentStrokesRoundedIconHover from "@images/attachment-stroke-rounded-icon-hover.svg";
import attachmentStrokesRoundedIcon from "@images/attachment-stroke-rounded-icon.svg";
import replyAllIconHover from "@images/reply-all-icon-hover.svg";
import replyAllIcon from "@images/reply-all-icon.svg";
import deleteIconHover from "@images/trash-icon-hover.svg";
import deleteIcon from "@images/trash-icon.svg";
import type { PendingReply } from "@models/PendingReply";
import { deleteEmails } from "@services/emailAction/emailActionService";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { getEmailPreviewText } from "@utils/emailUtil";
import { useScreen } from "@context/ScreenContext";
import moment from 'moment';
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useMailData, useMailUI } from '../../../context/index';
import CalendarInviteCard from "@components/ui/calendar/CalendarInviteCard";
import { canRenderCalendarInviteCard } from "@utils/calendarInviteUtil";

// Lazy loaded components
const ReplyForwardComposer = lazy(() => import("@components/ui/ReplyForwardComposer"));

// Helper function to check if date is in current week
const isDateInCurrentWeek = (date: Date | string | number): boolean => {
    const emailDate = moment(date);
    const now = moment();

    const startOfWeek = now.clone().startOf('week');
    const endOfWeek = now.clone().endOf('week');

    return emailDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
};

interface ThreadEmailItemProps {
    email: any;
    index: number;
    onEmailSent?: () => void;
    onPendingReply?: (reply: PendingReply) => void;
    /** Called after delete/move API succeeds so the parent can drop this item from the thread UI */
    onThreadEmailRemoved?: (messageId: string) => void;
    /** When true, this reply starts expanded (e.g. newest unread in the thread). */
    defaultOpen?: boolean;
}

const ThreadEmailItem = ({ index, email, onEmailSent, onPendingReply, onThreadEmailRemoved, defaultOpen = false }: ThreadEmailItemProps) => {

    const [isThreadItemOpen, setisThreadItemOpen] = useState(defaultOpen);
    const prevDefaultOpenRef = useRef(defaultOpen);

    // Sync when parent targets a different auto-open reply (e.g. a newer unread arrives).
    useEffect(() => {
        if (defaultOpen !== prevDefaultOpenRef.current) {
            setisThreadItemOpen(defaultOpen);
            prevDefaultOpenRef.current = defaultOpen;
        }
    }, [defaultOpen]);
    const [isCcBccExpanded, setIsCcBccExpanded] = useState(false);
    const [toVisibleInfo, setToVisibleInfo] = useState({ visible: 0, total: 0 });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const { replyForwardState, openReplyForward, closeReplyForward, } = useReplyForward();
    const { contentRef, scrollbarRef, thumbRef } = useHorizontalScrollbar();
    const { boxName, updateBoxCount } = useMailData();
    const { openModal } = useMailUI();
    const { isDesktop } = useScreen();

    const formattedDate = isDateInCurrentWeek(email.date)
        ? formatDate(email.date, TimeFormat.CALENDAR_SEARCH)
        : formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE);

    const DateMeta = ({ className = "" }: { className?: string }) => (
        <div className={className}>
            <span className="info-received-details d-block mb-1">
                {formattedDate}
            </span>
            {email.attachments?.length > 0 &&
                <a href="#" className="hover-link d-inline-flex align-items-center justify-content-end" onClick={(e) => e.preventDefault()}>
                    <InteractiveIcon
                        defaultIcon={attachmentStrokesRoundedIcon}
                        hoverIcon={attachmentStrokesRoundedIconHover}
                        activeIcon=""
                        isActive={false}
                        alt=""
                        className="interactive-icon hover-image"
                        renderAs="img"
                        tooltip=""
                    />
                </a>
            }
        </div>
    );

    const toggleThread = () => {
        setisThreadItemOpen(prev => {
            if (prev) setIsCcBccExpanded(false);
            return !prev;
        });
    }

    const { downloadAttachments } = useAttachmentDownload();

    const openAttachment = () => {
    };

    const { email: fromEmail, name: fromName } = email.from?.[0] || {};

    const fromInitial = (fromName || fromEmail || 'U').charAt(0).toUpperCase();

    const hasCc = email.cc?.length > 0;
    const hasBcc = email.bcc?.length > 0;
    const hasMore = hasCc || hasBcc;
    const hasHiddenTo = toVisibleInfo.total > toVisibleInfo.visible;

    const toggleCcBcc = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsCcBccExpanded(prev => !prev);
    };

    const ToggleChevronButton = () => (
        <button
            type="button"
            className={`btn-new toggle-recipients-btn flex-shrink-0 ${isCcBccExpanded ? 'is-expanded' : ''}`}
            onClick={toggleCcBcc}
            aria-label={ isCcBccExpanded ? "Hide Cc/Bcc" : "Show Cc/Bcc" }
        >
            <InteractiveIcon
                defaultIcon={isCcBccExpanded ? chevronUpIcon : chevronDownIcon}
                hoverIcon={isCcBccExpanded ? chevronUpIconHover : chevronDownIconHover}
                className="interactive-icon hover-image"
                tooltip=""
            />
        </button>
    );

    const toReserveWidth = !isCcBccExpanded && hasMore ? 32 : 0;

    const updateSidebarAfterRemoval = () => {
        const unreadDelta = email.isSeen ? 0 : -1;
        updateBoxCount(boxName, unreadDelta, -1);
    };

    const handleDeleteConfirm = async () => {
        if (!email.messageId || isActionLoading) return;
        setIsActionLoading(true);
        try {
            const response = await deleteEmails({
                messageIds: [email.messageId],
                current_active_box: boxName,
                isDraftMail: false,
            });
            if (response.statusCode === 200) {
                showSuccess('Email deleted successfully');
                updateSidebarAfterRemoval();
                onThreadEmailRemoved?.(email.messageId);
            } else {
                showError(response.message || 'Failed to delete email');
            }
        } catch {
            showError('Failed to delete email');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {            
        e.preventDefault();
        e.stopPropagation();
        setShowMoreMenu(false);
        openModal('confirmDelete', {
            messageIds: [email.messageId],
            onConfirm: () => handleDeleteConfirm(),
        })
    };

    const replyActionsEl = isThreadItemOpen ? (
        <div
            className="application-btn-multi flex-shrink-0"
            id={`replyForwardActionButtons-${index}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <ul>
                <li>
                    <a href="" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openReplyForward("reply", email, `threadReplyForwardSection${index}`); }} className="hover-link">
                        <InteractiveIcon
                            defaultIcon={replyIcon}
                            hoverIcon={replyIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Reply"
                        />
                    </a>
                </li>
                <li className="thread-email-hide-on-mobile">
                    <a href="" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openReplyForward("replyAll", email, `threadReplyForwardSection${index}`); }} className="hover-link">
                        <InteractiveIcon
                            defaultIcon={replyAllIcon}
                            hoverIcon={replyAllIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Reply all"
                        />
                    </a>
                </li>
                <li className="thread-email-hide-on-mobile">
                    <a href="" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openReplyForward("forward", email, `threadReplyForwardSection${index}`); }} className="hover-link">
                        <InteractiveIcon
                            defaultIcon={forwardIcon}
                            hoverIcon={forwardIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Forward"
                        />
                    </a>
                </li>
                <li>
                    <Dropdown
                        className="more-actions-dropdown react-dropdown thread-email-react-dropdown-replay-btn"
                        show={showMoreMenu}
                        onToggle={(next) => setShowMoreMenu(next)}
                        autoClose="outside"
                    >
                        <Dropdown.Toggle
                            as="button"
                            type="button"
                            className="hover-link d-flex align-items-center icon-hover-effect btn btn-link p-0 border-0"
                            onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowMoreMenu((prev) => !prev);
                            }}
                        >
                            <InteractiveIcon
                                defaultIcon={moreActionIcon}
                                hoverIcon={moreActionIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="More"
                            />
                        </Dropdown.Toggle>

                        <Dropdown.Menu
                            renderOnMount
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Dropdown.Item
                                className="show-on-mobile-thread-email-only justify-content-start"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openReplyForward("replyAll", email, `threadReplyForwardSection${index}`); setShowMoreMenu(false); }}
                            >
                                <InteractiveIcon
                                    defaultIcon={replyAllIcon}
                                    hoverIcon={replyAllIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip=""
                                />
                                <span className="d-flex align-items-center ms-3">Reply all</span>
                            </Dropdown.Item>

                            <Dropdown.Item
                                className="show-on-mobile-thread-email-only justify-content-start"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); openReplyForward("forward", email, `threadReplyForwardSection${index}`); setShowMoreMenu(false); }}
                            >
                                <InteractiveIcon
                                    defaultIcon={forwardIcon}
                                    hoverIcon={forwardIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip=""
                                />
                                <span className="d-flex align-items-center ms-3">Forward</span>
                            </Dropdown.Item>

                            <Dropdown.Item
                                className="justify-content-start"
                                disabled={isActionLoading}
                                onClick={handleDeleteClick}
                            >
                                <InteractiveIcon
                                    defaultIcon={deleteIcon}
                                    hoverIcon={deleteIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip=""
                                />
                                <span className="d-flex align-items-center ms-3">Delete</span>
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </li>
            </ul>
        </div>
    ) : null;

    return (
        <div className={`accordion-item pb-0 ${isThreadItemOpen ? 'open' : ''}`} id={`thread-${index}`}
            data-message-id={email.messageId}
            data-thread-id={email.threadId}
            data-uid={email.uid}
        >
            <h2 className="accordion-header">
                {/* Use a div instead of <button> so nested Reply/More controls can receive clicks.
                    Nested interactive elements inside <button> are invalid HTML and break dropdowns. */}
                <div className={`accordion-button custom-toggle-btn ${isThreadItemOpen ? '' : 'collapsed'}`}>
                    <div
                        className="mail-message-send--information-details-box w-100 mb-0"
                        role="button"
                        tabIndex={0}
                        onClick={toggleThread}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleThread();
                            }
                        }}
                    >
                        <div className="d-block mb-3">
                            {isThreadItemOpen && canRenderCalendarInviteCard(email.calendarInvite) && (
                                <CalendarInviteCard email={email} />
                            )}
                            <div className="mail-details-information-details-box d-flex align-items-start justify-content-between gap-2">
                                <div className="d-flex align-items-center justify-content-between position-relative profile-main-box" style={{ minWidth: 0, flex: 1 }}>
                                    {isThreadItemOpen &&
                                        (
                                            <span className="label-sm thread-label-text flex-shrink-0">From</span>
                                        )}
                                    <div className="d-flex align-items-center profile-section" style={{ minWidth: 0, flex: 1 }}>
                                        <span className="mail-profile-label ms-0 flex-shrink-0">{fromInitial}</span>
                                        <div className="d-block" style={{ minWidth: 0, overflow: "hidden" }}>
                                            <span className="mail-profile-name d-block ">{fromName}</span>
                                            <span className="mail-profile-id d-block">{fromEmail}</span>
                                        </div>
                                    </div>
                                    <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <CopyEmail
                                            name={fromName}
                                            email={fromEmail}
                                            initial={fromInitial}
                                        />
                                    </div>
                                </div>
                                {/* Mobile: Reply/Forward align with From (same as root email). Desktop: date stays here. */}
                                {!isDesktop && replyActionsEl}
                                {isDesktop && (
                                    <DateMeta className="text-end thread-mail-date-meta thread-mail-date-meta--inline" />
                                )}
                            </div>
                            <div className="d-flex align-items-end justify-content-between thread-mail-to-row">
                                <div className="cc-bcc-to-info" style={{ minWidth: 0, flex: 1 }}>
                                    {isThreadItemOpen &&
                                        (
                                            <div className="mail-details-information-details-box thread-mail-to-box d-flex align-items-start m-0" style={{ minWidth: 0 }}>
                                                <span className="label-sm flex-shrink-0">To</span>
                                                <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                                                    <EmailRecipientList
                                                        emails={email.to}
                                                        reserveWidth={toReserveWidth}
                                                        onVisibleCountChange={(visible, total) => setToVisibleInfo({ visible, total })}
                                                        trailingElement={!isCcBccExpanded && hasMore ? <ToggleChevronButton /> : null}
                                                        expanded={isCcBccExpanded}
                                                    />
                                                    {!isCcBccExpanded && !hasMore && hasHiddenTo && (
                                                        <span className="hidden-count-badge flex-shrink-0">
                                                            +{toVisibleInfo.total - toVisibleInfo.visible}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    {isThreadItemOpen && isCcBccExpanded && hasCc &&
                                        (
                                            <div className="mail-details-information-details-box thread-mail-to-box d-flex align-items-start m-0" style={{ minWidth: 0 }}>
                                                <span className="label-sm flex-shrink-0">Cc</span>
                                                <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                                                    <EmailRecipientList
                                                        emails={email.cc}
                                                        reserveWidth={!hasBcc ? 32 : 0}
                                                        trailingElement={!hasBcc ? <ToggleChevronButton /> : null}
                                                        expanded
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    {isThreadItemOpen && isCcBccExpanded && hasBcc &&
                                        (
                                            <div className="mail-details-information-details-box thread-mail-to-box d-flex align-items-start m-0" style={{ minWidth: 0 }}>
                                                <span className="label-sm flex-shrink-0">Bcc</span>
                                                <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
                                                    <EmailRecipientList
                                                        emails={email.bcc}
                                                        reserveWidth={32}
                                                        trailingElement={<ToggleChevronButton />}
                                                        expanded
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    {!isThreadItemOpen &&
                                        (
                                            <p className="shot-message-info-thread mb-0" style={{ display: "block" }}>
                                                {getEmailPreviewText(email)}
                                            </p>
                                        )}
                                </div>
                                {/* Desktop: Reply/Forward stay beside To. Mobile/tablet: date beside To (stacks below at ≤775). */}
                                {isDesktop && replyActionsEl}
                                {!isDesktop && (
                                    <DateMeta className="text-end thread-mail-date-meta thread-mail-date-meta--to-side flex-shrink-0 ms-2" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </h2>
            {isThreadItemOpen && (
                <div id={`custom-thread-${index}`} className={`mt-3 ${isThreadItemOpen ? 'custom-accordion-body-border' : ''}`}>
                    <div className="horizontal-scroll-container mail-content-details-box">
                        {email.body && (
                            <div className="horizontal-scroll-content" ref={contentRef}>
                                <div id={`send-box-mail-content-${index}`}>
                                    <EmailBody html={email.body} />
                                </div>
                            </div>
                        )}
                        <div className="custom-horizontal-scrollbar-sticky-top" ref={scrollbarRef}>
                            <div className="custom-scrollbar-thumb-horizontal" ref={thumbRef}></div>
                        </div>
                    </div>
                    {(email.attachments?.length > 0 || (email.remainingAttachments ?? 0) > 0) && (
                        <EmailDetailAttachmentPreview
                            attachments={email.attachments}
                            messageId={email.messageId}
                            remainingAttachments={email.remainingAttachments}
                            hideIcsAttachments={!!email.calendarInvite}
                            onDownloadAttachment={downloadAttachments}
                            onOpenAttachment={openAttachment}
                        />
                    )}
                    <div className="thread-reply-mail-section pb-3" id={`threadReplyForwardSection${index}`}>
                        {replyForwardState.isOpen && replyForwardState.sourceEmail?.messageId === email.messageId && replyForwardState.sourceEmail && (
                            <Suspense fallback={null}>
                                <ReplyForwardComposer
                                    email={replyForwardState.sourceEmail}
                                    type={replyForwardState.type!}
                                    onClose={closeReplyForward}
                                    onEmailSent={onEmailSent}
                                    onPendingReply={onPendingReply}
                                />
                            </Suspense>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ThreadEmailItem;