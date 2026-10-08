import { createElement, type MouseEvent as ReactMouseEvent } from 'react';
import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';
import mailspotIcon from '@images/mailspot-fevicon.svg';
import './movingEmailToast.css';

const baseOptions: ToastOptions = {
    position: 'bottom-left',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    pauseOnFocusLoss: false,
    transition: undefined
};

let toastsSuppressed = false;

/** Dismiss existing toasts and ignore new ones (used during auth redirect). */
const suppressAllToasts = () => {
    toastsSuppressed = true;
    toast.dismiss();
};

const showSuccess = (message: string, options?: ToastOptions) => {
    if (toastsSuppressed) return;
    toast.success(message, { ...baseOptions, ...options });
};

const showError = (message: string, options?: ToastOptions) => {
    if (toastsSuppressed) return;
    toast.error(message, { ...baseOptions, ...options });
};

const showInfo = (message: string, options?: ToastOptions) => {
    if (toastsSuppressed) return undefined;
    return toast.info(message, { ...baseOptions, ...options });
};

/** Persistent progress toast with bouncing MailSpot logo (draft save, folder moves, etc.). */
const showProgressToast = (message: string) => {
    if (toastsSuppressed) return undefined;
    return toast.info(
        createElement(
            'div',
            { className: 'moving-email-toast' },
            createElement(
                'div',
                { className: 'moving-email-toast__logo', 'aria-hidden': true },
                createElement('img', {
                    src: mailspotIcon,
                    alt: '',
                    className: 'moving-email-toast__icon',
                })
            ),
            createElement('span', null, message)
        ),
        {
            ...baseOptions,
            autoClose: false,
            closeOnClick: false,
            icon: false,
            className: 'moving-email-toast-container',
        }
    );
};

/** Persistent progress toast shown while mail is moving between IMAP and local folders. */
const showMovingEmailToast = (folderDisplayName: string) =>
    showProgressToast(`Moving to ${folderDisplayName}...`);

const dismissToast = (toastId?: string | number) => {
    if (toastId == null) return;
    toast.dismiss(toastId);
};

const showWarning = (message: string, options?: ToastOptions) => {
    if (toastsSuppressed) return;
    toast.warning(message, { ...baseOptions, ...options });
};

const clearAllToasts = () => {
    toast.dismiss();
};

export type OutboundSendFailedToastOptions = {
    error: string;
    permanent?: boolean;
    onReconnect?: () => void;
};

/** Error toast for outbound SMTP failure; optional Reconnect CTA when permanent. */
const showOutboundSendFailedToast = ({
    error,
    permanent,
    onReconnect,
}: OutboundSendFailedToastOptions) => {
    if (toastsSuppressed) return;
    const message = error?.trim() || 'Failed to send email. Please try again.';

    if (!permanent || !onReconnect) {
        showError(message, { autoClose: 6000 });
        return;
    }

    toast.error(
        createElement(
            'div',
            { className: 'outbound-send-failed-toast' },
            createElement('div', { className: 'outbound-send-failed-toast__msg' }, message),
            createElement(
                'button',
                {
                    type: 'button',
                    className: 'btn btn-new outbound-send-failed-toast__cta',
                    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onReconnect();
                        toast.dismiss();
                    },
                },
                'Reconnect / Check account'
            )
        ),
        {
            ...baseOptions,
            autoClose: 10000,
            closeOnClick: false,
        }
    );
};

export {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showProgressToast,
    showMovingEmailToast,
    showOutboundSendFailedToast,
    dismissToast,
    clearAllToasts,
    suppressAllToasts,
};
