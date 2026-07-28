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
import chevronDownIcon from '@images/chevron-down-icon.svg';
import chevronDownIconHover from '@images/chevron-down-icon-hover.svg';
import chevronUpIcon from "@images/chevron-up-icon.svg";
import chevronUpIconHover from "@images/chevron-up-icon-hover.svg";
import type { Email } from "@models/Email";
import type { PendingReply } from "@models/PendingReply";
import type { Response } from "@models/Response";
import { cancelScheduledEmail, getScheduleEmail } from "@services/scheduleEmail/scheduleEmailService";
import { getAllThreadEmails } from "@services/threadEmail/threadEmailService";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { getEmailPreviewText, verifyBoxName } from "@utils/emailUtil";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMailData, useMailUI } from '../../context/index';
import { HighlightText } from "@components/ui/HighlightText";
import { useSocketEvent } from "@hooks/useSocket";
import { useSettings } from "@context/SettingsContext";

// Lazy loaded components
const ThreadEmailItem = lazy(() => import("@components/ui/threadEmail/ThreadEmailItem"));
const ReplyForwardComposer = lazy(() => import("@components/ui/ReplyForwardComposer"));
const PendingThreadEmailItem = lazy(() => import("@components/ui/threadEmail/PendingThreadEmailItem"));
const ThreadExpandDivider = lazy(() => import("@components/ui/threadEmail/ThreadExpandDivider"));

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

