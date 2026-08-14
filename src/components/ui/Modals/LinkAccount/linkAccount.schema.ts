import { z } from 'zod';

export const emailStepSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const passwordStepSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const externalStepSchema = z.object({
  imapHost: z.string().min(1, 'IMAP host is required'),
  imapPort: z
    .string()
    .min(1, 'IMAP port is required')
    .regex(/^\d+$/, 'Port must be a number'),
  imapPassword: z.string().min(1, 'IMAP password is required'),
  imapSecureType: z.enum(['tls', 'ssl', 'none']),
  imapService: z.string().optional(),
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z
    .string()
    .min(1, 'SMTP port is required')
    .regex(/^\d+$/, 'Port must be a number'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
  smtpSecureType: z.enum(['tls', 'ssl', 'none']),
  smtpUsername: z.string().min(1, 'SMTP username is required'),
});

export type EmailStepValues = z.infer<typeof emailStepSchema>;
export type PasswordStepValues = z.infer<typeof passwordStepSchema>;
export type ExternalStepValues = z.infer<typeof externalStepSchema>;
