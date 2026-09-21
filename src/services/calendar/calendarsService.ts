import type { UserCalendar } from '@models/CalendarModels';
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

export { addCalendar, deleteCalendar, editCalendar, getCalendars };
