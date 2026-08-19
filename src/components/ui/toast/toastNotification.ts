import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

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
    if (toastsSuppressed) return;
    toast.info(message, { ...baseOptions, ...options });
};

const showWarning = (message: string, options?: ToastOptions) => {
    if (toastsSuppressed) return;
    toast.warning(message, { ...baseOptions, ...options });
};

const clearAllToasts = () => {
    toast.dismiss();
};

export { showSuccess, showError, showInfo, showWarning, clearAllToasts, suppressAllToasts };
