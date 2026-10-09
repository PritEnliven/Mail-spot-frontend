import { useAccount } from '@context/AccountContext';
import { useCalendar } from '@context/CalendarContext';
import { useMailUI } from '@context/MailUIContext';
import { useSocketEvent } from '@hooks/useSocket';
import {
    emailsMatch,
    type CalendarEventSocketPayload,
    type CalendarRemovedSocketPayload,
    type CalendarShareSocketPayload,
} from '@utils/calendarLiveSyncUtil';

const SHARE_LIST_REFRESH_EVENT = 'mailspot:calendar-share-list-refresh';

function dispatchShareListRefresh(calendarId: string) {
    window.dispatchEvent(
        new CustomEvent(SHARE_LIST_REFRESH_EVENT, { detail: { calendarId } })
    );
}

function closeCalendarModalsForCalendar(
    calendarId: string,
    activeModals: Array<{ id: string; type: string | null; props?: Record<string, any> }>,
    closeModal: (id?: string) => void
) {
    for (const modal of activeModals) {
        if (modal.type === 'eventInfo') {
            const eventCalendarId = modal.props?.event?.calendarId;
            if (eventCalendarId && String(eventCalendarId) === String(calendarId)) {
                closeModal(modal.id);
            }
            continue;
        }
        if (modal.type === 'calendarEvent') {
            const eventCalendarId = modal.props?.calendarId;
            if (eventCalendarId && String(eventCalendarId) === String(calendarId)) {
                closeModal(modal.id);
            }
            continue;
        }
        if (modal.type === 'shareCalendar') {
            if (String(modal.props?.calendarId || '') === String(calendarId)) {
                closeModal(modal.id);
            }
        }
    }
}

function closeEventModalsForEvent(
    eventId: string,
    activeModals: Array<{ id: string; type: string | null; props?: Record<string, any> }>,
    closeModal: (id?: string) => void
) {
    for (const modal of activeModals) {
        if (modal.type !== 'eventInfo' && modal.type !== 'calendarEvent') continue;
        const openId = modal.props?.event?.id || modal.props?.id;
        if (openId && String(openId) === String(eventId)) {
            closeModal(modal.id);
        }
    }
}

/**
 * Live sync for shared calendars — same Socket.IO connection as mail / event:rsvp.
 */
export const useCalendarSocket = () => {
    const { activeAccountEmail } = useAccount();
    const {
        calendars,
        fetchCalendars,
        updateCalendarPermission,
        removeCalendarLocally,
        upsertLiveEvent,
        removeLiveEvent,
        getAllEventList,
        setSelectedEvent,
    } = useCalendar();
    const { activeModals, closeModal } = useMailUI();

    useSocketEvent('calendar:share', (payload: CalendarShareSocketPayload) => {
        if (!payload?.calendarId || !payload?.action) return;

        const selfEmail = activeAccountEmail;
        const isInvitee = emailsMatch(selfEmail, payload.inviteeEmail);
        const isOwner = emailsMatch(selfEmail, payload.ownerEmail);
        const knownShared = calendars.find(
            (calendar) =>
                calendar._id === payload.calendarId &&
                calendar.isShared &&
                (!payload.shareId || calendar.shareId === payload.shareId)
        );

        if (payload.action === 'permission_updated') {
            if (isInvitee || knownShared) {
                updateCalendarPermission(payload.calendarId, payload.permission);
            }
            if (isOwner) {
                dispatchShareListRefresh(payload.calendarId);
            }
            return;
        }

        if (payload.action === 'revoked') {
            if (isInvitee || knownShared) {
                removeCalendarLocally(payload.calendarId);
                closeCalendarModalsForCalendar(payload.calendarId, activeModals, closeModal);
                setSelectedEvent(null);
            }
            if (isOwner) {
                dispatchShareListRefresh(payload.calendarId);
            }
            return;
        }

        if (payload.action === 'accepted') {
            if (isInvitee) {
                void fetchCalendars({ ensureSelectedIds: [payload.calendarId] });
            }
            if (isOwner) {
                dispatchShareListRefresh(payload.calendarId);
            }
            return;
        }

        if (payload.action === 'declined') {
            if (isOwner) {
                dispatchShareListRefresh(payload.calendarId);
            }
        }
    });

    useSocketEvent('calendar:event', (payload: CalendarEventSocketPayload) => {
        if (!payload?.calendarId || !payload?.action || !payload?.eventId) return;

        if (payload.action === 'deleted') {
            removeLiveEvent(payload.eventId);
            closeEventModalsForEvent(payload.eventId, activeModals, closeModal);
            return;
        }

        if (payload.action === 'added' || payload.action === 'updated') {
            if (payload.event) {
                upsertLiveEvent(payload.calendarId, payload.eventId, {
                    ...payload.event,
                    calendarId: payload.event.calendarId || payload.calendarId,
                });
                return;
            }
            void getAllEventList();
        }
    });

    useSocketEvent('calendar:removed', (payload: CalendarRemovedSocketPayload) => {
        if (!payload?.calendarId) return;
        removeCalendarLocally(payload.calendarId);
        closeCalendarModalsForCalendar(payload.calendarId, activeModals, closeModal);
        setSelectedEvent(null);
    });
};

export { SHARE_LIST_REFRESH_EVENT };
