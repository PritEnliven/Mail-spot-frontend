import { passwordSchema } from '@utils/passwordValidation';
import { z } from 'zod';

export const RegisterPageSchema = z.object({
  // Step 1
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: passwordSchema,


  // Step 2 – IMAP
  imapEmail: z.string().email("Invalid IMAP email").optional(),
  imapPassword: z.string().min(1, "IMAP password is required").optional(),
  imapServer: z.string().min(1, "IMAP server is required").optional(),
  imapPort: z.string().regex(/^\d+$/, "Port must be a number").optional(),
  secureType: z.enum(["tls", "startls", "None"]).optional(),

  // Step 3 – SMTP
  smtpUsername: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.string().regex(/^\d+$/, "Port must be a number").optional(),
  smtpSecurityType: z.enum(["tls", "startls", "None"]).optional(),

  rememberMe: z.boolean().optional(),
}).refine(
  (data) => {
    // Require IMAP fields only if user proceeds to step 2
    if (data.imapEmail || data.imapPassword || data.imapServer) {
      return !!data.imapEmail && !!data.imapPassword && !!data.imapServer && !!data.imapPort;
    }
    return true;
  },
  { message: "Complete IMAP configuration", path: ["imapEmail"] }
);

export type RegisterPageFormValues = z.infer<typeof RegisterPageSchema>;
