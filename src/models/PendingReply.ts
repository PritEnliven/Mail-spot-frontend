export interface PendingReply {
    clientMessageId: string;
    fromEmail: string;
    fromName: string;
    toEmails: string[];
    subject: string;
    bodyPreview: string;
    sentAt: string;
    status: 'pending' | 'sent' | 'failed';
    errorMessage?: string;
}
