import { ATTACHMENT_SIZE_LABELS } from '@constants/attachmentSizeOptions';
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

    attachmentSize: z
        .enum(ATTACHMENT_SIZE_LABELS as [string, ...string[]])
        .optional(),

    dateRange: z
        .array(z.date())
        .max(2)
        .optional(),
});

export type FilterEmailFormValues = z.infer<typeof filterEmailForm>;
