// filterEmailForm.schema.ts
import { z } from 'zod';

export const filterEmailForm = z.object({
    searchTerm: z.string().optional(),
    from: z.array(z.string().email('Invalid email address')).optional(),

    to: z.array(z.string().email('Invalid email address')).optional(),

    subject: z
        .string()
        .trim()
        .max(255, 'Subject too long')
        .optional()
        .or(z.literal('')),

    attachmentSizeType: z
        .enum(['small', 'medium', 'large'])
        .optional(),

    dateRange: z
        .tuple([z.date(), z.date()])
        .optional()
        .or(z.literal(undefined))
        .or(z.array(z.date()).length(0)),
});

export type FilterEmailFormValues = z.infer<typeof filterEmailForm>;
