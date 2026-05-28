import CopyEmail from "@components/ui/email/CopyEmail";
import { HighlightText } from "@components/ui/HighlightText";
import { mailboxParticipantToString, parseEmailAddress } from "@utils/emailUtil";

interface Recipient {
    name?: string;
    email: string;
}

interface EmailRecipientsRowProps {
    emails: Recipient[];
    searchTerm?: string;
}

function EmailRecipientsList({ emails, searchTerm = "" }: EmailRecipientsRowProps) {
    if (!emails || emails.length === 0) return null;

    return (
        <>
            {emails.map((recipient: Recipient, index: number) => {
                // const str = mailboxParticipantToString(entry);
                // const { name, email: emailAddr, initial } = parseEmailAddress(str);
                // const key = emailAddr || str || `recipient-${index}`;

                const emailAddr = recipient.email || "";
                const name = recipient.name || emailAddr.split("@")[0] || emailAddr;
                const initial = name.charAt(0).toUpperCase();
                const key = emailAddr || `recipient-${index}`;
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
