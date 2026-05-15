import { z } from "zod";

export const AdminChangePasswordSchema = z
  .object({
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
    confirmPassword: z.string().min(8, { message: 'Confirm password must be at least 8 characters long' })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type AdminChangePasswordFormValues = z.infer<typeof AdminChangePasswordSchema>;
