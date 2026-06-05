import { z } from 'zod';

export interface Signature {
  id: string;
  name: string;
  body: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const SignatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  body: z.string(),
  isDefault: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const SettingsSchema = z.object({
  undoSendPeriod: z
    .number()
    .min(0, 'Undo send period must be at least 0 seconds')
    .max(30, 'Undo send period must be at most 30 seconds'),

  maximumPageSize: z
    .number()
    .min(10, 'Page size must be at least 10')
    .max(30, 'Page size must be at most 30'),

  recoveryEmail: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),

  signatureId: z.string().optional(),
  enableSignature: z.boolean(),
  enableReplyForwardUse: z.boolean(),
  threadView: z.boolean(),
  downloadLocation: z.string().optional(),
  notification: z.boolean(),
  body: z.string().optional(),
});

export type SettingPageFormValues = z.infer<typeof SettingsSchema> & {
  signatures?: Signature[];
};
