import CopyEmail from "@components/ui/email/CopyEmail";
import { mailboxParticipantToString, parseEmailAddress } from "@utils/emailUtil";

interface EmailRecipientsRowProps {
    emails: unknown[];
}

function EmailRecipientsList({ emails }: EmailRecipientsRowProps) {
    if (!emails || emails.length === 0) return null;

    return (
        <>
            {emails.map((entry: unknown, index: number) => {
                const str = mailboxParticipantToString(entry);
                const { name, email: emailAddr, initial } = parseEmailAddress(str);
                const key = emailAddr || str || `recipient-${index}`;
                return (
                    <div key={key} className="from-cc-details position-relative">
                        <span className="email-address">{emailAddr}</span>
                        <CopyEmail
                            name={name}
                            email={emailAddr}
                            initial={initial}
                        />
                    </div>
                );
            })}
        </>
    );
};

export default EmailRecipientsList;
