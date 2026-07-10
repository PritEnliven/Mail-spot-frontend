import { passwordSchema } from "@utils/passwordValidation";
import { z } from "zod";

export const AdminChangePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type AdminChangePasswordFormValues = z.infer<typeof AdminChangePasswordSchema>;
