import BaseModal from '@components/ui/BaseModal';
import EmailBody from '@components/ui/email/EmailBody';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import { adminGetOutsideMailEmail } from '@services/adminService/adminService';
import { useEffect, useState } from 'react';

export interface OutsideMailPreview {
    id: string;
    from: string;
    to: string;
    cc: string;
    bcc: string;
    subject: string;
    outsideDomain: string;
    outsideAddresses: string[];
    date: string | null;
    body: string;
    bodyText: string;
}

interface OutsideMailDialogProps {
    userId: string;
    email: OutsideMailPreview;
    onClose: () => void;
}

const textValue = (value: unknown): string => (typeof value === 'string' ? value : '');

const looksLikeHtml = (value: string): boolean => /<\/?[a-z][\s\S]*>/i.test(value);

const formatMailDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(date);
};

const readDetail = (response: any): Partial<OutsideMailPreview> | null => {
    if (response?.statusCode && response.statusCode !== 200) return null;
    const payload = response?.data ?? {};
    const raw = payload.email ?? payload.message ?? payload;
    if (!raw || typeof raw !== 'object') return null;
    const outsideAddresses = Array.isArray(raw.outsideAddresses)
        ? raw.outsideAddresses.filter((address: unknown): address is string => typeof address === 'string' && address.trim() !== '')
        : undefined;
    return {
        from: textValue(raw.from),
        to: textValue(raw.to),
        cc: textValue(raw.cc),
        bcc: textValue(raw.bcc),
        subject: textValue(raw.subject),
        outsideDomain: textValue(raw.outsideDomain),
        outsideAddresses,
        date: typeof raw.date === 'string' && raw.date ? raw.date : undefined,
        body: textValue(raw.body ?? raw.html ?? raw.bodyHtml ?? raw.htmlBody),
        bodyText: textValue(raw.bodyText ?? raw.text ?? raw.textBody ?? raw.plainText),
    };
};

const mergeDetail = (current: OutsideMailPreview, detail: Partial<OutsideMailPreview>): OutsideMailPreview => ({
    ...current,
    from: detail.from || current.from,
    to: detail.to || current.to,
    cc: detail.cc || current.cc,
    bcc: detail.bcc || current.bcc,
    subject: detail.subject || current.subject,
    outsideDomain: detail.outsideDomain || current.outsideDomain,
    outsideAddresses: detail.outsideAddresses?.length ? detail.outsideAddresses : current.outsideAddresses,
    date: detail.date || current.date,
    body: detail.body || current.body,
    bodyText: detail.bodyText || current.bodyText,
});

const Field = ({ label, value }: { label: string; value: string }) => {
    if (!value.trim()) return null;
    return (
        <div className="admin-outside-mail-dialog__row">
            <span className="admin-outside-mail-dialog__label">{label}</span>
            <span className="admin-outside-mail-dialog__value">{value}</span>
        </div>
    );
};

const OutsideMailDialog = ({ userId, email, onClose }: OutsideMailDialogProps) => {
    const [message, setMessage] = useState(email);
    const [loadingBody, setLoadingBody] = useState(!email.body && !email.bodyText);
    const [bodyError, setBodyError] = useState('');

    useEffect(() => {
        setMessage(email);
        if (email.body || email.bodyText) {
            setLoadingBody(false);
            setBodyError('');
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoadingBody(true);
            setBodyError('');
            try {
                const response = await adminGetOutsideMailEmail(userId, email.id);
                if (cancelled) return;
                const detail = readDetail(response);
                if (!detail) {
                    setBodyError(
                        response?.data?.error
                        || response?.data?.message
                        || response?.message
                        || 'The message body could not be loaded.'
                    );
                    return;
                }
                setMessage((current) => mergeDetail(current, detail));
            } catch (error) {
                console.error('Failed to load outside mail email', error);
                if (!cancelled) setBodyError('The message body could not be loaded.');
            } finally {
                if (!cancelled) setLoadingBody(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [email, userId]);

    const htmlBody = message.body && looksLikeHtml(message.body) ? message.body : '';
    const plainBody = message.bodyText || (!htmlBody ? message.body : '');

    return (
        <BaseModal
            isOpen
            onClose={onClose}
            zIndex={1060}
            closeOnBackdrop
            closeOnEsc
            draggable
            showBackdrop
            dragHandleSelector=".drag-handle"
            width="min(100vw, 1100px)"
            maxWidth="95vw"
        >
            <div className="admin-outside-mail-dialog">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header drag-handle">
                            <button type="button" className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
                                <InteractiveIcon
                                    defaultIcon={arrowPointingOutIcon}
                                    hoverIcon={arrowPointingOutIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Move"
                                />
                            </button>
                            <h5 className="modal-title modal-title-center" title={message.subject || 'Email'}>
                                {message.subject || '(No subject)'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close hover-link btn icon-hover-effect"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <InteractiveIcon
                                    defaultIcon={closeIcon}
                                    hoverIcon={closeIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Close"
                                />
                            </button>
                        </div>
                        <div className="modal-body admin-outside-mail-dialog__body-wrap">
                            <Field label="Subject" value={message.subject || '(No subject)'} />
                            <Field label="From" value={message.from} />
                            <Field label="To" value={message.to} />
                            <Field label="Cc" value={message.cc} />
                            <Field label="Bcc" value={message.bcc} />
                            <Field label="Date" value={formatMailDate(message.date)} />
                            <Field label="Domain" value={message.outsideDomain} />
                            <div className="admin-outside-mail-dialog__message">
                                {loadingBody ? (
                                    <p className="admin-outside-mail-dialog__status">Loading email…</p>
                                ) : htmlBody ? (
                                    <EmailBody html={htmlBody} />
                                ) : plainBody ? (
                                    <p className="admin-outside-mail-dialog__plain">{plainBody}</p>
                                ) : (
                                    <p className="admin-outside-mail-dialog__status">
                                        {bodyError || 'This email has no message body.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
};

export default OutsideMailDialog;
