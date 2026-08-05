import { memo } from "react";
import attachmentRoundIcon from "@images/attachment-stroke-rounded-icon.svg";
import mailIcon from "@images/mail-icon.svg";
import mailIconHover from "@images/mail-icon-hover.svg";
import envelopOpenIcon from "@images/envelope-open-icon.svg";
import envelopOpenIconHover from "@images/envelope-open-icon-hover.svg";
import trashIcon from "@images/trash-icon.svg";
import trashIconHover from "@images/trash-icon-hover.svg";
import eventIcon from "@images/event-icon.svg";
import AttachmentList from "@components/ui/email/AttachmentList";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { verifyBoxName } from "@utils/emailUtil";
import { useMailData, useMailSelection } from "../../context/index";

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

export interface EmailDetail {
    _id: string;
    messageId: string;
    uid: number;
    subject: string;
    date: string;
    from: string[];
    to: string[];
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
    const { boxName } = useMailData();
    let emailNameOrEmail = email.from?.[0] ?? "Unknown";
    if (verifyBoxName(boxName, 'draft') || verifyBoxName(boxName, 'sent')) {
        const recipients = email.to;
        emailNameOrEmail = recipients && recipients.length
            ? recipients.join(', ')
            : 'No Recipients';
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

    return (
        <tr
            data-id={email._id}
            data-uid={email.uid}
            data-message-id={isScheduled ? email._id : email.messageId}
            data-thread-id={isScheduled ? email._id : email.threadId}
        >
            <td>
                <div
                    className={`mail-message-list ${isRead ? "mail-message-read" : ""} ${isActive ? "mail-message-active" : ""}`}
                    onClick={() => onOpenEmail(email.uid, email.messageId, isSearch, email._id)}
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
                                    { /* Thread Count */}
                                    <div className="d-flex align-items-center">
                                        <div className="mail-received-name mb-0">{emailNameOrEmail}</div>
                                        {!verifyBoxName(boxName, 'trash') && email.threadCount > 1 && (
                                            <span className="badge thread-badge">
                                                {email.threadCount}
                                            </span>
                                        )}
                                    </div>

                                    { /* Date */}
                                    <div className="d-flex align-items-center justify-content-end" style={{ minWidth: "93px" }}>
                                        <a href="#" className="d-flex align-items-center justify-content-center me-2 event-icon-mail-box">
                                            <img className="d-none" style={{ minWidth: "20px" }} src={eventIcon} alt="" />
                                        </a>
                                        <div className="mail-received-date d-flex align-items-center justify-content-end"> {emailDate} </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between c-mb-2">
                                    <div className="mail-received-subject">
                                        {email.subject || ""}
                                    </div>
                                    {safeAttachments.length > 0 && (
                                        <a href="#"
                                            className="hover-link d-inline-flex align-items-center justify-content-end"
                                        >
                                            <img src={attachmentRoundIcon} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {safeAttachments.length > 0 && (
                        <div className="mail-received-attachment-box d-flex align-items-center">
                            <AttachmentList attachments={safeAttachments} maxVisible={2} />
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
            </td>
        </tr>
    );
});

export default memo(EmailRow);



