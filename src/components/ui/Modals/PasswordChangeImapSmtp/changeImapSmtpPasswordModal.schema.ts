import { z } from "zod";

export const changeImapSmtpPasswordSchema = z
  .object({
    imapPassword: z.string().min(8, "Password must be at least 8 characters"),
    imapServer: z.string().min(1, "IMAP server is required"),
    imapPort: z.number().min(1).max(65535),
    imapSecurityType: z.enum(["tls", "startls", "None"]),
    smtpPassword: z.string().min(1, "SMTP password is required"),
    smtpServer: z.string().min(1, "SMTP server is required"),
    smtpPort: z.number().min(1).max(65535),
    smtpSecurityType: z.enum(["tls", "startls", "None"]),
    smtpHost: z.string().min(1, "SMTP host is required"),
  });

export type changeImapSmtpPasswordFormValues = z.infer<typeof changeImapSmtpPasswordSchema>;
