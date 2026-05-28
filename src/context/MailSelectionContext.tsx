import type { Email } from '@models/Email';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

    // Clear selection when emails change (e.g., when switching folders)
    useEffect(() => {
        setSelectedEmails(new Set());
    }, [emails]);

    const toggleEmailSelection = (messageId: string) => {
        setSelectedEmails(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            onSelectionChange?.(newSet);
            return newSet;
        });
    };

    const toggleEmailSelectionWithShift = (messageId: string, emails: Email[]) => {
        const currentIndex = emails.findIndex(email => email.messageId === messageId);
        if (currentIndex === -1 || lastSelectedIndex === null) {
            // If not found or no last selection, just toggle normally
            toggleEmailSelection(messageId);
            setLastSelectedIndex(currentIndex);
            return;
        }

        setSelectedEmails(_prev => {
            // Clear previous selection for proper shift-select behavior
            const newSet = new Set<string>();
            
            // Determine the range
            const startIndex = Math.min(currentIndex, lastSelectedIndex);
            const endIndex = Math.max(currentIndex, lastSelectedIndex);
            
            // Add all emails in the range to selection (inclusive)
            for (let i = startIndex; i <= endIndex; i++) {
                const email = emails[i];
                if (email) {
                    newSet.add(email.messageId);
                }
            }
            
            // Ensure the current email is always selected
            newSet.add(messageId);
            
            onSelectionChange?.(newSet);
            return newSet;
        });
        
        setLastSelectedIndex(currentIndex);
    };

    const selectAllEmails = () => {
        const allMessageIds = emails.map(email => email.messageId);
        // Only select all if not all are already selected
        if (allMessageIds.length > 0 && allMessageIds.some(id => !selectedEmails.has(id))) {
            const newSelection = new Set(allMessageIds);
            setSelectedEmails(newSelection);
            onSelectionChange?.(newSelection);
        } else {
            // If all are already selected, clear selection
            const newSelection = new Set<string>();
            setSelectedEmails(newSelection);
            onSelectionChange?.(newSelection);
        }
    };
    const clearEmailSelection = () => {
        const newSelection = new Set<string>();
        setSelectedEmails(newSelection);
        setLastSelectedIndex(null);
        onSelectionChange?.(newSelection);
    };

    // Clear selection when emails change (e.g., when switching folders)
    useEffect(() => {
        setSelectedEmails(new Set());
        setLastSelectedIndex(null);
    }, [emails]);

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
