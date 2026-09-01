import type { Guest } from '@components/ui/calendar/GuestTag';
import type { EventDetail } from "@models/CalendarModels";
import moment from 'moment';
import { formatDate, formatTime12HrFrom24HrString, TimeFormat } from "./dateUtil";
import { parseEmailAddress } from './emailUtil';

interface RecurrenceCustomData {
    type: string;
    interval: number;
    isCustom: boolean;
    intervalUnit: string;
    repeatOn: any[];
    endCondition: {
        type: 'never' | 'on' | 'after';
        untilDate?: string;
        count?: number;
    };
}

function focusEvent(info: any) {
    const previouslySelected = document.querySelector('.selected-day');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected-day');
    }

    const currentFocused = document.querySelectorAll('.fc-event-focus');
    currentFocused.forEach(el => el.classList.remove('fc-event-focus'));

    info.el.classList.add('fc-event-focus');
}

function focusDate(info: any) {
    document.querySelectorAll('.selected-day, .focused-day')
        .forEach(el => {
            el.classList.remove('selected-day');
            el.classList.remove('focused-day');
        });
    if (info.dayEl) {
        info.dayEl.classList.add('selected-day');
    }
}

function removeFocusEvent() {
    document.querySelectorAll('.fc-event-focus')
        .forEach(el => el.classList.remove('fc-event-focus'));
}

const normalizeEventForModal = (event: any): EventDetail => {
    const start = formatDate(event.startDate, TimeFormat.DD_MM_YYYY) as string;
    const end = formatDate(event.endDate, TimeFormat.DD_MM_YYYY) as string;

    // Convert to Date objects before calling toISOString()
    const startDateObj = new Date(event.startDate);
    const endDateObj = new Date(event.endDate);

    const derivedStartTime = startDateObj.toISOString().substring(11, 16);
    const derivedEndTime = endDateObj.toISOString().substring(11, 16);

    const startTime24 = event.fullDay ? null : (event.startTime || derivedStartTime);
    const endTime24 = event.fullDay ? null : (event.endTime || derivedEndTime);

    const normalized: EventDetail = {
        id: event.id,
        title: event.title || '',
        startDate: start,
        endDate: end,
        allDay: event.fullDay,
        startTime: startTime24 ? formatTime12HrFrom24HrString(startTime24) : null,
        endTime: endTime24 ? formatTime12HrFrom24HrString(endTime24) : null,
        eventDescription: event.description || '',
        location: event.location || '',
        meetingLink: event.meetingLink || '',
        recurrence: event.recurrence,
        guestList: event.guest || [],
        timeZone: event.timeZone || 'Asia/Kolkata',
        selectedEventDate: event.selectedEventDate,
        eventColor: event.eventColor
    };

    return normalized;
};

function buildRecurrencePayload(
    recurrenceType: string,
    customData?: RecurrenceCustomData
): string | null {
    if (!recurrenceType || recurrenceType === 'doesNotRepeat') return null;

    // If custom data is provided, ensure isCustom is true and return as JSON
    if (customData) {
        const data: any = customData;
        const intervalUnit = data.intervalUnit || recurrenceType;

        const repeatOn = Array.isArray(data.repeatOn)
            ? data.repeatOn
            : Array.isArray(data.weekDay)
                ? data.weekDay
                : [];

        let endCondition: RecurrenceCustomData['endCondition'] | undefined = data.endCondition;
        if (!endCondition && data.recurrenceEnd) {
            if (data.recurrenceEnd === 'never') {
                endCondition = { type: 'never' };
            } else if (data.recurrenceEnd === 'endOn') {
                const untilDate = typeof data.endDate === 'string' && data.endDate
                    ? new Date(`${data.endDate}T00:00:00.000Z`).toISOString()
                    : undefined;
                endCondition = untilDate ? { type: 'on', untilDate } : { type: 'on' };
            } else if (data.recurrenceEnd === 'after') {
                endCondition = {
                    type: 'after',
                    count: typeof data.numberOfOccurrences === 'number' ? data.numberOfOccurrences : undefined,
                };
            }
        }

        const normalized = {
            type: data.type || intervalUnit,
            interval: typeof data.interval === 'number' ? data.interval : 1,
            isCustom: true,
            intervalUnit,
            repeatOn,
            endCondition: endCondition || ({ type: 'never' } as const),
        };

        return JSON.stringify(normalized);
    }

    // Standard recurrence objects for non-custom selections
    const standardRecurrence = {
        type: recurrenceType,
        interval: 1,
        isCustom: false,
        intervalUnit: recurrenceType,
        repeatOn: [],
        endCondition: { type: 'never' as const },
    };

    return JSON.stringify(standardRecurrence);
}

