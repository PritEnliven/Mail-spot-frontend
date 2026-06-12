type ShortcutListener = () => void;

const listeners: Map<string, Set<ShortcutListener>> = new Map();

export const shortcutBus = {
    on(action: string, handler: ShortcutListener) {
        if (!listeners.has(action)) {
            listeners.set(action, new Set());
        }
        listeners.get(action)!.add(handler);
    },

    off(action: string, handler: ShortcutListener) {
        listeners.get(action)?.delete(handler);
    },

    emit(action: string) {
        listeners.get(action)?.forEach(fn => fn());
    },

    clear(action: string) {
        listeners.delete(action);
    },
};