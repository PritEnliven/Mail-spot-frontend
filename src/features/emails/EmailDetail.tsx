import InteractiveIcon from "@components/ui/InteractiveIcon";
import CopyEmail from "@components/ui/email/CopyEmail";
import EmailBody from "@components/ui/email/EmailBody";
import EmailDetailAttachmentPreview from "@components/ui/email/EmailDetailAttachmentPreview";
import EmailRecipientList from "@components/ui/email/EmailRecipientList";
import EmailSendInformation from "@components/ui/email/EmailSendInformationRespon";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import { useScreen } from "@context/ScreenContext";
import { useAttachmentDownload } from "@hooks/useAttachmentDownload";
import { useHorizontalScrollbar } from "@hooks/useHorizontalScrollbar";
import { useReplyForward } from "@hooks/useReplyForward";
import replyIconHover from "@images/arrow-uturn-left-icon-hover.svg";
import replyIcon from "@images/arrow-uturn-left-icon.svg";
import forwardIconHover from "@images/arrow-uturn-right-icon-hover.svg";
import forwardIcon from "@images/arrow-uturn-right-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import editIconHover from '@images/edit2-icon-hover.svg';
import editIcon from '@images/edit2-icon.svg';
import replyAllIconHover from "@images/reply-all-icon-hover.svg";
import replyAllIcon from "@images/reply-all-icon.svg";
import type { Email } from "@models/Email";
import type { PendingReply } from "@models/PendingReply";
import type { Response } from "@models/Response";
import { cancelScheduledEmail, getScheduleEmail } from "@services/scheduleEmail/scheduleEmailService";
import { getAllThreadEmails } from "@services/threadEmail/threadEmailService";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { verifyBoxName, parseEmailAddress, mailboxParticipantToString } from "@utils/emailUtil";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useMailData, useMailUI } from '../../context/index';
import { HighlightText } from "@components/ui/HighlightText";
import { useSocketEvent } from "@hooks/useSocket";

// Lazy loaded components
const ThreadEmailItem = lazy(() => import("@components/ui/threadEmail/ThreadEmailItem"));
const ReplyForwardComposer = lazy(() => import("@components/ui/ReplyForwardComposer"));
const PendingThreadEmailItem = lazy(() => import("@components/ui/threadEmail/PendingThreadEmailItem"));

export interface RelativeDate {
    isOld: boolean;
    value: string;
}

export interface CustomBox {
    key: string;
    value: string;
}

interface Props {
    email: Email;
}

const openAttachment = (customFileName: string, filename: string, isEml: boolean) => {
};

