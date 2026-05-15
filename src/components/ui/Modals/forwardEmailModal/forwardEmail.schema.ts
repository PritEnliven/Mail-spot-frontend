import { z } from 'zod';

export const forwardEmailSchema = z.object({
    forwardToEmailList: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one recipient is required'),
});

export type forwardEmailFormValues = z.infer<typeof forwardEmailSchema>;
