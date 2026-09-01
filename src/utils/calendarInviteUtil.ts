import type { Guest } from '@components/ui/calendar/GuestTag';
import type { CalendarInvite, CalendarInvitePerson, CalendarPartstat } from '@models/Email';
import { formatDate, TimeFormat } from './dateUtil';

export type GuestPartstatGroup = 'going' | 'maybe' | 'notGoing' | 'awaiting';

export const GUEST_PARTSTAT_GROUPS: { key: GuestPartstatGroup; label: string }[] = [
    { key: 'going', label: 'Going' },
    { key: 'maybe', label: 'Maybe' },
    { key: 'notGoing', label: 'Not going' },
    { key: 'awaiting', label: 'Awaiting' },
];

export const isIcsFilename = (filename?: string): boolean =>
    !!filename && /\.ics$/i.test(filename);

export const normalizePartstat = (value?: string | null): CalendarPartstat => {
    const raw = (value || '').toUpperCase().replace(/[_\s-]/g, '');
    if (raw === 'ACCEPTED' || raw === 'YES' || raw === 'GOING') return 'ACCEPTED';
    if (raw === 'TENTATIVE' || raw === 'MAYBE') return 'TENTATIVE';
    if (raw === 'DECLINED' || raw === 'NO' || raw === 'NOTGOING') return 'DECLINED';
    return 'NEEDS-ACTION';
};

export const partstatGroup = (value?: string | null): GuestPartstatGroup => {
    const partstat = normalizePartstat(value);
    if (partstat === 'ACCEPTED') return 'going';
    if (partstat === 'TENTATIVE') return 'maybe';
    if (partstat === 'DECLINED') return 'notGoing';
    return 'awaiting';
};

export const personLabel = (person?: CalendarInvitePerson | string | null): string => {
    if (!person) return '';
    if (typeof person === 'string') return person;
    return person.name || person.email || '';
};

export const formatInviteWhen = (invite: CalendarInvite): string => {
    const start = invite.start || invite.startDate;
    const end = invite.end || invite.endDate;
    const allDay = invite.allDay || invite.fullDay;

    if (!start) return '';

    const startLabel = formatDate(
        start,
        allDay ? TimeFormat.DD_MM_YYYY : TimeFormat.EMAIL_DETAIL_DATE,
    );

    if (allDay) {
                if (end && end !== start) {
            const endLabel = formatDate(end, TimeFormat.DD_MM_YYYY);
            return `${startLabel} – ${endLabel} (all day)`;
        }
        return `${startLabel} (all day)`;
    }

    if (!end) return String(startLabel);

    const startDate = new Date(start);
    const endDate = new Date(end);
    const sameDay =
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        startDate.toDateString() === endDate.toDateString();

    if (sameDay) {
        const endTime = formatDate(end, TimeFormat.CALENDAR_SEARCH);
        return `${startLabel} – ${String(endTime).replace(/^[^,]*,\s*/, '')}`;
    }

    return `${startLabel} – ${formatDate(end, TimeFormat.EMAIL_DETAIL_DATE)}`;
};

export const replyPartstatVerb = (partstat?: string | null): string => {
    const normalized = normalizePartstat(partstat);
    if (normalized === 'ACCEPTED') return 'accepted';
    if (normalized === 'TENTATIVE') return 'tentatively accepted';
    if (normalized === 'DECLINED') return 'declined';
    return 'responded to';
};

export const groupGuestsByPartstat = (guests: Guest[]): Record<GuestPartstatGroup, Guest[]> => {
    const groups: Record<GuestPartstatGroup, Guest[]> = {
        going: [],
        maybe: [],
        notGoing: [],
        awaiting: [],
    };
    for (const guest of guests) {
        groups[partstatGroup(guest.partstat)].push(guest);
    }
    return groups;
};
