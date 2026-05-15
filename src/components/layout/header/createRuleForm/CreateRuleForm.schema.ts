import { z } from 'zod';

export const createRuleSchema = z.object({
    markAsRead: z.boolean().default(false),
    moveToFolder: z.boolean().default(false),
    selectedFolder: z.string().optional(),
    forwardIt: z.boolean().default(false),
    forwardEmails: z.array(z.string().email()).default([]),
    deleteIt: z.boolean().default(false),
    applyTheLabel: z.boolean().default(false),
    neverSendToSpam: z.boolean().default(false),
}).required({
    markAsRead: true,
    moveToFolder: true,
    forwardIt: true,
    forwardEmails: true,
    deleteIt: true,
    applyTheLabel: true,
    neverSendToSpam: true,
});

export type CreateRuleFormValues = {
    markAsRead: boolean;
    moveToFolder: boolean;
    selectedFolder?: string;
    forwardIt: boolean;
    forwardEmails: string[];
    deleteIt: boolean;
    applyTheLabel: boolean;
    neverSendToSpam: boolean;
};