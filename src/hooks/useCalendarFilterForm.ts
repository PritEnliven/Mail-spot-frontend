import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { calendarFilterFormSchema, type CalendarFilterFormValues } from '@components/ui/calendar/calendarHeader/calendarFilterForm.schema';

export function useCalendarFilterForm() {
  return useForm<CalendarFilterFormValues>({
    resolver: zodResolver(calendarFilterFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      searchIn: 'allCalendar',
      eventName: '',
      calendarFilterOrganizer: [],
      eventLocation: '',
      eventDate: [],
    },
  });
}
