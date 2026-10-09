import type {
    CalendarShare,
    CalendarSharePermission,
    UserCalendar,
} from '@models/CalendarModels';
import type { ApiResponse } from '@models/Response';
import { deleteData, postData } from '../apiService';

interface AddCalendarPayload {
    name: string;
    color?: string;
}

interface EditCalendarPayload {
    calendarId: string;
    name?: string;
    color?: string;
}

interface DeleteCalendarPayload {
    calendarId: string;
}

interface GetCalendarsData {
    calendars: UserCalendar[];
}

interface CalendarMutationData {
    message: string;
    calendar: UserCalendar;
}

interface DeleteCalendarData {
    message: string;
    calendarId: string;
    movedToCalendarId: string;
}

interface ShareInviteItem {
    email: string;
    permission: CalendarSharePermission;
}

interface ShareCalendarPayload {
    calendarId: string;
    shares: ShareInviteItem[];
}

interface ShareCalendarResult {
    share?: CalendarShare;
    inviteSent?: boolean;
    updated?: boolean;
}

interface ShareCalendarError {
    email: string;
    error: string;
}

interface ShareCalendarData {
    results: ShareCalendarResult[];
    errors: ShareCalendarError[];
}

interface ListCalendarSharesPayload {
    calendarId: string;
}

interface ListCalendarSharesData {
    shares: CalendarShare[];
}

interface UpdateCalendarSharePayload {
    shareId: string;
    permission: CalendarSharePermission;
}

interface RevokeCalendarSharePayload {
    shareId: string;
}

async function getCalendars(): Promise<ApiResponse<GetCalendarsData>> {
    try {
        const response = await postData('calendar/get', {});
        return response;
    } catch (error: any) {
        console.error('Error fetching calendars:', error);
        return error;
    }
}

async function addCalendar(payload: AddCalendarPayload): Promise<ApiResponse<CalendarMutationData>> {
    try {
        const response = await postData('calendar/add', payload);
        return response;
    } catch (error: any) {
        console.error('Error creating calendar:', error);
        return error;
    }
}

async function editCalendar(payload: EditCalendarPayload): Promise<ApiResponse<CalendarMutationData>> {
    try {
        const response = await postData('calendar/edit', payload);
        return response;
    } catch (error: any) {
        console.error('Error editing calendar:', error);
        return error;
    }
}

async function deleteCalendar(payload: DeleteCalendarPayload): Promise<ApiResponse<DeleteCalendarData>> {
    try {
        const response = await deleteData('calendar/delete', payload);
        return response;
    } catch (error: any) {
        console.error('Error deleting calendar:', error);
        return error;
    }
}

async function shareCalendar(payload: ShareCalendarPayload): Promise<ApiResponse<ShareCalendarData>> {
    try {
        const response = await postData('calendar/share', payload);
        return response;
    } catch (error: any) {
        console.error('Error sharing calendar:', error);
        return error;
    }
}

async function listCalendarShares(
    payload: ListCalendarSharesPayload
): Promise<ApiResponse<ListCalendarSharesData>> {
    try {
        const response = await postData('calendar/share/list', payload);
        return response;
    } catch (error: any) {
        console.error('Error listing calendar shares:', error);
        return error;
    }
}

async function updateCalendarShare(
    payload: UpdateCalendarSharePayload
): Promise<ApiResponse<{ share?: CalendarShare; message?: string }>> {
    try {
        const response = await postData('calendar/share/update', payload);
        return response;
    } catch (error: any) {
        console.error('Error updating calendar share:', error);
        return error;
    }
}

async function revokeCalendarShare(
    payload: RevokeCalendarSharePayload
): Promise<ApiResponse<{ message?: string }>> {
    try {
        const response = await postData('calendar/share/revoke', payload);
        return response;
    } catch (error: any) {
        console.error('Error revoking calendar share:', error);
        return error;
    }
}

export {
    addCalendar,
    deleteCalendar,
    editCalendar,
    getCalendars,
    listCalendarShares,
    revokeCalendarShare,
    shareCalendar,
    updateCalendarShare,
};
export type { ShareInviteItem };
