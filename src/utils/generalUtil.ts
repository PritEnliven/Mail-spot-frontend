function createModalCloseHandler({
    modalId,
    closeModal,
    props,
}: {
    modalId: string;
    closeModal: (id: string) => void;
    props: any;
}) {
    return (payload: {
        reason: "success" | "error" | "cancel";
        data?: any;
        error?: any;
    }) => {
        closeModal(modalId);

        if (payload.reason === "success") {
            props.onSuccess?.(payload.data);
        }

        if (payload.reason === "error") {
            props.onError?.(payload.error);
        }

        if (payload.reason === "cancel") {
            props.onCancel?.();
        }
    };
}

async function copyEmailToClipBoard(email: string) {
    const text = typeof email === 'string' ? email.trim() : String(email ?? '').trim();
    if (!text) return;

    const writeWithFallback = () => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        document.execCommand('copy');
        document.body.removeChild(textarea);
    };

    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        writeWithFallback();
    } catch {
        writeWithFallback();
    }
}

export { copyEmailToClipBoard, createModalCloseHandler };
