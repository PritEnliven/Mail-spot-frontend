import { z } from 'zod';

export const adminLoginSchema = z.object({
    //email is required then check email format
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean(),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
