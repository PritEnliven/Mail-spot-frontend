import type { Email } from '@models/Email';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface MailSelectionType {
    selectedEmails: Set<string>;
    setSelectedEmails: (selectedEmails: Set<string>) => void;
    toggleEmailSelection: (messageId: string) => void;
    toggleEmailSelectionWithShift: (messageId: string, emails: Email[]) => void;
    selectAllEmails: () => void;
    clearEmailSelection: () => void;
    lastSelectedIndex: number | null;
    setLastSelectedIndex: (index: number | null) => void;
}

const MailSelectionContext = createContext<MailSelectionType | undefined>(undefined);

export const useMailSelection = () => {
    const ctx = useContext(MailSelectionContext);
    if (!ctx) throw new Error('useMailSelection must be used inside MailSelectionProvider');
    return ctx;
};

interface MailSelectionProviderProps {
    children: ReactNode;
    emails: Email[];
    onSelectionChange?: (selectedEmails: Set<string>) => void;
}

export const MailSelectionProvider = ({ children, emails, onSelectionChange }: MailSelectionProviderProps) => {
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    /** Sticky select-all: newly loaded rows (infinite scroll) stay selected until cleared. */
    const selectAllActiveRef = useRef(false);
    const prevEmailIdsRef = useRef<string[]>([]);

    useEffect(() => {
        const ids = emails.map((email) => email.messageId).filter(Boolean);
        const idSet = new Set(ids);
        const prevIds = prevEmailIdsRef.current;
        prevEmailIdsRef.current = ids;

        if (ids.length === 0) {
            selectAllActiveRef.current = false;
            setSelectedEmails(new Set());
            setLastSelectedIndex(null);
            onSelectionChange?.(new Set());
            return;
        }

        // Full replace (folder change / page flip): no previous ids remain.
        // Append, delete-one, and in-place updates keep at least some ids.
        const retainedCount =
            prevIds.length === 0
                ? 0
                : prevIds.reduce((count, id) => count + (idSet.has(id) ? 1 : 0), 0);
        const isFullReplace = prevIds.length > 0 && retainedCount === 0;

        if (isFullReplace) {
            selectAllActiveRef.current = false;
            setSelectedEmails(new Set());
            setLastSelectedIndex(null);
            onSelectionChange?.(new Set());
            return;
        }

        if (selectAllActiveRef.current) {
            const next = new Set(ids);
            setSelectedEmails((prev) => {
                if (prev.size === next.size && ids.every((id) => prev.has(id))) {
                    return prev;
                }
                onSelectionChange?.(next);
                return next;
            });
            return;
        }

        // Keep selection for ids that still exist (e.g. mark-as-read remaps the array)
        setSelectedEmails((prev) => {
            if (prev.size === 0) return prev;
            const next = new Set<string>();
            for (const id of prev) {
                if (idSet.has(id)) next.add(id);
            }
            if (next.size === prev.size) return prev;
            onSelectionChange?.(next);
            return next;
        });
    }, [emails, onSelectionChange]);

    const toggleEmailSelection = (messageId: string) => {
        setSelectedEmails((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
                selectAllActiveRef.current = false;
            } else {
                newSet.add(messageId);
                const allIds = emails.map((email) => email.messageId).filter(Boolean);
                selectAllActiveRef.current =
                    allIds.length > 0 && allIds.every((id) => newSet.has(id));
            }
            onSelectionChange?.(newSet);
            return newSet;
        });
    };

    const toggleEmailSelectionWithShift = (messageId: string, emailList: Email[]) => {
        const currentIndex = emailList.findIndex((email) => email.messageId === messageId);
        if (currentIndex === -1 || lastSelectedIndex === null) {
            toggleEmailSelection(messageId);
            setLastSelectedIndex(currentIndex);
            return;
        }

        setSelectedEmails((_prev) => {
            const newSet = new Set<string>();

            const startIndex = Math.min(currentIndex, lastSelectedIndex);
            const endIndex = Math.max(currentIndex, lastSelectedIndex);

            for (let i = startIndex; i <= endIndex; i++) {
                const email = emailList[i];
                if (email) {
                    newSet.add(email.messageId);
                }
            }

            newSet.add(messageId);

            const allIds = emailList.map((email) => email.messageId).filter(Boolean);
            selectAllActiveRef.current =
                allIds.length > 0 && allIds.every((id) => newSet.has(id));

            onSelectionChange?.(newSet);
            return newSet;
        });

        setLastSelectedIndex(currentIndex);
    };

    const selectAllEmails = () => {
        const allMessageIds = emails.map((email) => email.messageId).filter(Boolean);
        if (allMessageIds.length > 0 && allMessageIds.some((id) => !selectedEmails.has(id))) {
            const newSelection = new Set(allMessageIds);
            selectAllActiveRef.current = true;
            setSelectedEmails(newSelection);
            onSelectionChange?.(newSelection);
        } else {
            selectAllActiveRef.current = false;
            const newSelection = new Set<string>();
            setSelectedEmails(newSelection);
            onSelectionChange?.(newSelection);
        }
    };

    const clearEmailSelection = () => {
        selectAllActiveRef.current = false;
        const newSelection = new Set<string>();
        setSelectedEmails(newSelection);
        setLastSelectedIndex(null);
        onSelectionChange?.(newSelection);
    };

    const value = {
        selectedEmails,
        setSelectedEmails,
        toggleEmailSelection,
        toggleEmailSelectionWithShift,
        selectAllEmails,
        clearEmailSelection,
        lastSelectedIndex,
        setLastSelectedIndex,
    };

    return (
        <MailSelectionContext.Provider value={value}>
            {children}
        </MailSelectionContext.Provider>
    );
};
