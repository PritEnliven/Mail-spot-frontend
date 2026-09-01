export type CalendarInviteMethod = 'REQUEST' | 'REPLY' | 'CANCEL' | string;
export type CalendarPartstat = 'NEEDS-ACTION' | 'ACCEPTED' | 'TENTATIVE' | 'DECLINED';

export interface CalendarInvitePerson {
    name?: string;
    email?: string;
    partstat?: string;
}

export interface CalendarInvite {
    method?: CalendarInviteMethod;
    uid?: string;
    eventId?: string;
    title?: string;
    summary?: string;
    start?: string;
    startDate?: string;
    end?: string;
    endDate?: string;
    allDay?: boolean;
    fullDay?: boolean;
    location?: string;
    organizer?: CalendarInvitePerson | string;
    attendees?: CalendarInvitePerson[];
    myPartstat?: string;
    partstat?: string;
    attendeePartstat?: string;
    responderName?: string;
}

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
    calendarInvite?: CalendarInvite | null;
}

export interface EmailAddress {
    name: string;
    email: string;
}