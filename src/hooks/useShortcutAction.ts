import { useEffect } from 'react';
import { shortcutBus } from '@utils/shortcutEventBus';

export const useShortcutAction = (action: string, handler: () => void, enabled = true) => {
    useEffect(() => {
        if (!enabled) return;
        shortcutBus.on(action, handler);
        return () => shortcutBus.off(action, handler);
    }, [action, handler, enabled]);
};