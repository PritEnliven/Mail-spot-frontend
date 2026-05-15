export interface Email {
    id?: string;
    _id?: string;
    uid: number;
    messageId: string;
    threadId: string;
    from: string[];
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    flags: string[];
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