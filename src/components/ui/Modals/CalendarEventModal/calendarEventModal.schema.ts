import { z } from 'zod';

export const calendarEventModalSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  eventColor: z.string().min(1, 'Event color is required'),
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
  eventTimeZone: z.string().min(1, 'Time zone is required'),
}).superRefine((data, ctx) => {
  if (!data.allDayCheckbox) {
    if (!data.eventStartTime?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start time is required',
        path: ['eventStartTime'],
      });
    }
    if (!data.eventEndTime?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time is required',
        path: ['eventEndTime'],
      });
    }
  }
});

export type CalendarEventModalFormValues = z.infer<typeof calendarEventModalSchema>;
