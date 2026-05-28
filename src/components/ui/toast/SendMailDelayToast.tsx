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

export type SendEmailWithUndoResult = 'sent' | 'cancelled';

/**
 * Shows an undo toast; resolves when the email is sent or the user cancels.
 * The returned Promise must settle so callers can clear loading state.
 */
const sendEmailWithUndo = (
    _message: string,
    delay: number,
    onSend: () => Promise<void>
): Promise<SendEmailWithUndoResult> => {
    return new Promise<SendEmailWithUndoResult>((resolve, reject) => {
        let toastId: string | number | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let isCancelled = false;
        let settled = false;
        let sendStarted = false;

        const settle = (result: SendEmailWithUndoResult) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        const runSend = async () => {
            if (settled || isCancelled || sendStarted) return;
            sendStarted = true;
            try {
                await onSend();
                settle('sent');
            } catch (e) {
                settled = true;
                reject(e);
            }
        };

        const onUndo = () => {
            if (settled) return;
            isCancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }
            settle('cancelled');
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
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeoutId = undefined;
                    }
                    if (isCancelled) {
                        return;
                    }
                    void runSend();
                },
            }
        );

        timeoutId = setTimeout(() => {
            if (settled || isCancelled) return;
            if (toastId && toast.isActive(toastId)) {
                toast.dismiss(toastId);
            } else {
                void runSend();
            }
        }, delay);
    });
};

export { SendMailDelayToast, sendEmailWithUndo };
