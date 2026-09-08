import { z } from 'zod';

export const contactFormSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z.string().trim().optional(),
});

export type ContactFormSchemaValues = z.infer<typeof contactFormSchema>;
