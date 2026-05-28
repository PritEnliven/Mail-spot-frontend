import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

const baseOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
};

const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, { ...baseOptions, ...options });
};

const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...baseOptions, ...options });
};

const showInfo = (message: string, options?: ToastOptions) => {
    toast.info(message, { ...baseOptions, ...options });
};

const showWarning = (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...baseOptions, ...options });
};

const clearAllToasts = () => {
    toast.dismiss();
};

export { showSuccess, showError, showInfo, showWarning, clearAllToasts };