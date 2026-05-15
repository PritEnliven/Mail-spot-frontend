import attachmentIcon from "@images/attachment-stroke-rounded-icon.svg";

interface Email {
    _id?: string;
    uid: number;
    messageId: string;
    subject: string;
    to: string;
    date: string;
    attachments?: any[];
}

interface SearchEmailRowProps {
    email: Email;
    onEmailClick: (email: Email, isSearch: boolean) => void;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function SearchEmailRow({ email, onEmailClick }: SearchEmailRowProps) {
    return (
        <li>
            <div 
                className="dropdown-item icon" 
                data-uid={email.uid} 
                data-message-id={email.messageId}
                onClick={() => onEmailClick(email, true)}
            >
                <div className="subject-search">
                    <div className="subject">{email.subject || "No Subject"}</div>
                    <div className="right-attachment-time">
                        {email.attachments && email.attachments.length > 0 && (
                            <img src={attachmentIcon} className="me-2" alt="attachment" />
                        )}
                        <div className="time">{formatDate(email.date)}</div>
                    </div>
                </div>
                <div className="to-email">{email.to}</div>
            </div>
        </li>
    );
}

export default SearchEmailRow;