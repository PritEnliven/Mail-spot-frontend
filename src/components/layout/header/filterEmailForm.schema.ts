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

    hasWord: z
        .string()
        .trim()
        .max(255, 'Has the words too long')
        .optional()
        .or(z.literal('')),

    doesNotHave: z
        .string()
        .trim()
        .max(255, "Doesn't have too long")
        .optional()
        .or(z.literal('')),

    attachmentSize: z
        .enum(ATTACHMENT_SIZE_LABELS as [string, ...string[]])
        .optional(),

    dateRange: z
        .array(z.date())
        .max(2)
        .optional(),

    /** Restrict search to one mailbox; omit/empty = all boxes except drafts */
    boxName: z
        .string()
        .trim()
        .optional()
        .or(z.literal('')),
});

export type FilterEmailFormValues = z.infer<typeof filterEmailForm>;
