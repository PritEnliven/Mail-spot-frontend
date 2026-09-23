import { passwordSchema } from '@utils/passwordValidation';
import { z } from 'zod';

export const RegisterPageSchema = z.object({
  // Step 1
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: passwordSchema,

  // Step 2 – IMAP
  imapEmail: z.string().min(1, "Email is required").email("Invalid IMAP email"),
  imapPassword: z.string().min(1, "IMAP password is required"),
  imapServer: z.string().min(1, "IMAP server is required"),
  imapPort: z
    .string()
    .min(1, "Required")
    .regex(/^\d+$/, "Port must be a number"),
  secureType: z.enum(["tls", "startls", "None"], {  
    message: "Security type is required",
  }),

  // Step 3 – SMTP
  smtpUsername: z.string().min(1, "Email is required").email("Invalid email address"),
  smtpPassword: z.string().optional(),
  smtpHost: z.string().min(1, "SMTP server is required"),
  smtpPort: z
    .string()
    .min(1, "Required")
    .regex(/^\d+$/, "Port must be a number"),
  smtpSecurityType: z.enum(["tls", "startls", "None"], {
    message: "Security type is required",
  }),

  rememberMe: z.boolean().optional(),
});

export type RegisterPageFormValues = z.infer<typeof RegisterPageSchema>;
