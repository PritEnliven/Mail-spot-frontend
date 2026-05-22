import { CalendarProvider } from '@context/CalendarContext';
import { ComposeFormProvider } from '@context/ComposeFormContext';
import { ContactsProvider } from '@context/ContactsContext';
import { MailUIProvider } from '@context/MailUIContext';
import { type ReactNode } from 'react';
import { MailDataProvider, useMailData } from './MailDataContext';
import { MailSelectionProvider, useMailSelection } from './MailSelectionContext';

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
