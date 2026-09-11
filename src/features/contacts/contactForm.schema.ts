import { z } from 'zod';

export const CONTACT_MAX_EMAILS = 5;
export const CONTACT_MAX_PHONES = 5;
export const CONTACT_MAX_PHONE_LENGTH = 18;

const emailFieldSchema = z.object({
    value: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .email('Enter a valid email address'),
});

const phoneValueSchema = z
    .string()
    .trim()
    .max(CONTACT_MAX_PHONE_LENGTH, `Phone must be at most ${CONTACT_MAX_PHONE_LENGTH} characters`)
    .refine(
        (value) => value === '' || /^[+\d]+$/.test(value),
        'Phone can only contain numbers and +',
    );

const phoneFieldSchema = z.object({
    value: phoneValueSchema,
});

export const contactFormSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    emails: z
        .array(emailFieldSchema)
        .min(1, 'At least one email is required')
        .max(CONTACT_MAX_EMAILS, `Maximum ${CONTACT_MAX_EMAILS} emails allowed`),
    phones: z
        .array(phoneFieldSchema)
        .max(CONTACT_MAX_PHONES, `Maximum ${CONTACT_MAX_PHONES} phones allowed`),
    notes: z.string().optional(),
    address: z.string().optional(),
    birthdate: z.string().optional(),
});

export type ContactFormSchemaValues = z.infer<typeof contactFormSchema>;

export function sanitizePhoneInput(value: string) {
    return value.replace(/[^\d+]/g, '').slice(0, CONTACT_MAX_PHONE_LENGTH);
}
