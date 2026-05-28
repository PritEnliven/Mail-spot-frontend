import type { Moment } from 'moment';
import moment from 'moment';

export const TimeFormat = {
    // canonical | storage
    ISO: 'iso',
    ISO_LOCAL: 'isoLocal',
    UNIX: 'unix',
    TIMESTAMP: 'timestamp',
    ICALUTC: 'icalUTC',

    // Date only
    DDMMYYYY: 'ddmmyyyy',
    MMDDYYYY: 'mmddyyyy',
    YYYYMMDD: 'yyyymmdd',
    DDMMYYYY_SCHEDULE: 'ddmmyyyySchedule',
    MONTH_DAY: 'monthDay',
    DD_MM_YYYY: 'dd-mm-yyyy',
    FORWARD_TIME: 'dd-mm-yyyy hh:mm',

    // Time only
    TIME24HR: 'time24hr',
    TIME12HR: 'time12hr',

    // Date & time
    DATETIME12HR: 'dateTime12hr',
    DATETIME24HR: 'dateTime24hr',

    // Readable
    FULLREADABLE: 'fullReadable',
    FULLREADABLE_WITH_DAY: 'fullReadableWithDay',
    EMAIL_DETAIL_DATE: 'emailDetailDate',

    // calendar | ux
    CALENDAR: 'calendar',
    CALENDAR_EVENT_LISTDATE: 'calendarEventListDate',
    CALENDAR_EVENT_LISTDATE_ONLY_DATE: 'calendarEventListDateOnlyDate',
    CALENDAR_SEARCH: 'calendarSearch',
    SCHEDULE_DATE: 'scheduleDate',
    EVENT_MAIL_FORMAT: 'eventMailFormat',
    SCHEDULE_MODAL: 'scheduleModal',

    // js
    JS_LOCAL: 'jsLocal',
} as const;

export type TimeFormat = typeof TimeFormat[keyof typeof TimeFormat];


const SAFE_INPUT_FORMATS: moment.MomentFormatSpecification[] = [
    moment.ISO_8601,
    'YYYY-MM-DD',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm:ssZ',
    'DD-MM-YYYY',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
];


type DateInput = Moment | Date | string | number | null | undefined;


function formatDate(
    date: DateInput,
    formatType: TimeFormat = TimeFormat.ISO
): string | number {
    if (date === null || date === undefined) return '';

    // Convert input to Moment
    let m: Moment;
    if (moment.isMoment(date)) {
        m = date.clone();
    } else if (date instanceof Date) {
        m = moment(date);
    } else if (typeof date === 'string') {
        m = moment(date, SAFE_INPUT_FORMATS as any, true); // strict parsing
    } else if (typeof date === 'number') {
        m = moment(date); // numbers are treated as timestamps
    } else {
        return '';
    }

    if (!m.isValid()) return '';

    // Map TimeFormat to Moment format
    switch (formatType) {
        case TimeFormat.ISO:
            return m.toISOString();

        case TimeFormat.ISO_LOCAL:
            return m.format();

        case TimeFormat.DDMMYYYY:
            return m.format('DD/MM/YYYY');

        case TimeFormat.MMDDYYYY:
            return m.format('MM/DD/YYYY');

        case TimeFormat.YYYYMMDD:
            return m.format('YYYY-MM-DD');

        case TimeFormat.DD_MM_YYYY:
            return m.format('DD-MM-YYYY');

        case TimeFormat.DDMMYYYY_SCHEDULE:
            return m.format('DD-MM-YYYY');

        case TimeFormat.FORWARD_TIME:
            return m.format('DD-MM-YYYY hh:mm A');

        case TimeFormat.TIME24HR:
            return m.format('HH:mm');

        case TimeFormat.TIME12HR:
            return m.format('hh:mm A');

        case TimeFormat.DATETIME12HR:
            return m.format('DD/MM/YYYY hh:mm A');

        case TimeFormat.DATETIME24HR:
            return m.format('DD/MM/YYYY HH:mm');

        case TimeFormat.FULLREADABLE:
            return m.format('DD MMMM YYYY, hh:mm A');

        case TimeFormat.FULLREADABLE_WITH_DAY:
            return m.format('dddd, DD MMMM YYYY, hh:mm A');

        case TimeFormat.MONTH_DAY:
            return m.format('MMM D');

        case TimeFormat.UNIX:
            return m.unix();

        case TimeFormat.TIMESTAMP:
            return m.valueOf();

        case TimeFormat.CALENDAR:
            return m.calendar();

        case TimeFormat.ICALUTC:
            return m.utc().format('YYYYMMDDTHHmmss[Z]');

        case TimeFormat.EMAIL_DETAIL_DATE:
            return m.format('ddd, DD-MM-YYYY hh:mm A');

        case TimeFormat.JS_LOCAL:
            return m.toDate().toString();

        case TimeFormat.CALENDAR_EVENT_LISTDATE:
            return m.format('MMM, YYYY, ddd');

        case TimeFormat.CALENDAR_EVENT_LISTDATE_ONLY_DATE:
            return m.format('D');

        case TimeFormat.CALENDAR_SEARCH:
            return m.format('ddd, hh:mm A');

        case TimeFormat.SCHEDULE_DATE:
            return m.format('DD MMM, YYYY, hh:mm A');

        case TimeFormat.EVENT_MAIL_FORMAT:
            return m.format('DD-MM-YYYY HH:mm');

        case TimeFormat.SCHEDULE_MODAL:
            return m.format('DD-MM-YYYY');
        default:
            return m.toISOString();
    }
}

function formatTime(hours: number, minutes: number): string {
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function formatTime12HrFrom24HrString(time24: string | null | undefined): string {
    if (!time24) return '';
    const m = moment(time24, 'HH:mm', true);
    if (!m.isValid()) return '';
    return m.format('hh:mm A');
}

function formatTime24HrFrom12HrString(time12: string | null | undefined): string {
    if (!time12) return '';
    const m = moment(time12, 'hh:mm A', true);
    if (!m.isValid()) return '';
    return m.format('HH:mm');
}

const parseDateForFlatpickr = (dateString: string | undefined) => {
    if (!dateString) return undefined;

    try {
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);

            if (isNaN(date.getTime())) {
                return undefined;
            }

            return date;
        }

        // Fallback for other formats
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? undefined : date;
    } catch (error) {
        return undefined;
    }
};

export { formatDate, formatTime, formatTime12HrFrom24HrString, formatTime24HrFrom12HrString, parseDateForFlatpickr };