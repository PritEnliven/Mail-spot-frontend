import { z } from 'zod';

export const loginSchema = z.object({
  //email is required then check email format
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
