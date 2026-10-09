
interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    [key: string]: any;
}

type CalendarSharePermission = 'view' | 'edit' | 'manage';
type CalendarShareStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

interface UserCalendar {
    _id: string;
    name: string;
    color: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
    isShared?: boolean;
    permission?: CalendarSharePermission;
    ownerEmail?: string;
    shareId?: string;
}

interface CalendarShare {
    _id: string;
    calendarId: string;
    inviteeEmail: string;
    permission: CalendarSharePermission;
    status: CalendarShareStatus;
    feedToken?: string;
    respondedAt?: string;
}

interface EventDetail {
    id?: string,
    title: string,
    startDate: string,
    endDate: string,
    allDay: boolean,
    startTime: string | null,
    endTime: string | null,
    eventDescription: string,
    recurrence?: any,
    location: string,
    meetingLink: string,
    guestList: any,
    timeZone: string,
    selectedEventDate?: string | Date,
    isEdit?: boolean,
    folderIconColor?: string,
    eventColor?: string,
    calendarId?: string,
    calendarName?: string,
    calendarColor?: string,
}

export type {
    CalendarEvent,
    CalendarShare,
    CalendarSharePermission,
    CalendarShareStatus,
    EventDetail,
    UserCalendar,
}
