import { toast } from "react-toastify";
import { useEffect, useState } from "react";

interface SendMailDelayToastProps {
    timeout: number;
    onUndo: () => void;
}

const SendMailDelayToast = ({ timeout, onUndo }: SendMailDelayToastProps) => {
    const [remainingTime, setRemainingTime] = useState(timeout);
    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {
        if (remainingTime <= 0 || isCancelled) return;

        const timer = setInterval(() => {
            setRemainingTime(prevTime => {
                const newTime = prevTime - 1000;
                if (newTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isCancelled]);

    const handleUndo = () => {
        setIsCancelled(true);
        onUndo();
    };

    return (
        <div className="undo-toast">
            <span>Email will be sent in {Math.ceil(remainingTime / 1000)} seconds...</span>
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-new undoSendBtn"
                    onClick={handleUndo}
                    disabled={isCancelled}
                >
                    {isCancelled ? 'Cancelled' : 'Undo'}
                </button>
            </div>
        </div>
    );
};

// Using the provided delay parameter for the timeout

const sendEmailWithUndo = (message: string, delay: number, onSend: () => void) => {
    let toastId: string | number | null = null;
    let timeoutId: any;
    let isSent = false; // Flag to track if email has been sent
    message = "";
    const sendEmail = () => {
        if (!isSent) {
            isSent = true;
            onSend();
        }
    };

    const onUndo = () => {
        if (toastId) {
            toast.dismiss(toastId);
        }
    };

    toastId = toast(
        <div>
            <SendMailDelayToast
                timeout={delay}
                onUndo={onUndo}
            />
        </div>,
        {
            className: "undo-email-toast",
            progressClassName: "undo-email-progress",
            position: "bottom-left",
            autoClose: delay,
            hideProgressBar: false,
            closeOnClick: false,
            rtl: false,
            pauseOnFocusLoss: true,
            draggable: false,
            theme: "dark",
            closeButton: true,
            onClose: () => {
                clearTimeout(timeoutId);
                sendEmail();
            },
        }
    );

    timeoutId = setTimeout(() => {
        if (toastId && toast.isActive(toastId)) {
            toast.dismiss(toastId);
            sendEmail();
        }
    }, delay);

    return () => {
        if (toastId) {
            toast.dismiss(toastId);
        }
        clearTimeout(timeoutId);
    };
};

export { SendMailDelayToast, sendEmailWithUndo };