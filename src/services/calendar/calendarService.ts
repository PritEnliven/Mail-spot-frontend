import type { CalendarEvent } from '@models/CalendarModels';
import type { ApiResponse } from '@models/Response';
import { deleteData, getData, postData } from '../apiService';

interface getAlLEventPayload {
    start: string;
    end: string;
}

interface createEventPayload {
    title: string;
    startDate: string;
    endDate: string;
    allDayCheckbox: boolean;
    location?: string;
    meetingLink?: string;
    description?: string;
    timeZone: string;
    eventColor: string;
    recurrence?: string | null;
    sendMailToGuest: boolean;
    guest?: string;
}

interface editEventPayload {
    eventId: string;
    title: string;
    eventColor: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    allDayCheckbox: boolean;
    recurrence: any;
    location?: string;
    meetingLink?: string;
    description?: string;
    attachments?: any;
    eventEditType?: string;
    editEventDate?: Date;
    sendMailToGuest: boolean;
    type: string;
}

interface deleteEventPayload {
    eventDate: Date | undefined
    eventId: string
    recurringEventType: 'thisEvent' | 'thisAndFollowingEvent' | 'allEvent'
}

interface calendarSearchEvent {
    searchText: string
}

interface SearchEventResponse {
    eventList: CalendarEvent[];
}

interface FilterEventPayload {
    eventName?: string | undefined;
    eventLocation?: string | undefined;
    calendarFilterOrganizer?: string[] | undefined;
    searchIn?: string | undefined;
    eventDate?: string | undefined;
}

async function getAllEvents(payload: getAlLEventPayload): Promise<ApiResponse<CalendarEvent[]>> {
    try {
        const response = await postData('event/get', payload);
        return response;
    } catch (error: any) {
        console.error('Error fetching events:', error);
        return error;
    }
}

async function createEvent(payload: createEventPayload): Promise<ApiResponse<CalendarEvent>> {
    try {
        const response = await postData('event/add', payload);
        return response;
    } catch (error: any) {
        console.error('Error creating event:', error);
        return error;
    }
}

async function editEvent(payload: editEventPayload): Promise<ApiResponse<CalendarEvent>> {
    try {
        const response = await postData('event/edit', payload);
        return response;
    } catch (error: any) {
        console.error('Error editing event:', error);
        return error;
    }
}

async function deleteEvent(payload: deleteEventPayload): Promise<ApiResponse<CalendarEvent>> {
    try {
        const response = await deleteData('event/delete', payload);
        return response;
    } catch (error: any) {
        console.error('Error editing event:', error);
        return error;
    }
}

async function getEventById(id: string): Promise<ApiResponse<CalendarEvent>> {
    try {
        const response = await getData(`event/get/${id}`);
        return response;
    } catch (error: any) {
        console.error('Error creating event:', error);
        return error;
    }
}

async function searchEvent(payload: calendarSearchEvent): Promise<ApiResponse<SearchEventResponse>> {
    try {
        const response = await postData('event/searchEvent', payload);
        return response;
    } 
    catch (error: any) {
        console.error('Error searching event:', error);
        return error;
    }
}

async function filterEvents(payload: FilterEventPayload): Promise<ApiResponse<any>> {
    try {
        const response = await postData('event/filterEvent', payload);
        return response;
    } catch (error: any) {
        console.error('Error searching event:', error);
        return error;
    }
}


async function getAllSearchEventList(payload: FilterEventPayload): Promise<ApiResponse<any>> {
    try {
        const response = await postData('event/getAllEventsList', payload);
        return response;
    } catch (error: any) {
        console.error('Error searching event:', error);
        return error;
    }
}

interface rsvpEventPayload {
    _id: string;
    partstat: 'ACCEPTED' | 'TENTATIVE' | 'DECLINED';
}

async function rsvpEvent(payload: rsvpEventPayload): Promise<ApiResponse<any>> {
    try {
        const response = await postData('event/rsvp', payload);
        return response;
    } catch (error: any) {
        console.error('Error sending RSVP:', error);
        return error;
    }
}

export {
    createEvent, deleteEvent, editEvent, filterEvents, getAllEvents, getAllSearchEventList, getEventById, rsvpEvent, searchEvent
};