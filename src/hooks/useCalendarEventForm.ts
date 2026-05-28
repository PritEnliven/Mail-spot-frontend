import { calendarEventModalSchema } from '@components/ui/Modals/CalendarEventModal/calendarEventModal.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type CalendarEventFormValues = z.infer<typeof calendarEventModalSchema>;

export const useCalendarEventForm = () => {
    const today = new Date().toISOString().split('T')[0];

    const form = useForm<CalendarEventFormValues>({
        resolver: zodResolver(calendarEventModalSchema),
        defaultValues: {
            title: '',
            eventColor: '#FF8A00',
            eventStartDate: today,
            eventStartTime: '',
            eventEndDate: today,
            eventEndTime: '',
            allDayCheckbox: true,
            recurrence: 'doesNotRepeat',
            guestsList: [],
            eventLocation: '',
            eventMeetingLink: '',
            eventDescription: '',
            sendMailToGuest: false,
            eventTimeZone: 'Asia/Kolkata',
        },
        mode: 'onChange',
    });

    const getFormData = () => form.getValues();

    const toggleAllDay = () => {
        const current = form.getValues('allDayCheckbox');
        form.setValue('allDayCheckbox', !current, {
            shouldDirty: true,
        });
    };

    const resetForm = () => {
        form.reset();
    };

    return {
        ...form,
        getFormData,
        toggleAllDay,
        resetForm,
    };
};
