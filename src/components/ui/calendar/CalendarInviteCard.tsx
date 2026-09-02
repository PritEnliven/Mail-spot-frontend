import { showError } from '@components/ui/toast/toastNotification';
import addPersonIcon from '@images/add-pesion-icon.svg';
import eventIcon from '@images/event-icon.svg';
import locationIcon from '@images/location-icon-16.svg';
import type { CalendarPartstat, Email } from '@models/Email';
import { rsvpEvent } from '@services/calendar/calendarService';
import clockIcon from '@images/clock-icon.svg';
import nameIcon from "@images/name-icon-16.svg";
import {
    canRenderCalendarInviteCard,
    formatInviteWhen,
    getCalendarInviteMethod,
    normalizePartstat,
    personLabel,
    replyPartstatVerb,
} from '@utils/calendarInviteUtil';
import { useEffect, useMemo, useState } from 'react';

const RSVP_ACTIONS: { partstat: Exclude<CalendarPartstat, 'NEEDS-ACTION'>; label: string }[] = [
    { partstat: 'ACCEPTED', label: 'Yes' },
    { partstat: 'TENTATIVE', label: 'Maybe' },
    { partstat: 'DECLINED', label: 'No' },
];

const RSVP_STATUS_LABEL: Record<Exclude<CalendarPartstat, 'NEEDS-ACTION'>, string> = {
    ACCEPTED: 'Accepted',
    TENTATIVE: 'Maybe',
    DECLINED: 'Declined',
};

interface CalendarInviteCardProps {
    email: Pick<Email, 'id' | '_id' | 'from' | 'calendarInvite'>;
}

function CalendarInviteCard({ email }: CalendarInviteCardProps) {
    const invite = email.calendarInvite;
    const emailId = email._id || email.id;
    const [myPartstat, setMyPartstat] = useState<CalendarPartstat>(() =>
        normalizePartstat(invite?.myPartstat || invite?.partstat)
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (invite?.myPartstat) {
            setMyPartstat(normalizePartstat(invite.myPartstat));
        }
    }, [invite?.myPartstat]);

    const method = getCalendarInviteMethod(invite);
    const title = invite?.title || invite?.summary || 'Calendar event';
    const when = invite ? formatInviteWhen(invite) : '';
    const where = invite?.location || '';
    const organizer = personLabel(invite?.organizer);
    const attendees = useMemo(
        () => (invite?.attendees || []).map((attendee) => personLabel(attendee)).filter(Boolean),
        [invite?.attendees],
    );

    if (!invite || !canRenderCalendarInviteCard(invite)) return null;

    if (method === 'REPLY') {
        const responder =
            invite.responderName ||
            email.from?.[0]?.name ||
            email.from?.[0]?.email ||
            'Someone';
        const verb = replyPartstatVerb(invite.attendeePartstat || invite.partstat || invite.myPartstat);
        return (
            <div className="calendar-invite-card-wrap" onClick={(e) => e.stopPropagation()}>
                <div className="calendar-invite-reply-banner" role="status">
                    {responder} {verb} {title}
                </div>
            </div>
        );
    }

    const isCancelled = method === 'CANCEL';
    const hasResponded = myPartstat !== 'NEEDS-ACTION';
    const actionsDisabled = isCancelled || isSubmitting || !emailId;

    const handleRsvp = async (partstat: Exclude<CalendarPartstat, 'NEEDS-ACTION'>) => {
        if (actionsDisabled || partstat === myPartstat) return;
        const previous = myPartstat;
        setMyPartstat(partstat);
        setIsSubmitting(true);
        try {
            const response = await rsvpEvent({ _id: emailId, partstat });
            if (response.statusCode !== 200) {
                setMyPartstat(previous);
                showError(response.message || 'Failed to send RSVP');
                return;
            }
            const nextPartstat = response.data?.calendarInvite?.myPartstat || response.data?.myPartstat;
            if (nextPartstat) setMyPartstat(normalizePartstat(nextPartstat));
        } catch {
            setMyPartstat(previous);
            showError('Failed to send RSVP');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="calendar-invite-card-wrap" onClick={(e) => e.stopPropagation()}>
        <div
            className={`calendar-invite-card ${isCancelled ? 'is-cancelled' : ''} ${hasResponded ? `is-${myPartstat.toLowerCase()}` : ''}`}
        >
            <div className="calendar-invite-card__header">
                <div className="calendar-invite-card__heading">
                    <img src={eventIcon} alt="" className="calendar-invite-card__heading-icon" />
                    <p className="calendar-invite-card__title mb-0">{title}</p>
                </div>
                {hasResponded && (
                    <span className={`calendar-invite-card__status is-${myPartstat.toLowerCase()}`}>
                        {RSVP_STATUS_LABEL[myPartstat]}
                    </span>
                )}
            </div>
            {isCancelled && (
                <p className="calendar-invite-card__cancelled mb-0">This event was cancelled</p>
            )}

            <div className="calendar-invite-card__body">
                {when && (
                    <div className="calendar-invite-card__row">
                        <span className="calendar-invite-card__label">
                            <img src={clockIcon} alt="clock"  />
                            When
                        </span>
                        <span className="calendar-invite-card__value">{when}</span>
                    </div>
                )}
                {where && (
                    <div className="calendar-invite-card__row">
                        <span className="calendar-invite-card__label">
                            <img src={locationIcon} alt="" />
                            Where
                        </span>
                        <span className="calendar-invite-card__value">{where}</span>
                    </div>
                )}
                {organizer && (
                    <div className="calendar-invite-card__row">
                        <span className="calendar-invite-card__label">
                             <img src={nameIcon} alt="" />
                            Organizer
                        </span>
                        <span className="calendar-invite-card__value">{organizer}</span>
                    </div>
                )}
                {attendees.length > 0 && (
                    <div className="calendar-invite-card__row">
                        <span className="calendar-invite-card__label">
                            <img src={addPersonIcon} alt="" />
                            Attendees
                        </span>
                        <span className="calendar-invite-card__value">{attendees.join(', ')}</span>
                    </div>
                )}
            </div>

            {!isCancelled && (
                <div className="calendar-invite-card__actions">
                    {RSVP_ACTIONS.filter((action) => action.partstat !== myPartstat).map((action) => (
                        <button
                            key={action.partstat}
                            type="button"
                            className={`calendar-invite-card__btn is-${action.partstat.toLowerCase()}`}
                            disabled={actionsDisabled}
                            onClick={() => handleRsvp(action.partstat)}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
        </div>
    );
}

export default CalendarInviteCard;
