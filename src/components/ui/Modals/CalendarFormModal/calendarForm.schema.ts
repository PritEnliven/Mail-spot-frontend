import { z } from 'zod';

export const DEFAULT_CALENDAR_COLOR = '#49BA14';

export const calendarFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, { message: 'Calendar name is required' })
        .max(100, { message: 'Calendar name must be 100 characters or less' }),
    color: z.string().min(1, 'Please select a color'),
});

export type CalendarFormValues = z.infer<typeof calendarFormSchema>;
