import EmailBody from '@components/ui/email/EmailBody';
import type { PendingReply } from '@models/PendingReply';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import moment from 'moment';

interface PendingThreadEmailItemProps {
    reply: PendingReply;
    index: number;
}

const isDateInCurrentWeek = (date: Date | string | number): boolean => {
    const emailDate = moment(date);
    const now = moment();
    const startOfWeek = now.clone().startOf('week');
    const endOfWeek = now.clone().endOf('week');
    return emailDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
};

const PendingThreadEmailItem = ({ reply, index }: PendingThreadEmailItemProps) => {
    const initial = (reply.fromName || reply.fromEmail || 'U').charAt(0).toUpperCase();
    const isPending = reply.status === 'pending';
    const isFailed  = reply.status === 'failed';
    const isSent    = reply.status === 'sent';

    const rootClass = [
        'accordion-item pb-0 open thread-email-pending',
        isFailed ? 'thread-email-failed' : '',
        isSent   ? 'thread-email-sent'   : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={rootClass}
            id={`pending-thread-${index}`}
            data-message-id={reply.clientMessageId}
            data-pending={isPending ? 'true' : undefined}
        >
            <h2 className="accordion-header">
                <div className="accordion-button custom-toggle-btn" style={{ cursor: 'default' }}>
                    <div className="mail-message-send--information-details-box w-100 mb-0">
                        <div className="d-block mb-3">
                            <div className="mail-details-information-details-box d-flex align-items-start justify-content-between">
                                <div className="d-flex align-items-center justify-content-between position-relative profile-main-box">
                                    <span className="label-sm thread-label-text">From</span>
                                    <div className="d-flex align-items-center profile-section">
                                        <span className={`mail-profile-label ms-0${isPending ? ' pending-profile-label' : ''}`}>
                                            {initial}
                                        </span>
                                        <div className="d-block">
                                            <span className="mail-profile-name d-block">
                                                {reply.fromName || reply.fromEmail}
                                            </span>
                                            <span className="mail-profile-id d-block">
                                                {reply.fromEmail}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-end">
                                    <span className="info-received-details d-block mb-1">
                                        {isDateInCurrentWeek(reply.sentAt)
                                            ? formatDate(reply.sentAt, TimeFormat.CALENDAR_SEARCH)
                                            : formatDate(reply.sentAt, TimeFormat.EMAIL_DETAIL_DATE)
                                        }
                                    </span>
                                    {/* Badge disappears once sent */}
                                    {(isPending || isFailed) && (
                                        <span className={`pending-status-badge${isFailed ? ' pending-status-badge--failed' : ''}`}>
                                            {isFailed
                                                ? (reply.errorMessage || 'Send failed')
                                                : 'Pending'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex align-items-end justify-content-between">
                                <div className="mail-details-information-details-box thread-mail-to-box align-items-center m-0">
                                    <span className="label-sm">To</span>
                                    <span className="mail-profile-id ms-2">
                                        {reply.toEmails.join(', ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </h2>

            {reply.bodyPreview && (
                <div className="mt-3 custom-accordion-body-border">
                    <div className="horizontal-scroll-container mail-content-details-box">
                        <div className="horizontal-scroll-content">
                            <EmailBody html={reply.bodyPreview} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingThreadEmailItem;
