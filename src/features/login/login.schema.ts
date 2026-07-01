import { z } from 'zod';

export const loginSchema = z.object({
  //email is required then check email format
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(12, 'Password must be at most 12 characters'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
