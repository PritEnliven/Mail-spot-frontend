import type { CalendarSharePermission, UserCalendar } from '@models/CalendarModels';

function isOwnedCalendar(calendar: UserCalendar): boolean {
    return !calendar.isShared;
}

function canWriteEvents(calendar: UserCalendar): boolean {
    if (isOwnedCalendar(calendar)) return true;
    return calendar.permission === 'edit' || calendar.permission === 'manage';
}

function canManageShares(calendar: UserCalendar): boolean {
    if (isOwnedCalendar(calendar)) return true;
    return calendar.permission === 'manage';
}

function canLeaveShare(calendar: UserCalendar): boolean {
    return Boolean(calendar.isShared && calendar.shareId);
}

function writableCalendars(calendars: UserCalendar[]): UserCalendar[] {
    return calendars.filter(canWriteEvents);
}

function permissionLabel(permission?: CalendarSharePermission): string {
    if (permission === 'edit') return 'Edit';
    if (permission === 'manage') return 'Manage';
    return 'View';
}

export {
    canLeaveShare,
    canManageShares,
    canWriteEvents,
    isOwnedCalendar,
    permissionLabel,
    writableCalendars,
};
