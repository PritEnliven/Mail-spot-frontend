import attachmentIcon from "@images/attachment-stroke-rounded-icon.svg";
import { HighlightText } from "@components/ui/HighlightText";
import { getParticipantsLabel, getSenderLabel, normalizeMailboxList } from "@utils/emailUtil";


interface Email {
    _id?: string;
    uid: number;
    messageId: string;
    subject: string;
    from?: unknown[];
    to?: unknown[];
    cc?: unknown[];
    bcc?: unknown[];
    body?: string;
    bodyText?: string;
    date: string;
    attachments?: any[];
}

interface SearchEmailRowProps {
    email: Email;
    onEmailClick: (email: Email, isSearch: boolean) => void;
    searchTerm: string;
}

function htmlToPlainText(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getSearchPreviewText(email: Email, searchTerm: string): string {
    const term = searchTerm.trim();
    const fromLabel = getSenderLabel(email.from);
    const toLabel = getParticipantsLabel(email.to);
    const ccLabel = getParticipantsLabel(email.cc);
    const bccLabel = getParticipantsLabel(email.bcc);
    // Keep full name <email> strings for term matching (email address search still works).
    const fromSearch = normalizeMailboxList(email.from).join(", ");
    const toSearch = normalizeMailboxList(email.to).join(", ");
    const ccSearch = normalizeMailboxList(email.cc).join(", ");
    const bccSearch = normalizeMailboxList(email.bcc).join(", ");
    const bodyPlain = (email.bodyText || htmlToPlainText(email.body || "")).trim();

    if (!term) {
        return toLabel || fromLabel;
    }

    if (bodyPlain && fieldContainsTerm(bodyPlain, term)) {
        return truncateAroundMatch(bodyPlain, term);
    }
    if (fromSearch && fieldContainsTerm(fromSearch, term)) return fromLabel || fromSearch;
    if (toSearch && fieldContainsTerm(toSearch, term)) return toLabel || toSearch;
    if (ccSearch && fieldContainsTerm(ccSearch, term)) return ccLabel || ccSearch;
    if (bccSearch && fieldContainsTerm(bccSearch, term)) return bccLabel || bccSearch;

    return toLabel || fromLabel || ccLabel || bccLabel || bodyPlain.slice(0, 120);
}

function fieldContainsTerm(text: string, term: string): boolean {
    return text.toLowerCase().includes(term.toLowerCase());
}

function truncateAroundMatch(text: string, term: string, maxLength = 120): string {
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerTerm);
    if (matchIndex === -1) return text.slice(0, maxLength);

    const half = Math.floor((maxLength - term.length) / 2);
    let start = Math.max(0, matchIndex - half);
    let end = Math.min(text.length, start + maxLength);
    start = Math.max(0, end - maxLength);

    let snippet = text.slice(start, end);
    if (start > 0) snippet = `…${snippet}`;
    if (end < text.length) snippet = `${snippet}…`;
    return snippet;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function SearchEmailRow({ email, onEmailClick, searchTerm }: SearchEmailRowProps) {
    const subject = email.subject || "No Subject";
    const previewText = getSearchPreviewText(email, searchTerm);

    return (
        <li>
            <div
                className="dropdown-item icon"
                data-uid={email.uid}
                data-message-id={email.messageId}
                onClick={() => onEmailClick(email, true)}
            >
                <div className="subject-search">
                    <div className="subject">
                        <HighlightText text={subject} searchTerm={searchTerm} />
                    </div>
                    <div className="right-attachment-time">
                        {email.attachments && email.attachments.length > 0 && (
                            <img src={attachmentIcon} className="me-2" alt="attachment" />
                        )}
                        <div className="time">{formatDate(email.date)}</div>
                    </div>
                </div>
                <div className="to-email">
                    <HighlightText text={previewText} searchTerm={searchTerm} />
                </div>
            </div>
        </li>
    );
}

export default SearchEmailRow;
