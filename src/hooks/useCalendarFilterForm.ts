import { calendarFilterFormSchema, type CalendarFilterFormValues } from '@components/ui/calendar/calendarHeader/calendarFilterForm.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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
