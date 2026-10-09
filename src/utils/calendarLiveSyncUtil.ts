import type { CalendarEvent, CalendarSharePermission, UserCalendar } from '@models/CalendarModels';
import { formatCalendarEvents } from '@utils/calendarUtil';
import { formatDate, TimeFormat } from '@utils/dateUtil';

export type CalendarShareSocketAction =
    | 'permission_updated'
    | 'revoked'
    | 'accepted'
    | 'declined';

export type CalendarEventSocketAction = 'added' | 'updated' | 'deleted';

export interface CalendarShareSocketPayload {
    action: CalendarShareSocketAction;
    calendarId: string;
    shareId: string;
    permission: CalendarSharePermission;
    status: string;
    inviteeEmail: string;
    ownerEmail: string;
}

export interface CalendarLiveEventPayload {
    _id?: string;
    id?: string;
    calendarId: string;
    title?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string | null;
    endTime?: string | null;
    fullDay?: boolean;
    allDay?: boolean;
    eventColor?: string;
    location?: string;
    description?: string;
    recurrence?: unknown;
}

export interface CalendarEventSocketPayload {
    action: CalendarEventSocketAction;
    calendarId: string;
    eventId: string;
    event?: CalendarLiveEventPayload | null;
}

export interface CalendarRemovedSocketPayload {
    action: 'calendar_deleted';
    calendarId: string;
    shares?: Array<{ shareId: string; inviteeEmail: string }>;
}

function emailsMatch(a?: string | null, b?: string | null): boolean {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function eventBelongsToCalendar(event: CalendarEvent, calendarId: string): boolean {
    const id = event.calendarId || event.extendedProps?.calendarId;
    return String(id || '') === String(calendarId);
}

function eventMatchesId(event: CalendarEvent, eventId: string): boolean {
    return String(event.id) === String(eventId) || String(event._id || '') === String(eventId);
}

function mapLiveEventToRaw(
    raw: CalendarLiveEventPayload,
    eventId: string,
    calendar?: UserCalendar
): Record<string, unknown> {
    const id = String(raw._id || raw.id || eventId);
    const allDay = Boolean(raw.fullDay ?? raw.allDay);
    const startDate = formatDate(raw.startDate, TimeFormat.DD_MM_YYYY);
    const endDate = formatDate(raw.endDate || raw.startDate, TimeFormat.DD_MM_YYYY);
    const color = raw.eventColor || calendar?.color || '#0097ef';

    return {
        id,
        title: raw.title || '',
        allDay,
        backgroundColor: color,
        borderColor: color,
        eventColor: raw.eventColor || '',
        calendarId: raw.calendarId,
        extendedProps: {
            calendarId: raw.calendarId,
            calendarName: calendar?.name || '',
            calendarColor: calendar?.color || '',
            startDate,
            endDate,
            startTime: raw.startTime || null,
            endTime: raw.endTime || null,
            location: raw.location || '',
            description: raw.description || '',
            recurrence: raw.recurrence,
        },
    };
}

function formatLiveEvent(
    raw: CalendarLiveEventPayload,
    eventId: string,
    calendar?: UserCalendar
): CalendarEvent | null {
    const mapped = mapLiveEventToRaw(raw, eventId, calendar);
    const [formatted] = formatCalendarEvents([mapped]);
    return formatted || null;
}

export {
    emailsMatch,
    eventBelongsToCalendar,
    eventMatchesId,
    formatLiveEvent,
};
