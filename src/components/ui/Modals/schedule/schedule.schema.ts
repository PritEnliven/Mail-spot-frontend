import { z } from 'zod';

export const scheduleFormSchema = z.object({
    scheduleDateTime: z.string().datetime({ message: 'Invalid ISO datetime' }),
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;
