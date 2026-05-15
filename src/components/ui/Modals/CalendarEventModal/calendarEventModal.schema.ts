import { z } from 'zod';

export const calendarEventModalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  eventColor: z.string(),
  eventStartDate: z.string().min(1, 'Start date is required'),
  eventStartTime: z.string().optional(),
  eventEndDate: z.string().min(1, 'End date is required'),
  eventEndTime: z.string().optional(),
  allDayCheckbox: z.boolean(),
  recurrence: z.string(),
  guestsList: z.array(z.string()),
  eventLocation: z.string().optional(),
  eventMeetingLink: z.string().optional(),
  eventDescription: z.string().optional(),
  sendMailToGuest: z.boolean(),
  eventTimeZone: z.string(),
});

export type CalendarEventModalFormValues = z.infer<typeof calendarEventModalSchema>;
