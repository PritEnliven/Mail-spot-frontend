import { z } from "zod";

export const customRecurrenceFormSchema = z.object({
    interval: z.number().min(1),
    intervalUnit: z.enum(["daily", "weekly", "monthly", "yearly"]),
    weekDay: z.array(z.string()).optional(),
    recurrenceEnd: z.enum(["never", "endOn", "after"]),
    endDate: z.string().optional(),
    numberOfOccurrences: z.number().optional(),
});

export type CustomRecurrenceFormValues =
    z.infer<typeof customRecurrenceFormSchema>;
