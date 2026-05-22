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
    try {
        await navigator.clipboard.writeText(email);
    } catch {
    }
};

export { copyEmailToClipBoard, createModalCloseHandler };
