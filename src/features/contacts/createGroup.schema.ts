import { z } from 'zod';

export const createGroupFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, { message: 'Group name is required' })
        .max(100, { message: 'Group name must be 100 characters or less' }),
    memberIds: z.array(z.string()).default([]),
});

export type CreateGroupFormValues = z.infer<typeof createGroupFormSchema>;
