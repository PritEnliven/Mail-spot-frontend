import type {
    CalendarOptions,
    DatesSetArg,
    DateSelectArg,
    EventClickArg,
} from '@fullcalendar/core'

import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import type { ColorOption } from '@components/ui/form/Select2ColorOption'

/* ===========================
   SHARED PLUGINS (SINGLE SOURCE)
=========================== */
const plugins = [
    dayGridPlugin,
    timeGridPlugin,
    interactionPlugin,
    rrulePlugin
]

/* ===========================
   MAIN CALENDAR CONFIG
=========================== */
export function createMainCalendarConfig(params: {
    onDatesSet: (arg: DatesSetArg) => void
    onSelect: (arg: DateSelectArg) => void
    onEventClick: (arg: EventClickArg) => void
    onDateClick?: (info: any) => void
}): CalendarOptions {
    const { onDatesSet, onSelect, onEventClick, onDateClick } = params

    return {
        plugins,
        initialView: 'dayGridMonth',
        selectable: true,
        height: '100%',
        
        weekNumbers: true,
        weekNumberFormat: { week: 'numeric' },

        dayMaxEvents: true,
        moreLinkClick: 'popover',
        moreLinkContent: (args) => `${args.num} more`,

        eventTimeFormat: {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        },

        allDayText: 'All day',

        headerToolbar: {
            left: '',
            center: '',
            right: '',
        },

        views: {
            timeGridWeek: {
                dayHeaderContent: (arg) => ({
                    html: `${arg.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                    })} ${arg.date.getDate()}`,
                }),
                dayMaxEvents: true,
                titleFormat: { year: 'numeric', month: 'long' },
                slotLabelFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                },
            },

            dayGridWeek: {
                dayHeaderContent: (arg) => ({
                    html: `${arg.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                    })} ${arg.date.getDate()}`,
                }),
            },

            timeGridDay: {
                dayHeaderContent: (arg) => ({
                    html: `${arg.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                    })} ${arg.date.getDate()}`,
                }),
                dayMaxEvents: true,
                titleFormat: { year: 'numeric', month: 'long' },
                slotLabelFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                },
            },
        },

        datesSet: onDatesSet,
        select: onSelect,
        eventClick: onEventClick,

        dateClick: onDateClick,
    }
}

/* ===========================
   SIDEBAR CALENDAR CONFIG
=========================== */
export function createSidebarCalendarConfig(
    onDatesSet: (arg: DatesSetArg) => void
): CalendarOptions {
    return {
        plugins,
        initialView: 'dayGridMonth',
        contentHeight: 'auto',
        selectable: false,
        headerToolbar: false,
        dayMaxEvents: false,
        showNonCurrentDates: true,
        weekNumbers: true,
        weekNumberFormat: { week: 'numeric' },
        dayHeaderFormat: { weekday: 'narrow' },
        datesSet: onDatesSet,   
    }
}


export const colorListConfi: ColorOption[] = [
    { label: "Black", value: "#212121", color: "#212121" },
    { label: "Red", value: "#EA3843", color: "#EA3843" },
    { label: "Gray", value: "#808080", color: "#808080" },
    { label: "Orange", value: "#FF8A00", color: "#FF8A00", default: true },
    { label: "Pink", value: "#FF5BA0", color: "#FF5BA0" },
    { label: "Yellow", value: "#FFB800", color: "#FFB800" },
    { label: "Blue", value: "#263DB8", color: "#263DB8" },
    { label: "Green", value: "#49BA14", color: "#49BA14" },
    { label: "Sky Blue", value: "#00A3EF", color: "#00A3EF" },
    { label: "Dark Green", value: "#398415", color: "#398415" }
];


