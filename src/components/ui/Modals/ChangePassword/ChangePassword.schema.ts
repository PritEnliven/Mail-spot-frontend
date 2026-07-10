import { passwordSchema } from "@utils/passwordValidation";
import { z } from "zod";

export const ChangePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof ChangePasswordSchema>;
