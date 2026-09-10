import { z } from 'zod';

export const CONTACT_MAX_EMAILS = 5;
export const CONTACT_MAX_PHONES = 5;

const emailFieldSchema = z.object({
    value: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .email('Enter a valid email address'),
});

const phoneFieldSchema = z.object({
    value: z.string(),
});

export const contactFormSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    emails: z
        .array(emailFieldSchema)
        .min(1, 'At least one email is required')
        .max(CONTACT_MAX_EMAILS, `Maximum ${CONTACT_MAX_EMAILS} emails allowed`),
    phones: z
        .array(phoneFieldSchema)
        .max(CONTACT_MAX_PHONES, `Maximum ${CONTACT_MAX_PHONES} phones allowed`)
        .default([{ value: '' }]),
    notes: z.string().optional(),
    address: z.string().optional(),
    birthdate: z.string().optional(),
});

export type ContactFormSchemaValues = z.infer<typeof contactFormSchema>;
