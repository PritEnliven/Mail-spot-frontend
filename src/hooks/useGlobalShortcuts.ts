// hooks/useGlobalShortcuts.ts
import { useEffect } from 'react';
import { useSettings } from '@context/SettingsContext';
import { parseShortcutKey } from '@utils/shortcutUtils';
import { shortcutBus } from '@utils/shortcutEventBus';
import { fixedConstants } from '@constants/fixedShortcuts';

const isBlockedInput = (e: KeyboardEvent): boolean => {
  const el = document.activeElement;
  if (!el) return false;

  if (e.ctrlKey || e.metaKey) return false;

  const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
  if (INPUT_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
};

export const useGlobalShortcuts = () => {
  const { settings } = useSettings();

  useEffect(() => {
    const allShortcuts = [
      ...settings.shortcuts,
      ...fixedConstants
    ]
    const activeShortcuts = allShortcuts
      .map((sc: any) => {
        const rawKey = sc.key || sc.defaultValue;
        const parsed = parseShortcutKey(rawKey);
        if (!parsed) return null;
        return { action: sc.name as string, parsed };
      })
      .filter(Boolean);

    // const onKeyDown = (e: KeyboardEvent) => {
    //   if (isBlockedInput(e)) return;

    //   for (const shortcut of activeShortcuts) {
    //     const { action, parsed } = shortcut!;
    //     const matches =
    //       e.key.toLowerCase() === parsed.key.toLowerCase() && 
    //       e.ctrlKey === parsed.ctrl &&
    //       e.shiftKey === parsed.shift &&
    //       e.altKey === parsed.alt &&
    //       e.metaKey === parsed.meta;

    //     if (matches) {
    //       e.preventDefault();
    //       shortcutBus.emit(action); // just emit, nothing else
    //       break;
    //     }
    //   }
    // };

    const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

    const onKeyDown = (e: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(e.key)) return;
      if (isBlockedInput(e)) return;

      for (const shortcut of activeShortcuts) {
        const { action, parsed } = shortcut!;
        const matches =
          e.key.toLowerCase() === parsed.key.toLowerCase() &&
          e.ctrlKey === parsed.ctrl &&
          e.shiftKey === parsed.shift &&
          e.altKey === parsed.alt &&
          e.metaKey === parsed.meta;

        if (matches) {
          e.preventDefault();
          shortcutBus.emit(action);
          break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });

  }, [settings?.shortcuts]);
};