export interface Email {
    id: string;
    _id?: string;
    uid: number;
    messageId: string;
    threadId: string;
    from: EmailAddress[];
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
    subject: string;
    flags: string[];
    isSeen: boolean;
    body: string;
    bodyText: string;
    threadCount: number;
    remainingAttachments: number;
    attachments: any[];
    userId: string;
    service: string;
    boxName: string[];
    isBodyHtml: boolean;
    customBoxes: any[];
    date: string;
    relativeDate: any;
    isSchedule?: boolean;
    isSearchEmail?: boolean;
}

export interface EmailAddress {
    name: string;
    email: string;
}