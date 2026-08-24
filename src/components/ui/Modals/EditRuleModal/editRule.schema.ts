import { ATTACHMENT_SIZE_LABELS } from '@constants/attachmentSizeOptions';
import { z } from 'zod';

export const editRuleSchema = z.object({
    markAsRead: z.boolean().default(false),
    moveToFolder: z.boolean().default(false),
    selectedFolder: z.string().optional(),
    forwardIt: z.boolean().default(false),
    forwardEmails: z.array(z.string().email()).default([]),
    deleteIt: z.boolean().default(false),
    applyTheLabel: z.boolean().default(false),
    neverSendToSpam: z.boolean().default(false),
    from: z.array(z.string()).optional(),
    to: z.array(z.string()).optional(),
    subject: z.string().optional(),
    attachmentSize: z.enum(ATTACHMENT_SIZE_LABELS as [string, ...string[]]).optional().or(z.literal('')),
    dateRange: z.array(z.date()).max(2).optional(),
}).superRefine((data, ctx) => {
    if (data.forwardIt && data.forwardEmails.length === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['forwardEmails'],
            message: 'Add at least one forward recipient before saving',
        });
    }
});

export type EditRuleFormValues = z.infer<typeof editRuleSchema>;
