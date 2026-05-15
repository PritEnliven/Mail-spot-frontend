import { z } from "zod";

export const ForgotPageSchema = z
  .object({
    // Step 1
    email: z.string().min(1, "Email is required").email("Invalid email address"),

    // Step 2 – OTP
    otp: z.string().length(6, "OTP must be 6 digits"),

    // Step 3 – Reset Password
    password: z.string().min(8, "Password must be at least 8 characters").optional(),

    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters").optional(),
  })
  .superRefine((data, ctx) => {
    // Only validate password match when both are present
    if (data.password || data.confirmPassword) {
      if (!data.password) {
        ctx.addIssue({
          path: ["password"],
          message: "Password is required",
          code: z.ZodIssueCode.custom,
        });
      }

      if (!data.confirmPassword) {
        ctx.addIssue({
          path: ["confirmPassword"],
          message: "Confirm password is required",
          code: z.ZodIssueCode.custom,
        });
      }

      if (
        data.password &&
        data.confirmPassword &&
        data.password !== data.confirmPassword
      ) {
        ctx.addIssue({
          path: ["confirmPassword"],
          message: "Passwords do not match",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

export type ForgotPageFormValues = z.infer<typeof ForgotPageSchema>;
