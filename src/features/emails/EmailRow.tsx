import { memo } from "react";
import attachmentRoundIcon from "@images/attachment-stroke-rounded-icon.svg";
import mailIcon from "@images/mail-icon.svg";
import mailIconHover from "@images/mail-icon-hover.svg";
import envelopOpenIcon from "@images/envelope-open-icon.svg";
import envelopOpenIconHover from "@images/envelope-open-icon-hover.svg";
import trashIcon from "@images/trash-icon.svg";
import trashIconHover from "@images/trash-icon-hover.svg";
import eventIcon from "@images/event-icon.svg";
import aiLabelsIcon from "@images/ai-labels-icon.svg";
import AttachmentList from "@components/ui/email/AttachmentList";
import EmailSummaryPopover from "@components/ui/email/EmailSummaryPopover";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useEmailSummaryHover } from "@hooks/useEmailSummaryHover";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { getParticipantsLabel, getSenderLabel, verifyBoxName } from "@utils/emailUtil";
import { useSettings } from "@context/SettingsContext";
import { useMailData, useMailSelection } from "../../context/index";
import type { CalendarInvite } from "@models/Email";

interface EmailRowProps {
    email: EmailDetail;
    isRead: boolean;
    isSelected: boolean;
    isActive: boolean;
    isSearch: boolean;
    isScheduled?: boolean;
    boxName: string;
    index: number;
    emails: EmailDetail[];
    onOpenEmail: (uid: number, messageId: string, isSearch: boolean, mongoId?: string) => void;
    onMarkReadUnread: (messageIds: string[], markAsRead: boolean) => void;
    onDelete: (messageIds: string[], isDraftEmail: boolean) => void;
    onToggleSelection: (messageId: string) => void;
}

/** List payloads may be legacy string[] or `{ email, name }[]`. */
export type ListMailboxParticipant = string | { email?: string; name?: string; address?: string };

export interface EmailDetail {
    _id: string;
    messageId: string;
    uid: number;
    subject: string;
    date: string;
    from: ListMailboxParticipant[];
    to: ListMailboxParticipant[];
    attachments: any;
    threadCount: number;
    threadId: string;
    isDeleted: boolean;
    body?: string;
    bodyText?: string;
    relativeDate?: {
        value: string;
        isOld: boolean;
    };
    calendarInvite?: CalendarInvite | null;
    /** AI-applied label names from the backend labeling pipeline. */
    aiLabels?: Array<string | { name?: string }>;
}

