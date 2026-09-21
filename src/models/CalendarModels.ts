
interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    [key: string]: any;
}

interface UserCalendar {
    _id: string;
    name: string;
    color: string;
    isDefault: boolean;
    createdAt?: string;
    updatedAt?: string;
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

export type { CalendarEvent, EventDetail, UserCalendar }
