import CopyEmail from "@components/ui/email/CopyEmail";
import { HighlightText } from "@components/ui/HighlightText";
import { mailboxParticipantToString, parseEmailAddress } from "@utils/emailUtil";

interface EmailRecipientsRowProps {
    emails: unknown[];
    searchTerm?: string;
}

function EmailRecipientsList({ emails, searchTerm = "" }: EmailRecipientsRowProps) {
    if (!emails || emails.length === 0) return null;

    return (
        <>
            {emails.map((entry: unknown, index: number) => {
                const str = mailboxParticipantToString(entry);
                const { name, email: emailAddr, initial } = parseEmailAddress(str);
                const key = emailAddr || str || `recipient-${index}`;
                return (
                    <div key={key} className="from-cc-details position-relative">
                        <span className="email-address">
                            <HighlightText text={emailAddr} searchTerm={searchTerm} />
                        </span>
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