const EmailRow = memo(({
    email,
    isRead,
    isSelected,
    isActive, 
    isSearch,
    isScheduled = false,
    index,
    emails,
    onOpenEmail,
    onMarkReadUnread,
    onDelete,
    onToggleSelection: _onToggleSelection,
}: EmailRowProps) => {
    const { boxName, userPermissions } = useMailData();
    const { settings } = useSettings();
    let emailNameOrEmail = getSenderLabel(email.from) || "Unknown";
    if (verifyBoxName(boxName, 'draft') || verifyBoxName(boxName, 'sent')) {
        emailNameOrEmail = getParticipantsLabel(email.to) || 'No Recipients';
    }
    const emailDate = formatDate(email.date, TimeFormat.MONTH_DAY)
    const { toggleEmailSelection, toggleEmailSelectionWithShift, setLastSelectedIndex } = useMailSelection();
    const { activeEmailMessageId } = useMailData();
    isActive = activeEmailMessageId === (isScheduled ? email._id : email.messageId);
    const safeAttachments = email.attachments
        ? Array.isArray(email.attachments)
            ? email.attachments
            : email.attachments.attachments || []
        : [];
    const showThreadCount =
        settings.threadView &&
        !verifyBoxName(boxName, 'trash') &&
        email.threadCount > 1;

    const aiLabelNames = (email.aiLabels ?? [])
        .map((label) => (typeof label === 'string' ? label.trim() : label?.name?.trim() || ''))
        .filter(Boolean);

    const summaryMessageId = isScheduled ? undefined : email.messageId;
    const summaryEnabled = Boolean(userPermissions?.aiFeatures && summaryMessageId);
    const {
        open: summaryOpen,
        isLoading: summaryLoading,
        points: summaryPoints,
        error: summaryError,
        anchorEl: summaryAnchorEl,
        rowRef: summaryRowRef,
        isHoverDevice,
        onRowMouseEnter: onSummaryMouseEnter,
        onRowMouseLeave: onSummaryMouseLeave,
        onPopoverMouseEnter: onSummaryPopoverEnter,
        onPopoverMouseLeave: onSummaryPopoverLeave,
        onRowTouchStart: onSummaryTouchStart,
        onRowTouchMove: onSummaryTouchMove,
        onRowTouchEnd: onSummaryTouchEnd,
        onRowTouchCancel: onSummaryTouchCancel,
        onRowContextMenu: onSummaryContextMenu,
        shouldSuppressClickAfterLongPress,
        close: closeSummary,
    } = useEmailSummaryHover({
        enabled: summaryEnabled,
        messageId: summaryMessageId,
        boxName,
        isActive,
    });

    const handleOpenEmail = () => {
        closeSummary();
        onOpenEmail(email.uid, email.messageId, isSearch, email._id);
    };

    const handleRowClick = () => {
        // Touch devices: long-press opens summary; suppress the click that follows it.
        if (summaryEnabled && !isHoverDevice && shouldSuppressClickAfterLongPress()) {
            return;
        }
        handleOpenEmail();
    };

    return (
        <tr
            data-id={email._id}
            data-uid={email.uid}
            data-message-id={isScheduled ? email._id : email.messageId}
            data-thread-id={isScheduled ? email._id : email.threadId}
        >
            <td>
                <div
                    ref={summaryRowRef}
                    className={`mail-message-list ${isRead ? "mail-message-read" : ""} ${isActive ? "mail-message-active" : ""}${summaryLoading ? " mail-message-list--summary-preparing" : ""}`}
                    aria-busy={summaryLoading || undefined}
                    onClick={handleRowClick}
                    onMouseEnter={onSummaryMouseEnter}
                    onMouseLeave={onSummaryMouseLeave}
                    onTouchStart={onSummaryTouchStart}
                    onTouchMove={onSummaryTouchMove}
                    onTouchEnd={onSummaryTouchEnd}
                    onTouchCancel={onSummaryTouchCancel}
                    onContextMenu={onSummaryContextMenu}
                >
                    <div className="mail-received-first">
                        <div className="d-flex align-items-start">
                            {/* Checkbox */}
                            <div className="mail-received-check-btn" onMouseDown={(e) => {
                                e.stopPropagation();
                                // Prevent text selection when shift+clicking
                                if ((e.nativeEvent as any).shiftKey) {
                                    e.preventDefault();
                                    window.getSelection()?.removeAllRanges();
                                }
                            }} onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                            }}>
                                <div className="checkbox-custom table-check">
                                    <input
                                        className="list-child list-child-maillist"
                                        type="checkbox"
                                        id={`checkBox${email.messageId}`}
                                        value={isScheduled ? email._id : email.messageId}
                                        name="checkbox"
                                        checked={isSelected}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(event) => {
                                            // Only toggle selection here; propagation is already stopped on click
                                            if ((event.nativeEvent as any).shiftKey) {
                                                // Prevent text selection when shift-clicking
                                                event.preventDefault();
                                                window.getSelection()?.removeAllRanges();
                                                toggleEmailSelectionWithShift(email.messageId, emails as any);
                                            } else {
                                                toggleEmailSelection(email.messageId);
                                                setLastSelectedIndex(index);
                                            }
                                        }}
                                    />
                                    <label
                                        onClick={(e) => e.stopPropagation()}
                                        htmlFor={`checkBox${email.messageId}`}
                                        className="label-text"
                                    />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="mail-received-info-details-box w-100">
                                <div className="d-flex align-items-center justify-content-between c-mb-2">
                                    { /* Thread Count / AI summary preparing label */}
                                    <div className="d-flex align-items-center">
                                        {summaryLoading ? (
                                            <div className="mail-received-name mail-received-summary-label mb-0">
                                                <img
                                                    src={aiLabelsIcon}
                                                    alt=""
                                                    width={16}
                                                    height={16}
                                                    className="mail-received-summary-label__icon"
                                                    aria-hidden="true"
                                                />
                                                <span>Summary</span>
                                            </div>
                                        ) : (
                                            <div className="mail-received-name mb-0">{emailNameOrEmail}</div>
                                        )}
                                        {!summaryLoading && showThreadCount && (
                                            <span className="badge thread-badge">
                                                {email.threadCount}
                                            </span>
                                        )}
                                    </div>

                                    { /* Date */}
                                    <div className="d-flex align-items-center justify-content-end" style={{ minWidth: "93px" }}>
                                        {email.calendarInvite && (
                                            <a href="#" className="d-flex align-items-center justify-content-center me-2 event-icon-mail-box" onClick={(e) => e.preventDefault()}>
                                                <img style={{ minWidth: "20px" }} src={eventIcon} alt="Calendar invite" />
                                            </a>
                                        )}
                                        <div className="mail-received-date d-flex align-items-center justify-content-end"> {emailDate} </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between c-mb-2">
                                    <div className={`mail-received-subject-row${summaryLoading ? " mail-received-subject--summary-blur" : ""}`}>
                                        <div className="mail-received-subject">
                                            {email.subject || ""}
                                        </div>
                                        {aiLabelNames.length > 0 && (
                                            <div className="mail-received-ai-labels">
                                                {aiLabelNames.map((labelName) => (
                                                    <span
                                                        key={labelName}
                                                        className="mail-received-ai-label"
                                                        title={labelName}
                                                    >
                                                        {labelName}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {safeAttachments.length > 0 && (
                                        <a
                                            href="#"
                                            className={`hover-link d-inline-flex align-items-center justify-content-end${summaryLoading ? " mail-received-attach-icon--summary-hidden" : ""}`}
                                            aria-hidden={summaryLoading || undefined}
                                        >
                                            <img src={attachmentRoundIcon} alt="" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {safeAttachments.length > 0 && (
                        <div className="mail-received-attachment-box d-flex align-items-center">
                            <AttachmentList attachments={safeAttachments} bodyHtml={email.body} maxVisible={2} />
                        </div>
                    )}

                    {/* Hover buttons */}
                    <div className="mail-received-hover-btn justify-content-end">
                        <div className="mail-received-hover-btn-sub">
                            <div className="d-flex" onClick={(e) => e.stopPropagation()}>
                                {/* Mark Read/Unread - Single element to prevent tooltip traveling */}
                                <a
                                    className="hover-link align-items-center mail-received-hover-btn-link"
                                    title={isRead ? "Mark as unread" : "Mark as read"}
                                    onClick={() =>
                                        onMarkReadUnread([email.messageId], !isRead)
                                    }
                                >
                                    <InteractiveIcon
                                        defaultIcon={isRead ? mailIcon : envelopOpenIcon}
                                        hoverIcon={isRead ? mailIconHover : envelopOpenIconHover}
                                        activeIcon={isRead ? mailIcon : envelopOpenIcon}
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip={isRead ? "Mark as unread" : "Mark as read"}
                                    />
                                </a>

                                {/* Delete */}
                                <a
                                    className="hover-link mail-received-hover-btn-link"
                                    title="Delete"
                                    onClick={() =>
                                        onDelete([email.messageId], verifyBoxName(boxName, 'draft'))
                                    }
                                >
                                    <InteractiveIcon
                                        defaultIcon={trashIcon}
                                        hoverIcon={trashIconHover}
                                        activeIcon={trashIcon}
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Delete"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                {summaryEnabled && (
                    <EmailSummaryPopover
                        open={summaryOpen}
                        anchorEl={summaryAnchorEl}
                        isLoading={summaryLoading}
                        points={summaryPoints}
                        error={summaryError}
                        onMouseEnter={onSummaryPopoverEnter}
                        onMouseLeave={onSummaryPopoverLeave}
                        variant={isHoverDevice ? 'popover' : 'sheet'}
                        onClose={closeSummary}
                    />
                )}
            </td>
        </tr>
    );
});

export default memo(EmailRow);