const EmailDetail = ({ email }: Props) => {
    const { downloadAttachments } = useAttachmentDownload();
    const { openModal } = useMailUI();
    const { emails, setEmails, emailDetailSelected, setEmailDetailSelected, pagination, setPagination, setActiveEmailMessageId, boxName, updateBoxCount, searchTerm, allSearchResult } = useMailData()
    const { replyForwardState, openReplyForward, closeReplyForward } = useReplyForward();
    const { contentRef, scrollbarRef, thumbRef } = useHorizontalScrollbar()
    const [threadEmails, setThreadEmails] = useState<any[]>([]);
    const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([]);
    const { isDesktop } = useScreen();

    // const fromStr = mailboxParticipantToString(email.from?.[0]);
    // const parsedFrom = parseEmailAddress(fromStr);
    // const fromEmail = parsedFrom.email || fromStr;
    // const fromName =
    //     parsedFrom.name ||
    //     (fromEmail.includes("@") ? fromEmail.split("@")[0] : fromEmail);
    // const initial = parsedFrom.initial;

    const fromAddr = email.from?.[0];
    const fromEmail = fromAddr?.email || "";
    const fromName = fromAddr?.name || fromEmail.split("@")[0] || fromEmail;
    const initial = fromName.charAt(0).toUpperCase();

    const emailDate = formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE);
    const highlightTerm = email.isSearchEmail || allSearchResult ? searchTerm : "";

    const isScheduleBox = useMemo(() => verifyBoxName(boxName, 'scheduled'), [boxName]);

    const loadThreadEmails = useCallback(async () => {
        try {
            const response = await getAllThreadEmails({
                messageId: email.messageId,
                threadId: email.threadId
            });
            setThreadEmails(response.data.threadEmails || []);
        } catch (error) {
            console.error('Error loading thread emails:', error);
        }
    }, [email.messageId, email.threadId]);

    useEffect(() => {
        setThreadEmails([]);
        const isExcludedBox = verifyBoxName(boxName, 'schedule') || verifyBoxName(boxName, 'sent') || verifyBoxName(boxName, 'trash');

        const hasThread = (emailDetailSelected?.threadCount ?? 0) > 1;

        const shouldLoad = !isExcludedBox
            && hasThread
            && !emailDetailSelected?.isSearchEmail;

        if (shouldLoad) {
            loadThreadEmails();
        }
    }, [loadThreadEmails, boxName, emailDetailSelected?.isSearchEmail, emailDetailSelected?.messageId, emailDetailSelected?.threadCount]);

    const handleCancelScheduleEmail = async (id: string) => {
        try {
            const response: Response = await cancelScheduledEmail({ id });
            if (response.statusCode === 200) {
                showSuccess("Schedule email canceld !!")
                const emailToDelete = emails.find(email => email.id === id);
                if (emailToDelete) {
                    updateBoxCount(boxName, -1, -1);
                    setEmails(prevEmails => prevEmails.filter(email => email.id !== id));
                    setEmailDetailSelected(null);
                    setActiveEmailMessageId(null);
                    if (pagination) {
                        setPagination({
                            ...pagination,
                            endCount: pagination.endCount - 1,
                            totalEmails: pagination.totalEmails - 1
                        });
                    }
                }
            }
        } catch (error) {
            showError("Error while cancel schedule email")
        }
    }

    const handleEmailReplyForward = () => {
        if (!boxName.toLocaleLowerCase().includes('schedule')) {
            setEmails(prevEmails =>
                prevEmails.map(e =>
                    e.messageId === email.messageId
                        ? { ...e, threadCount: (e.threadCount ?? 0) + 1 }
                        : e
                )
            );
            loadThreadEmails();
        }
    }

    // Optimistically append a pending row; skip thread refresh until socket confirms
    const handlePendingReply = useCallback((reply: PendingReply) => {
        if (!boxName.toLocaleLowerCase().includes('schedule')) {
            setEmails(prevEmails =>
                prevEmails.map(e =>
                    e.messageId === email.messageId
                        ? { ...e, threadCount: (e.threadCount ?? 0) + 1 }
                        : e
                )
            );
        }
        setPendingReplies(prev => [...prev, reply]);
    }, [boxName, email.messageId, setEmails]);

    // Called by socket 'outboundReplySent' — flip row from pending → sent (light → full opacity)
    const clearPendingReply = useCallback((clientMessageId: string) => {
        setPendingReplies(prev =>
            prev.map(r =>
                r.clientMessageId === clientMessageId
                    ? { ...r, status: 'sent' as const }
                    : r
            )
        );
    }, []);

    // Called by socket 'outboundReplyFailed' — mark row as failed and show toast
    const markPendingReplyFailed = useCallback((clientMessageId: string, errorMessage?: string) => {
        setPendingReplies(prev =>
            prev.map(r =>
                r.clientMessageId === clientMessageId
                    ? { ...r, status: 'failed' as const, errorMessage: errorMessage || 'Send failed' }
                    : r
            )
        );
        showError(errorMessage || 'Failed to send reply. Please try again.');
    }, []);

    // Clear pending rows when switching to a different email
    useEffect(() => {
        setPendingReplies([]);
    }, [email.messageId]);

    // Socket: reply confirmed → resolve pending row
    useSocketEvent('outboundReplySent', (data: { clientMessageId: string }) => {
        clearPendingReply(data.clientMessageId);
    });

    // Socket: reply failed → mark pending row as failed
    useSocketEvent('outboundReplyFailed', (data: { clientMessageId: string; error?: string }) => {
        markPendingReplyFailed(data.clientMessageId, data.error);
    });

    const handleEditScheduleEmail = async (id: string) => {
        try {
            const response: Response = await getScheduleEmail({ id });
            if (response.statusCode === 200) {
                const email = response.data;
                openModal('compose', {
                    emailData: {
                        _id: email._id,
                        to: email.to ?? [],
                        cc: email.cc ?? [],
                        bcc: email.bcc ?? [],
                        subject: email.subject ?? '',
                        body: email.body ?? '',
                        attachments: email.attachments ?? [],
                        scheduledTime: email.scheduledTime ?? null,
                        isScheduled: true,
                        isEditScheduleEmail: true
                    }
                })
            }
        } catch (error) {
            showError("Error while cancel schedule email")
        }
    }

    return (
        <div className="email-detail-section">
            {/* Header */}
            <div
                className="mail-details-header d-flex align-items-center justify-content-between"
                id="singleEmailPage"
                data-message-id={email.messageId}
                data-thread-id={email.threadId}
                data-uid={email.uid}
            >
                <div className="d-flex align-items-center">
                    <h2 className="box-title">
                        <HighlightText text={email.subject || "No Subject"} searchTerm={highlightTerm} />
                    </h2>
                </div>
            </div>

            {/* mail-details-information-details-box */}
            {isDesktop ? (
                <div className="mail-message-send--information-details-box">
                    <div className="d-block">
                        <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
                            <div className="d-flex align-items-center justify-content-between position-relative profile-main-box">
                                <span className="label-sm">From</span>
                                <div className="d-flex align-items-center profile-section">
                                    <span className="mail-profile-label ms-0">
                                        {initial.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="d-block">
                                        <span className="mail-profile-name d-block">
                                            <HighlightText text={fromName} searchTerm={highlightTerm} />
                                        </span>
                                        <span className="mail-profile-id d-block">
                                            <HighlightText text={fromEmail} searchTerm={highlightTerm} />
                                        </span>
                                    </div>
                                </div>
                                <CopyEmail name={fromName} email={fromEmail} initial={initial} />
                            </div>

                            <span className="info-received-details d-block">
                                {emailDate}
                            </span>
                        </div>

                        <div className="d-flex align-items-end justify-content-between cc-bcc-to-info">
                            <div className="d-block">
                                {/* To */}
                                <div className="mail-details-information-details-box  d-flex align-items-start m-0">
                                    <span className="label-sm">To</span>
                                    <div className="d-flex align-items-center tomail-list">
                                        <EmailRecipientList emails={email.to} searchTerm={highlightTerm} />
                                    </div>
                                </div>

                                {/* CC */}
                                {email.cc.length > 0 && (
                                    <div className="mail-details-information-details-box d-flex align-items-center m-0">
                                        <span className="label-sm">CC</span>
                                        <div className="d-flex align-items-center tomail-list">
                                            <EmailRecipientList emails={email.cc} searchTerm={highlightTerm} />
                                        </div>
                                    </div>
                                )}

                                {/* BCC */}
                                {email.bcc.length > 0 && (
                                    <div className="mail-details-information-details-box d-flex align-items-center m-0">
                                        <span className="label-sm">BCC</span>
                                        <div className="d-flex align-items-center tomail-list">
                                            <EmailRecipientList emails={email.bcc} searchTerm={highlightTerm} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Actions */}
                            {!isScheduleBox && (
                                <div className="application-btn-multi" id="emailActionsBtn">
                                    <ul>
                                        <li>
                                            <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); openReplyForward("reply", email, "reply-forward-bottom-box"); }}>
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
                                            <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); openReplyForward("replyAll", email, "reply-forward-bottom-box"); }}>
                                                <InteractiveIcon
                                                    defaultIcon={replyAllIcon}
                                                    hoverIcon={replyAllIconHover}
                                                    activeIcon=""
                                                    isActive={false}
                                                    alt=""
                                                    className="interactive-icon hover-image"
                                                    renderAs="img"
                                                    tooltip="Reply All"
                                                />
                                            </a>
                                        </li>
                                        <li>
                                            <a href="" className="hover-link icon-hover-effect" onClick={(e) => { e.preventDefault(); openReplyForward("forward", email, "reply-forward-bottom-box"); }}>
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
            ) : (
                /* mail-details-information-details-box-mobile */
                (<EmailSendInformation
                    initial={initial}
                    fromName={fromName}
                    fromEmail={fromEmail}
                    isSchedule={!!isScheduleBox}
                    email={email}
                    searchTerm={highlightTerm}
                    onReplyForwardAction={(action) => openReplyForward(action as any, email, "reply-forward-bottom-box")}
                />)
            )}

            { /** Schedule info box */}

            {isScheduleBox && (
                <div className="schedule-info-box">
                    <div className="d-flex align-items-center">
                        <img src="images/scheduled-icon.svg" alt="" className="me-3" />
                        <p className="m-0 me-1">Send scheduled for</p>
                        <span>{formatDate(email.date, TimeFormat.SCHEDULE_DATE)}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <a href="javascript:;" className="hover-link d-flex align-items-center me-2" onClick={() => handleEditScheduleEmail(email.id)}>
                            <InteractiveIcon
                                defaultIcon={editIcon}
                                hoverIcon={editIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Edit"
                            />
                        </a>
                        <a href="javascript:;" className="hover-link d-flex align-items-center" onClick={() => handleCancelScheduleEmail(email.id)}>
                            <InteractiveIcon
                                defaultIcon={closeIcon}
                                hoverIcon={closeIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Cancel send"
                            />
                        </a>
                    </div>
                </div>
            )}

            {/* Body */}
            {email.body && (
                <div className="mail-content-details-box" id="emailBodySection">
                    <div className="horizontal-scroll-container" >
                        {email.body && (
                            <div className="horizontal-scroll-content" ref={contentRef}>
                                <div>
                                    <EmailBody html={email.body} searchTerm={highlightTerm} />
                                </div>
                            </div>
                        )}
                        <div className="custom-horizontal-scrollbar-sticky-top" ref={scrollbarRef}>
                            <div className="custom-scrollbar-thumb-horizontal" ref={thumbRef}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachments */}
            <EmailDetailAttachmentPreview
                attachments={email.attachments}
                messageId={email.messageId}
                onDownloadAttachment={downloadAttachments}
                onOpenAttachment={openAttachment}
            />

            {!isScheduleBox && (
                <div className="application-btn-multi" id="replyForwardActionButtons">
                    <ul>
                        <li>
                            <a href="" onClick={(e) => { e.preventDefault(); openReplyForward("reply", email, 'reply-forward-bottom-box'); }}
                                className="hover-link"
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content="Reply"
                                data-tooltip-place="top"
                            >
                                <InteractiveIcon
                                    defaultIcon={replyIcon}
                                    hoverIcon={replyIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="hover-image me-2 interactive-icon"
                                    renderAs="img"
                                    tooltip=""
                                />
                                Reply
                            </a>
                        </li>
                        <li>
                            <a href="" onClick={(e) => { e.preventDefault(); openReplyForward("replyAll", email, 'reply-forward-bottom-box'); }}
                                className="hover-link"
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content="Reply all"
                                data-tooltip-place="top"
                            >
                                <InteractiveIcon
                                    defaultIcon={replyAllIcon}
                                    hoverIcon={replyAllIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="hover-image me-2 interactive-icon"
                                    renderAs="img"
                                    tooltip=""
                                />
                                Reply All
                            </a>
                        </li>
                        <li>
                            <a href="" onClick={(e) => { e.preventDefault(); openReplyForward("forward", email, 'reply-forward-bottom-box'); }}
                                className="hover-link"
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content="Forward"
                                data-tooltip-place="top"
                            >
                                <InteractiveIcon
                                    defaultIcon={forwardIcon}
                                    hoverIcon={forwardIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="hover-image me-2 interactive-icon"
                                    renderAs="img"
                                    tooltip=""
                                />
                                Forward
                            </a>
                        </li>
                    </ul>
                </div>
            )
            }

            <div className="reply-section mt-3" id="replyForwardSection">
                {replyForwardState.isOpen && replyForwardState.sourceEmail?.messageId === email.messageId && replyForwardState.sourceEmail && (
                    <Suspense fallback={null}>
                        <ReplyForwardComposer
                            email={replyForwardState.sourceEmail}
                            type={replyForwardState.type!}
                            onClose={closeReplyForward}
                            onEmailSent={handleEmailReplyForward}
                            onPendingReply={handlePendingReply}
                        />
                    </Suspense>
                )}
            </div>

            {/* Thread Emails */}
            {(threadEmails.length > 0 || pendingReplies.length > 0) &&
                <div className="thread-email" id="threadEmailsSection">
                    <Suspense fallback={null}>
                        {threadEmails.map((threadEmail, index) => (
                            <ThreadEmailItem
                                key={threadEmail.messageId}
                                email={threadEmail}
                                index={index}
                                onEmailSent={handleEmailReplyForward}
                                onPendingReply={handlePendingReply}
                            />
                        ))}
                        {pendingReplies.map((reply, index) => (
                            <PendingThreadEmailItem
                                key={reply.clientMessageId}
                                reply={reply}
                                index={threadEmails.length + index}
                            />
                        ))}
                    </Suspense>
                </div>
            }

        </div >
    );
};

export default EmailDetail;
