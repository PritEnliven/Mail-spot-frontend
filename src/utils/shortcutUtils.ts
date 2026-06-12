export type ShortcutAction =
    | 'send_email'
    | 'new_compose'
    | 'go_to_inbox'
    | 'open_settings'
    | 'save_as_draft'
    ;

export interface ParsedShortcut {
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
}

export const parseShortcutKey = (raw: string): ParsedShortcut | null => {
    if (!raw?.trim()) return null;

    const parts = raw.toLowerCase().split('+').map(p => p.trim());

    const ctrl = parts.includes('ctrl');
    const shift = parts.includes('shift');
    const alt = parts.includes('alt');
    const meta = parts.includes('meta') || parts.includes('cmd');

    const modifiers = new Set(['ctrl', 'shift', 'alt', 'meta', 'cmd']);
    const keyParts = parts.filter(p => !modifiers.has(p));

    if (keyParts.length !== 1) return null;

    const keyMap: Record<string, string> = {
        enter: 'Enter',
        space: ' ',
        backspace: 'Backspace',
        delete: 'Delete',
        escape: 'Escape',
        tab: 'Tab',
        arrowup: 'ArrowUp',
        arrowdown: 'ArrowDown',
    };

    const rawKey = keyParts[0];
    const key = keyMap[rawKey] ?? rawKey.toUpperCase();

    return { key, ctrl, shift, alt, meta };
};