function formatCalendarEvents(events: any[] = []) {
    if (!Array.isArray(events)) return [];

    return events.map(ev => {

        const isRecurring = !!ev.rrule || !!ev.extendedProps?.recurrence;

        // DO NOT TOUCH RECURRING EVENTS except date formatting
        if (isRecurring) {
            const startISO = formatDate(ev.start, TimeFormat.YYYYMMDD) || formatDate(ev.extendedProps?.startDate, TimeFormat.YYYYMMDD);
            const endISO = formatDate(ev.end, TimeFormat.YYYYMMDD) || formatDate(ev.extendedProps?.endDate, TimeFormat.YYYYMMDD) || startISO;
            if (!startISO) return ev;

            // For all-day recurring events, ensure end is next day (exclusive)
            let finalEnd = endISO;
            if (ev.allDay) {
                const normalized = normalizeAllDayEvent(String(startISO), String(endISO));
                if (normalized) {
                    finalEnd = normalized.end;
                }
            }

            return {
                ...ev,
                start: startISO,
                end: finalEnd
            };
        }

        // -----------------------
        // NON-RECURRING EVENTS
        // -----------------------

        const startISO =
            formatDate(ev.start, TimeFormat.YYYYMMDD) ||
            formatDate(ev.extendedProps?.startDate, TimeFormat.YYYYMMDD);

        const endISO =
            formatDate(ev.extendedProps?.endDate, TimeFormat.YYYYMMDD) ||
            formatDate(ev.end, TimeFormat.YYYYMMDD) ||
            startISO;

        if (!startISO) return ev;

        if (ev.allDay) {
            const normalized = normalizeAllDayEvent(
                ev.extendedProps?.startDate || ev.start,
                ev.extendedProps?.endDate || ev.end
            );

            if (!normalized) return ev;

            return {
                ...ev,
                start: normalized.start,
                end: normalized.end
            };
        }

        const startTime = ev.extendedProps?.startTime || "00:00";
        const endTime = ev.extendedProps?.endTime || "23:59";

        return {
            ...ev,
            start: moment(
                `${startISO}T${startTime}`,
                "YYYY-MM-DDTHH:mm",
                true
            ).toISOString(),

            end: moment(
                `${endISO}T${endTime}`,
                "YYYY-MM-DDTHH:mm",
                true
            ).toISOString()
        };
    });
}

function normalizeAllDayEvent(start: string, end?: string) {
    if (!start) return null;

    const startDate = moment(start, "DD-MM-YYYY", true);
    if (!startDate.isValid()) return null;

    let endDate = end
        ? moment(end, "DD-MM-YYYY", true)
        : startDate.clone();

    if (endDate.isSame(startDate, 'day')) {
        endDate = endDate.add(1, 'day');
    } else {
        // FullCalendar allDay end is exclusive
        endDate = endDate.add(1, 'day');
    }

    return {
        start: startDate.format("YYYY-MM-DD"),
        end: endDate.format("YYYY-MM-DD")
    };
}

const normalizeGuests = (guestList: any): Guest[] => {
    if (!Array.isArray(guestList)) return [];

    return guestList
        .map((guest: any): Guest | null => {
            if (!guest) return null;

            // Handle string format
            if (typeof guest === 'string') {
                const parsed = parseEmailAddress(guest);
                if (!parsed.email) return null;
                return { name: parsed.name, email: parsed.email };
            }

            // Handle object format
            if (typeof guest === 'object') {
                const email = guest.email || '';
                const name = guest.name || '';
                const partstat = guest.partstat || guest.status || guest.responseStatus || guest.rsvp;

                const parsed = parseEmailAddress(email);
                if (!parsed.email) return null;

                return {
                    name: name || parsed.name,
                    email: parsed.email,
                    partstat,
                };
            }

            return null;
        })
        .filter(Boolean) as Guest[];
};

const filterGuestByEmail = (guests: string[], emailToRemove: string): string[] => {
    return guests.filter((guest: string) => {
        const parsed = parseEmailAddress(guest);
        return parsed.email !== emailToRemove;
    });
};

export interface TimeOptionConfig {
    interval?: 15 | 30 | 60;
    format?: '12h' | '24h';
}

const generateTimeOptions = ({
    interval = 15,
    format = '12h',
}: TimeOptionConfig = {}) => {
    const times: string[] = [];

    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += interval) {
            if (format === '24h') {
                times.push(
                    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                );
            } else {
                const hour12 = h % 12 || 12;
                const ampm = h < 12 ? 'AM' : 'PM';
                times.push(
                    `${hour12.toString().padStart(2, '0')}:${m
                        .toString()
                        .padStart(2, '0')} ${ampm}`
                );
            }
        }
    }

    return times;
};


export { buildRecurrencePayload, filterGuestByEmail, focusDate, focusEvent, formatCalendarEvents, generateTimeOptions, normalizeEventForModal, normalizeGuests, removeFocusEvent };
