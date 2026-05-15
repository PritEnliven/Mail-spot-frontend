import { z } from 'zod';

export const calendarFilterFormSchema = z.object({
  searchIn: z.enum([ 'allCalendar','thisMonth']),
  eventName: z.string().optional(),
  calendarFilterOrganizer: z.array(z.string()),
  eventLocation: z.string().optional(),
  eventDate: z.array(z.date()).optional(),
});

export type CalendarFilterFormValues = z.infer<typeof calendarFilterFormSchema>;
