import { getAllContacts } from '@services/contact/contactService';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ContactsType {
    contacts: any[];
    setContacts: (contacts: any[]) => void;
    fetchContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsType | undefined>(undefined);

export const useContacts = () => {
    const ctx = useContext(ContactsContext);
    if (!ctx) throw new Error('useContacts must be used inside ContactsProvider');
    return ctx;
};

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
    const [contacts, setContacts] = useState<any[]>([
        // Mock contacts for testing
        { value: '1', name: 'John Doe', email: 'john@example.com' },
        { value: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { value: '3', name: 'Bob Johnson', email: 'bob@example.com' }
    ]);

    const fetchContacts = useCallback(async () => {
        try {
            const response = await getAllContacts();
            if (response.statusCode === 200) {
                setContacts(response.data.contacts || []);
            }
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        }
    }, []);

    const value = {
        contacts,
        setContacts,
        fetchContacts,
    };

    return (
        <ContactsContext.Provider value={value}>
            {children}
        </ContactsContext.Provider>
    );
};