const EmailDetail = ({ email }: Props) => {
    const { downloadAttachments } = useAttachmentDownload();
    const { openModal } = useMailUI();
    const { emails, setEmails, emailDetailSelected, setEmailDetailSelected, pagination, setPagination, setActiveEmailMessageId, boxName, updateBoxCount, searchTerm, allSearchResult } = useMailData()
    const { replyForwardState, openReplyForward, closeReplyForward } = useReplyForward();
    const { contentRef, scrollbarRef, thumbRef } = useHorizontalScrollbar()
    const [threadEmails, setThreadEmails] = useState<any[]>([]);
    const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([]);
    const [isThreadExpanded, setIsThreadExpanded] = useState(false);
    // Collapse immediately when opening a known multi-message thread so the root
    // body never flashes open before fetch-threadEmails finishes.
    const [isRootOpen, setIsRootOpen] = useState(() => !((email.threadCount ?? 0) > 1));
    const [autoOpenMessageId, setAutoOpenMessageId] = useState<string | null>(null);
    const prevAutoOpenRef = useRef<string | null>(null);
    const { settings } = useSettings();
    const { isDesktop } = useScreen();
    const [isCcBccExpanded, setIsCcBccExpanded] = useState(false);
    const [toVisibleInfo, setToVisibleInfo] = useState({ visible: 0, total: 0 });

    const hasCc = email.cc?.length > 0;
    const hasBcc = email.bcc?.length > 0;
    const hasMore = hasCc || hasBcc;
    const hasHiddenTo = toVisibleInfo.total > toVisibleInfo.visible;
    const toReserveWidth = !isCcBccExpanded && hasMore ? 32 : 0;

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

    const fromAddr = email.from?.[0];
    const fromEmail = fromAddr?.email || "";
    const fromName = fromAddr?.name || fromEmail.split("@")[0] || fromEmail;
    const initial = fromName.charAt(0).toUpperCase();

    const emailDate = formatDate(email.date, TimeFormat.EMAIL_DETAIL_DATE);
    const highlightTerm = email.isSearchEmail || allSearchResult ? searchTerm : "";
    const openAttachment = (customFileName: string, filename: string) => {
        downloadAttachments('single', customFileName, filename, email.messageId);
    };

    const isScheduleBox = useMemo(() => verifyBoxName(boxName, 'scheduled'), [boxName]);

    // Keep a live ref so loadThreadEmails stays stable when we promote the root
    // (messageId changes) and does not retrigger the fetch effect.
    const emailRef = useRef(email);
    emailRef.current = email;

    const lastThreadFetchRef = useRef<{ threadId: string; threadCount: number } | null>(null);

    const loadThreadEmails = useCallback(async () => {
        const current = emailRef.current;
        try {
            const response = await getAllThreadEmails({
                messageId: current.messageId,
                threadId: current.threadId
            });
            const siblings = response.data.threadEmails || [];

            // Keep get-single-email result as the root/first message.
            // Only append other thread messages below it (oldest → newest).
            // Re-sorting the opened email into the sibling list was demoting the
            // root to near the end when dates disagreed across the two APIs.
            const byId = new Map<string, any>();
            for (const item of siblings) {
                if (item?.messageId && item.messageId !== current.messageId) {
                    byId.set(item.messageId, item);
                }
            }
            const rest = [...byId.values()].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            const nextCount = rest.length + 1;
            lastThreadFetchRef.current = {
                threadId: current.threadId,
                threadCount: nextCount,
            };

            // Keep the opened get-single-email message as root; only refresh count.
            if ((current.threadCount ?? 0) !== nextCount) {
                setEmailDetailSelected({
                    ...current,
                    threadCount: nextCount,
                    isSearchEmail: current.isSearchEmail,
                });
            }

            setThreadEmails(rest);
            setPendingReplies([]);
        } catch (error) {
            console.error('Error loading thread emails:', error);
        }
    }, [setEmailDetailSelected]);

    const listThreadCount = emails.find(e => e.threadId === email.threadId)?.threadCount ?? 0;
    const expectedThreadCount = Math.max(
        email.threadCount ?? 0,
        emailDetailSelected?.threadCount ?? 0,
        listThreadCount
    );
    const isExcludedThreadBox = verifyBoxName(boxName, 'schedule') || verifyBoxName(boxName, 'trash');
    // Known multi-message thread (from list/detail count) — used to avoid opening the
    // root body before siblings arrive, which caused an open→close UI flash.
    const expectsThreadReplies = expectedThreadCount > 1
        && !isExcludedThreadBox
        && !emailDetailSelected?.isSearchEmail
        && settings.threadView;

    useEffect(() => {
        if (!expectsThreadReplies) {
            setThreadEmails([]);
            lastThreadFetchRef.current = null;
            return;
        }

        const threadCount = expectedThreadCount;
        const prev = lastThreadFetchRef.current;
        // Same thread + same count → skip (covers count-only updates after load)
        if (prev && prev.threadId === email.threadId && prev.threadCount === threadCount) {
            return;
        }

        lastThreadFetchRef.current = { threadId: email.threadId, threadCount };
        // Clear only when switching threads — avoids a blank flash on count bumps
        if (prev?.threadId !== email.threadId) {
            setThreadEmails([]);
        }
        loadThreadEmails();
    }, [loadThreadEmails, email.threadId, expectsThreadReplies, expectedThreadCount]);

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

    const handleThreadEmailRemoved = useCallback((removedMessageId: string) => {
        setThreadEmails(prev => {
            const nextThreadEmails = prev.filter(e => e.messageId !== removedMessageId);
            const nextCount = nextThreadEmails.length + 1;

            setEmails(prevEmails =>
                prevEmails.map(e =>
                    e.threadId === email.threadId
                        ? { ...e, threadCount: nextCount }
                        : e
                )
            );

            return nextThreadEmails;
        });

        if (emailDetailSelected?.threadId === email.threadId) {
            setEmailDetailSelected({
                ...emailDetailSelected,
                threadCount: Math.max(1, (emailDetailSelected.threadCount ?? 1) - 1),
            });
        }
    }, [email.threadId, emailDetailSelected, setEmailDetailSelected, setEmails]);

    // Called by socket 'outboundReplySent' — flip row from pending → sent (light → full opacity)
    const clearPendingReply = useCallback((clientMessageId: string) => {
        setPendingReplies(prev =>
            prev.map(r =>
                r.clientMessageId === clientMessageId
                    ? { ...r, status: 'sent' as const }
                    : r
            )
        );
        loadThreadEmails();
    }, [loadThreadEmails]);

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

    // Clear pending rows / collapse state when switching to a different thread
    useEffect(() => {
        setPendingReplies([]);
        setIsThreadExpanded(false);
        setIsCcBccExpanded(false);
        setAutoOpenMessageId(null);
        prevAutoOpenRef.current = null;
        // Collapse root immediately for known threads so the body never flashes open
        setIsRootOpen(!expectsThreadReplies);
    }, [email.threadId, expectsThreadReplies]);

    // Gmail-style collapse: with >4 messages show first + second-last + last only.
    // Main detail is always the first; threadEmails holds the rest (oldest → newest).
    const THREAD_COLLAPSE_THRESHOLD = 4;
    const totalThreadCount = 1 + threadEmails.length;
    const shouldCollapseThread = !isThreadExpanded && totalThreadCount > THREAD_COLLAPSE_THRESHOLD;
    const hiddenThreadCount = shouldCollapseThread ? totalThreadCount - 3 : 0;
    const visibleThreadEmails = useMemo(() => {
        if (!shouldCollapseThread) return threadEmails;
        // Keep only second-last and last of the full thread (= last 2 of threadEmails)
        return threadEmails.slice(-2);
    }, [shouldCollapseThread, threadEmails]);

    const hasThreadReplies = threadEmails.length > 0 || pendingReplies.length > 0;
    // While a thread is loading, treat root as collapsed so the full body doesn't flash
    const isRootExpanded = !expectsThreadReplies || isRootOpen;
    const canToggleRoot = expectsThreadReplies || hasThreadReplies;

    // In a thread, keep the root collapsed and expand only the newest reply
    // (including when a new reply arrives while this thread is open).
    useEffect(() => {
        if (threadEmails.length === 0) {
            if (prevAutoOpenRef.current !== null) {
                prevAutoOpenRef.current = null;
                setAutoOpenMessageId(null);
            }
            // Don't reopen root while we still expect thread siblings to load
            if (!expectsThreadReplies) {
                setIsRootOpen(true);
            }
            return;
        }

        const newest = threadEmails[threadEmails.length - 1];
        const nextId = newest?.messageId ?? null;

        if (prevAutoOpenRef.current !== nextId) {
            prevAutoOpenRef.current = nextId;
            setAutoOpenMessageId(nextId);
            setIsRootOpen(false);
        }
    }, [threadEmails, expectsThreadReplies]);

    const toggleRootOpen = () => {
        if (!canToggleRoot) return;
        setIsRootOpen(prev => {
            if (prev) setIsCcBccExpanded(false);
            return !prev;
        });
    };

    // Socket: reply confirmed → resolve pending row
    useSocketEvent('outboundReplySent', (data: { clientMessageId: string }) => {
        clearPendingReply(data.clientMessageId);
    });

    // Socket: reply failed → mark pending row as failed
    useSocketEvent('outboundReplyFailed', (data: { clientMessageId: string; error?: string }) => {
        markPendingReplyFailed(data.clientMessageId, data.error);
    });

    // Socket: inbound reply for the currently open thread → append it live
    const handleInboundThreadReply = useCallback((payload: any) => {
        const replies: Email[] = Array.isArray(payload)
            ? payload
            : (payload?.emails ?? (payload ? [payload] : []));

        const matchesOpenThread = replies.some(
            e => e?.threadId && e.threadId === email.threadId
        );
        if (!matchesOpenThread) return;

        // Keep the thread section visible by bumping the open detail's count
        const current = emailDetailSelected ?? email;
        if (current.threadId === email.threadId) {
            setEmailDetailSelected({
                ...current,
                threadCount: (current.threadCount ?? 1) + 1,
            });
        }
        loadThreadEmails();
    }, [email, emailDetailSelected, setEmailDetailSelected, loadThreadEmails]);

    useSocketEvent('newEmail', handleInboundThreadReply);
    useSocketEvent('threadReply', handleInboundThreadReply);

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
                <div
                    className={`mail-message-send--information-details-box ${canToggleRoot ? 'thread-root-header' : ''}`}
                    role={canToggleRoot ? 'button' : undefined}
                    tabIndex={canToggleRoot ? 0 : undefined}
                    onClick={canToggleRoot ? toggleRootOpen : undefined}
                    onKeyDown={canToggleRoot ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleRootOpen();
                        }
                    } : undefined}
                >
                    <div className="d-block">
                        <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
                            <div className="d-flex align-items-center justify-content-between position-relative profile-main-box">
                                {isRootExpanded && (
                                    <span className="label-sm">From</span>
                                )}
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
                                <div onClick={(e) => e.stopPropagation()}>
                                    <CopyEmail name={fromName} email={fromEmail} initial={initial} />
                                </div>
                            </div>

                            <span className="info-received-details d-block">
                                {emailDate}
                            </span>
                        </div>

                        <div className="d-flex align-items-end justify-content-between cc-bcc-to-info">
                            <div className="d-block" style={{ minWidth: 0, flex: 1 }}>
                                {/* To — only when root is expanded (or standalone) */}
                                {isRootExpanded && (
                                    <div className="mail-details-information-details-box d-flex align-items-start m-0" onClick={(e) => e.stopPropagation()}>
                                        <span className="label-sm flex-shrink-0">To</span>
                                        <div className="d-flex align-items-center flex-grow-1 tomail-list" style={{ minWidth: 0 }}>
                                            <EmailRecipientList
                                                emails={email.to}
                                                searchTerm={highlightTerm}
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

                                {/* CC */}
                                {isRootExpanded && isCcBccExpanded && email.cc.length > 0 && (
                                    <div className="mail-details-information-details-box d-flex align-items-start m-0" onClick={(e) => e.stopPropagation()}>
                                        <span className="label-sm flex-shrink-0">CC</span>
                                        <div className="d-flex align-items-center flex-grow-1 tomail-list" style={{ minWidth: 0 }}>
                                            <EmailRecipientList
                                                emails={email.cc}
                                                searchTerm={highlightTerm}
                                                reserveWidth={!hasBcc ? 32 : 0}
                                                trailingElement={!hasBcc ? <ToggleChevronButton /> : null}
                                                expanded
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* BCC */}
                                {isRootExpanded && isCcBccExpanded && email.bcc.length > 0 && (
                                    <div className="mail-details-information-details-box d-flex align-items-start m-0" onClick={(e) => e.stopPropagation()}>
                                        <span className="label-sm flex-shrink-0">BCC</span>
                                        <div className="d-flex align-items-center flex-grow-1 tomail-list" style={{ minWidth: 0 }}>
                                            <EmailRecipientList
                                                emails={email.bcc}
                                                searchTerm={highlightTerm}
                                                reserveWidth={32}
                                                trailingElement={<ToggleChevronButton />}
                                                expanded
                                            />
                                        </div>
                                    </div>
                                )}

                                {expectsThreadReplies && !isRootOpen && (
                                    <p className="shot-message-info-thread mb-0" style={{ display: "block" }}>
                                        {getEmailPreviewText(email)}
                                    </p>
                                )}
                            </div>
                            {/* Actions */}
                            {isRootExpanded && !isScheduleBox && (
                                <div className="application-btn-multi" id="emailActionsBtn" onClick={(e) => e.stopPropagation()}>
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

            {isScheduleBox && isRootExpanded && (
                <div className="schedule-info-box">
                    <div className="d-flex align-items-center">
                        <img src="images/scheduled-icon.svg" alt="" className="me-3" />
                        <p className="m-0 me-1">Send scheduled for</p>
                        <span>{formatDate(email.date, TimeFormat.SCHEDULE_DATE)}</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <a href="#" className="hover-link d-flex align-items-center me-2" onClick={() => handleEditScheduleEmail(email.id)}>
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
                        <a href="#" className="hover-link d-flex align-items-center" onClick={() => handleCancelScheduleEmail(email.id)}>
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
            {email.body && isRootExpanded && (
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
            {isRootExpanded && (
                <EmailDetailAttachmentPreview
                    attachments={email.attachments}
                    messageId={email.messageId}
                    remainingAttachments={email.remainingAttachments}
                    onDownloadAttachment={downloadAttachments}
                    onOpenAttachment={openAttachment}
                />
            )}

            {/* Bottom Reply/Forward — only for standalone emails.
                In a thread the root already has actions in its header, and
                each ThreadEmailItem has its own reply/forward controls. */}
            {!isScheduleBox && threadEmails.length === 0 && pendingReplies.length === 0 && (
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
            )}

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
                        {shouldCollapseThread && (
                            <ThreadExpandDivider
                                hiddenCount={hiddenThreadCount}
                                onExpand={() => setIsThreadExpanded(true)}
                            />
                        )}
                        {visibleThreadEmails.map((threadEmail, index) => (
                            <ThreadEmailItem
                                key={threadEmail.messageId}
                                email={threadEmail}
                                index={shouldCollapseThread ? (threadEmails.length - visibleThreadEmails.length + index) : index}
                                defaultOpen={threadEmail.messageId === autoOpenMessageId}
                                onEmailSent={handleEmailReplyForward}
                                onPendingReply={handlePendingReply}
                                onThreadEmailRemoved={handleThreadEmailRemoved}
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
        </div>
    );
};

export default EmailDetail;
