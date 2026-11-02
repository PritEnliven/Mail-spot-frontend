import { getPasswordValidationError } from '@utils/passwordValidation';
import { z } from 'zod';

export const adminSettingsSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  fileSize: z.number().min(1, "File size must be greater than 0"),
  fileExtensionInput: z.array(z.string().min(1)).optional(),
  send: z.boolean(),
  receive: z.boolean(),
  both: z.boolean(),
  aiFeatures: z.boolean(),
  status: z.boolean(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  const password = data.password?.trim() ?? '';
  const confirmPassword = data.confirmPassword?.trim() ?? '';
  if (!password && !confirmPassword) return;

  if (!password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a new password',
      path: ['password'],
    });
  } else {
    const error = getPasswordValidationError(password);
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
        path: ['password'],
      });
    }
  }

  if (password !== confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });
  }
}).transform((data) => ({
  ...data,
  both: data.send && data.receive,
}))



export type AdminSettingsFormValues = z.infer<typeof adminSettingsSchema>;
