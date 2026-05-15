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
import { useMailSelection, useMailData } from "../../context/index";
import { verifyBoxName, normalizeMailboxList } from "@utils/emailUtil";

interface EmailRowProps {
    email: EmailDetail;
    isRead: boolean;
    isSelected: boolean;
    isSearch: boolean;
    isScheduled?: boolean;
    onOpenEmail: (uid: number, messageId: string, isSearch: boolean, mongoId?: string) => void;
    onMarkReadUnread: (
        messageIds: string[],
        markAsRead: boolean
    ) => void;
    onDelete: (messgaeIds: string[], isDraftEmail: boolean) => void;
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
    relativeDate?: {
        value: string;
        isOld: boolean;
    };
}

const EmailRow = ({
    email,
    isRead,
    isSelected,
    isSearch,
    isScheduled = false,
    onOpenEmail,
    onMarkReadUnread,
    onDelete
}: EmailRowProps) => {
    const { boxName } = useMailData();
    const fromStrings = normalizeMailboxList(email.from as unknown[]);
    let emailNameOrEmail = fromStrings[0] ?? "Unknown";
    if (verifyBoxName(boxName, 'draft') || verifyBoxName(boxName, 'sent')) {
        const recipientStrings = normalizeMailboxList(email.to as unknown[]);
        emailNameOrEmail = recipientStrings.length
            ? recipientStrings.join(', ')
            : 'No Recipients';
    }
    const emailDate = formatDate(email.date, TimeFormat.MONTH_DAY);
    const { toggleEmailSelection } = useMailSelection();
    const { activeEmailMessageId } = useMailData();
    const isActive = activeEmailMessageId === (isScheduled ? email._id : email.messageId);
    // email.attachments = email.attachments ? email.attachments : email.attachments.attachments;
    email.attachments = email.attachments?.attachments || email.attachments || [];

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
                    onClick={(e) => {
                        onOpenEmail(email.uid, email.messageId, isSearch, email._id)
                    }}
                >
                    <div className="mail-received-first" >
                        <div className="d-flex align-items-start">
                            {/* Checkbox */}
                            <div className="mail-received-check-btn" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => {
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
                                        onChange={() => {
                                            // Only toggle selection here; propagation is already stopped on click
                                            toggleEmailSelection(email.messageId);
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

                                        {email.threadCount > 1 && (
                                            <span className="badge thread-badge">
                                                {email.threadCount}
                                            </span>
                                        )}
                                    </div>

                                    { /* Date */}
                                    <div className="d-flex align-items-center justify-content-end" style={{ minWidth: "93px" }}>
                                        <a href="javascript:;" className="d-flex align-items-center justify-content-center me-2 event-icon-mail-box">
                                            <img className="d-none" style={{ minWidth: "20px" }} src={eventIcon} alt="" />
                                        </a>
                                        <div className="mail-received-date d-flex align-items-center justify-content-end"> {emailDate} </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between c-mb-2">
                                    <div className="mail-received-subject"> {email.subject} </div>
                                    {email.attachments.length > 0 && (
                                        <a href="javascript:;"
                                            className="hover-link d-inline-flex align-items-center justify-content-end"
                                        >
                                            <img src={attachmentRoundIcon} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {email.attachments.length > 0 && (
                        <div className="mail-received-attachment-box d-flex align-items-center">
                            <AttachmentList attachments={email.attachments} maxVisible={2} />
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
                                        onDelete([email.messageId], false)
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
};

export default EmailRow;
