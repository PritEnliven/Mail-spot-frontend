import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Email } from '@models/Email';

interface MailSelectionType {
    selectedEmails: Set<string>;
    setSelectedEmails: (selectedEmails: Set<string>) => void;
    toggleEmailSelection: (messageId: string) => void;
    selectAllEmails: () => void;
    clearEmailSelection: () => void;
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
        onSelectionChange?.(newSelection);
    };

    // Clear selection when emails change (e.g., when switching folders)
    useEffect(() => {
        setSelectedEmails(new Set());
    }, [emails]);

    const value = {
        selectedEmails,
        setSelectedEmails,
        toggleEmailSelection,
        selectAllEmails,
        clearEmailSelection,
    };

    return (
        <MailSelectionContext.Provider value={value}>
            {children}
        </MailSelectionContext.Provider>
    );
};
