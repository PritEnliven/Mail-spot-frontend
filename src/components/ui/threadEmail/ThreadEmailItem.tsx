import CopyEmail from "@components/ui/email/CopyEmail";
import EmailBody from "@components/ui/email/EmailBody";
import EmailDetailAttachmentPreview from "@components/ui/email/EmailDetailAttachmentPreview";
import EmailRecipientList from "@components/ui/email/EmailRecipientList";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useAttachmentDownload } from "@hooks/useAttachmentDownload";
import { useHorizontalScrollbar } from "@hooks/useHorizontalScrollbar";
import { useReplyForward } from "@hooks/useReplyForward";
import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
import replyIcon from "@images/arrow-uturn-left-icon.svg";
import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
import forwardIcon from "@images/arrow-uturn-right-icon.svg";
import attachmentStrokesRoundedIconHover from "@images/attachment-stroke-rounded-icon-hover.svg";
import attachmentStrokesRoundedIcon from "@images/attachment-stroke-rounded-icon.svg";
import replyAllIconHover from "@images/reply-all-icon-hover.svg";
import replyAllIcon from "@images/reply-all-icon.svg";
import chevronDownIcon from "@images/chevron-down-icon.svg";
import chevronDownIconHover from "@images/chevron-down-icon-hover.svg";
import chevronUpIcon from "@images/chevron-up-icon.svg";
import chevronUpIconHover from "@images/chevron-up-icon-hover.svg";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import moment from 'moment';
import { lazy, Suspense, useState } from "react";
import type { PendingReply } from "@models/PendingReply";

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
}

const ThreadEmailItem = ({ index, email, onEmailSent, onPendingReply }: ThreadEmailItemProps) => {

    const [isThreadItemOpen, setisThreadItemOpen] = useState(false);
    const [isCcBccExpanded, setIsCcBccExpanded] = useState(false);
    const [toVisibleInfo, setToVisibleInfo] = useState({ visible: 0, total: 0 });
    const { replyForwardState, openReplyForward, closeReplyForward, } = useReplyForward();
    const { contentRef, scrollbarRef, thumbRef } = useHorizontalScrollbar();

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
            aria-label={isCcBccExpanded ? "Hide Cc/Bcc" : "Show Cc/Bcc"}
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

    return (
        <div className={`accordion-item pb-0 ${isThreadItemOpen ? 'open' : ''}`} id={`thread-${index}`}
            data-message-id={email.messageId}
            data-thread-id={email.threadId}
            data-uid={email.uid}
        >
            <h2 className="accordion-header">
                <button className="accordion-button custom-toggle-btn" type="button" onClick={toggleThread}>
                    <div className="mail-message-send--information-details-box w-100 mb-0">
                        <div className="d-block mb-3">
                            <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
                                <div className="d-flex align-items-center justify-content-between position-relative profile-main-box">
                                    {isThreadItemOpen &&
                                        (
                                            <span className="label-sm thread-label-text">From</span>
                                        )}
                                    <div className="d-flex align-items-center profile-section">
                                        <span className="mail-profile-label ms-0">{fromInitial}</span>
                                        <div className="d-block">
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
                                <div className="text-end">
                                    <span className="info-received-details d-block mb-1">
                                        {isDateInCurrentWeek(email.date)
                                            ? formatDate(email.date, TimeFormat.CALENDAR_SEARCH)
                                            : formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE)
                                        }
                                    </span>
                                    {email.attachments.length > 0 &&
                                        <a href="javascript:;" className="hover-link d-inline-flex align-items-center justify-content-end" data-original="images/attachment-stroke-rounded-icon.svg" data-hover="images/attachment-stroke-rounded-icon-hover.svg">
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
                            </div>
                            <div className="d-flex align-items-end justify-content-between ">
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
                                                {email.subject}
                                            </p>
                                        )}
                                </div>
                                {isThreadItemOpen && (
                                    <div className="application-btn-multi" id="replyForwardActionButtons">
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
                                            <li>
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
                                            <li>
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
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </button>
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