import { z } from 'zod';

export const composeSchema = z.object({
  to: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one recipient is required'),

  subject: z
    .string(),

  cc: z
    .array(z.string().email('Invalid email address'))
    .optional(),

  bcc: z
    .array(z.string().email('Invalid email address'))
    .optional(),

  body: z
    .string()
    .optional()
    .or(z.literal('')),
});

export type ComposeFormValues = z.infer<typeof composeSchema>;
