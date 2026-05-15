import { useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';

interface UseBootstrapModalOptions {
    onOpen?: () => void;
    onCloseStart?: () => void;
    onClosed?: () => void;
}

export function useBootstrapModal(options?: UseBootstrapModalOptions) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const instanceRef = useRef<Modal | null>(null);

    useEffect(() => {
        if (!modalRef.current) return;

        const el = modalRef.current;

        instanceRef.current = new Modal(el, {
            backdrop: true,
            keyboard: true,
            focus: false,
        });

        options?.onOpen?.();
        instanceRef.current.show();

        const handleHidden = () => {
            options?.onClosed?.();
        };

        el.addEventListener('hidden.bs.modal', handleHidden);

        return () => {
            el.removeEventListener('hidden.bs.modal', handleHidden);
            instanceRef.current?.dispose();
            instanceRef.current = null;
        };
    }, []);

    const close = () => {
        options?.onCloseStart?.();
        instanceRef.current?.hide();
    };

    return { modalRef, close };
}
