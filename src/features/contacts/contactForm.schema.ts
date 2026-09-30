import { z } from 'zod';
import {
    DEFAULT_PHONE_COUNTRY_CODE,
    PHONE_DIAL_CODES_BY_LENGTH,
} from '@constants/phoneCountryCodes';

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

const phoneNationalSchema = z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d+$/.test(value), 'Phone can only contain numbers');

const phoneFieldSchema = z
    .object({
        countryCode: z.string().min(1, 'Country code is required'),
        value: phoneNationalSchema,
    })
    .superRefine((phone, ctx) => {
        const national = phone.value.trim();
        if (!national) return;

        const merged = mergePhoneParts(phone.countryCode, national);
        if (merged.length > CONTACT_MAX_PHONE_LENGTH) {
            ctx.addIssue({
                code: 'custom',
                message: `Phone must be at most ${CONTACT_MAX_PHONE_LENGTH} characters`,
                path: ['value'],
            });
        }
        if (!/^[+\d]+$/.test(merged)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Phone can only contain numbers and +',
                path: ['value'],
            });
        }
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

export type ContactPhoneFormValue = ContactFormSchemaValues['phones'][number];

/** National number only — digits, capped so dial + national stay within max length. */
export function sanitizePhoneInput(value: string, countryCode: string = DEFAULT_PHONE_COUNTRY_CODE) {
    const digits = value.replace(/\D/g, '');
    const dialLen = countryCode.replace(/[^\d+]/g, '').length;
    const maxNational = Math.max(0, CONTACT_MAX_PHONE_LENGTH - dialLen);
    return digits.slice(0, maxNational);
}

export function mergePhoneParts(countryCode: string, national: string): string {
    const dial = countryCode.trim();
    const number = national.trim().replace(/\D/g, '');
    if (!number) return '';
    if (!dial) return number;
    return `${dial}${number}`;
}

export function splitPhoneParts(raw: string): ContactPhoneFormValue {
    const cleaned = raw.replace(/[^\d+]/g, '').trim();
    if (!cleaned) {
        return { countryCode: DEFAULT_PHONE_COUNTRY_CODE, value: '' };
    }

    // Only treat as international when the stored value includes a leading +.
    if (cleaned.startsWith('+')) {
        for (const dial of PHONE_DIAL_CODES_BY_LENGTH) {
            if (cleaned.startsWith(dial)) {
                return {
                    countryCode: dial,
                    value: cleaned.slice(dial.length).replace(/\D/g, ''),
                };
            }
        }
    }

    return {
        countryCode: DEFAULT_PHONE_COUNTRY_CODE,
        value: cleaned.replace(/\D/g, ''),
    };
}

export function toPhoneFormValues(phones: string[]): ContactPhoneFormValue[] {
    if (phones.length === 0) {
        return [{ countryCode: DEFAULT_PHONE_COUNTRY_CODE, value: '' }];
    }
    return phones.map((phone) => splitPhoneParts(phone));
}
