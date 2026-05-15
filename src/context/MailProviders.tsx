import { type ReactNode } from 'react';
import { MailDataProvider, useMailData } from './MailDataContext';
import { MailSelectionProvider, useMailSelection } from './MailSelectionContext';
import { MailUIProvider } from '@context/MailUIContext';
import { ContactsProvider } from '@context/ContactsContext';
import { ComposeFormProvider } from '@context/ComposeFormContext';
import { CalendarProvider } from '@context/CalendarContext';

interface MailProvidersProps {
    children: ReactNode;
}

const MailProvidersInner = ({ children }: { children: ReactNode }) => {
    const { emails, activeEmailMessageId } = useMailData();
    const { selectedEmails } = useMailSelection();
    
    return (
        <MailUIProvider
            emails={emails}
            selectedEmails={selectedEmails}
            activeEmailMessageId={activeEmailMessageId}
        >
            <ContactsProvider>
                <ComposeFormProvider>
                    <CalendarProvider>
                        {children}
                    </CalendarProvider>
                </ComposeFormProvider>
            </ContactsProvider>
        </MailUIProvider>
    );
};

const MailProvidersWithSelection = ({ children }: { children: ReactNode }) => {
    const { emails } = useMailData();

    return (
        <MailSelectionProvider emails={emails}>
            <MailProvidersInner>
                {children}
            </MailProvidersInner>
        </MailSelectionProvider>
    );
};

const MailProviders = ({ children }: MailProvidersProps) => {
    return (
        <MailDataProvider>
            <MailProvidersWithSelection>
                {children}
            </MailProvidersWithSelection>
        </MailDataProvider>
    );
};

export default MailProviders;
