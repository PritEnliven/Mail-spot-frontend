import { useState } from "react";
import CopyEmail from "@components/ui/email/CopyEmail";
import replyIcon from "@images/arrow-uturn-left-icon.svg";
import replyAllIcon from "@images/reply-all-icon.svg";
import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
import replyAllIconHover from "@images/reply-all-icon-hover.svg";
import forwardIcon from "@images/arrow-uturn-right-icon.svg";
import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
import { useAttachmentDownload } from "@hooks/useAttachmentDownload";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import attachmentStrokesRoundedIcon from "@images/attachment-stroke-rounded-icon.svg";
import attachmentStrokesRoundedIconHover from "@images/attachment-stroke-rounded-icon-hover.svg";
import EmailRecipientList from "@components/ui/email/EmailRecipientList";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { mailboxParticipantToString, parseEmailAddress } from "@utils/emailUtil";
import EmailDetailAttachmentPreview from "@components/ui/email/EmailDetailAttachmentPreview";
import EmailBody from "@components/ui/email/EmailBody";
import ReplyForwardComposer from "@components/ui/ReplyForwardComposer";
import { useReplyForward } from "@hooks/useReplyForward";
import { useHorizontalScrollbar } from "@hooks/useHorizontalScrollbar";
import moment from 'moment';

// Helper function to check if date is in current week
const isDateInCurrentWeek = (date: Date | string | number): boolean => {
    const emailDate = moment(date);
    const now = moment();

    // Start of week (Sunday)
    const startOfWeek = now.clone().startOf('week');
    // End of week (Saturday)
    const endOfWeek = now.clone().endOf('week');

    return emailDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
};

interface ThreadEmailItemProps {
    email: any;
    index: number;
}

const ThreadEmailItem = ({ index, email }: ThreadEmailItemProps) => {

    const [isThreadItemOpen, setisThreadItemOpen] = useState(false);
    const { replyForwardState, openReplyForward, closeReplyForward, } = useReplyForward();
    const { contentRef, scrollbarRef, thumbRef } = useHorizontalScrollbar();

    const toggleThread = () => {
        setisThreadItemOpen(prev => !prev);
    }

    const { downloadAttachments } = useAttachmentDownload();

    const openAttachment = () => {
    };

    const { email: fromEmail, name: fromName, initial: fromInitial } = parseEmailAddress(
        mailboxParticipantToString(email.from?.[0])
    );

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
                                {isThreadItemOpen &&
                                    (
                                        <div className="mail-details-information-details-box  thread-mail-to-box  align-items-center m-0">
                                            <span className="label-sm">To</span>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <EmailRecipientList emails={email.to} />
                                            </div>
                                        </div>
                                    )}
                                {!isThreadItemOpen &&
                                    (
                                        <p className="shot-message-info-thread mb-0" style={{ display: "block" }}>
                                            {email.subject}
                                        </p>
                                    )}
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
                    {email.attachments.length > 0 && (
                        <EmailDetailAttachmentPreview
                            attachments={email.attachments}
                            messageId={email.messageId}
                            onDownloadAttachment={downloadAttachments}
                            onOpenAttachment={openAttachment}
                        />
                    )}
                    <div className="thread-reply-mail-section pb-3" id={`threadReplyForwardSection${index}`}>
                        {replyForwardState.isOpen && replyForwardState.sourceEmail?.messageId === email.messageId && replyForwardState.sourceEmail && (
                            <ReplyForwardComposer
                                email={replyForwardState.sourceEmail}
                                type={replyForwardState.type!}
                                onClose={closeReplyForward}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ThreadEmailItem;