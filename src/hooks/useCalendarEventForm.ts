import { calendarEventModalSchema } from '@components/ui/Modals/CalendarEventModal/calendarEventModal.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDate, TimeFormat } from '@utils/dateUtil';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type CalendarEventFormValues = z.infer<typeof calendarEventModalSchema>;

export const useCalendarEventForm = () => {
    const today = formatDate(new Date(), TimeFormat.YYYYMMDD) as string;

    const form = useForm<CalendarEventFormValues>({
        resolver: zodResolver(calendarEventModalSchema),
        defaultValues: {
            title: '',
            eventColor: '',
            calendarId: '',
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
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        shouldFocusError: true,
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
