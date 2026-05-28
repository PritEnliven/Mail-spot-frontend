import { useCallback, useState } from "react";

export function useCcBccToggle(initialState?: { cc?: boolean; bcc?: boolean }) {
    const [isCcOpen, setCcOpen] = useState(initialState?.cc ?? false);
    const [isBccOpen, setBccOpen] = useState(initialState?.bcc ?? false);

    const toggleCc = useCallback(() => setCcOpen(prev => !prev), []);
    const toggleBcc = useCallback(() => setBccOpen(prev => !prev), []);

    const openCc = useCallback(() => setCcOpen(true), []);
    const openBcc = useCallback(() => setBccOpen(true), []);

    const closeCc = useCallback(() => setCcOpen(false), []);
    const closeBcc = useCallback(() => setBccOpen(false), []);

    return {
        isCcOpen,
        isBccOpen,
        toggleCc,
        toggleBcc,
        openCc,
        openBcc,
        closeCc,
        closeBcc,
    };
}
