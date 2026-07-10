import { z } from "zod";

export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "lowercase",
    label: "one lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "one uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "one number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "one special character",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export const PASSWORD_REQUIREMENTS_MESSAGE = `Password must include ${PASSWORD_RULES.map(
  (rule) => rule.label.charAt(0).toLowerCase() + rule.label.slice(1)
).join(", ")}.`;

export function getPasswordValidationError(password: string): string | null {
  const isValid = PASSWORD_RULES.every((rule) => rule.test(password));
  return isValid ? null : PASSWORD_REQUIREMENTS_MESSAGE;
}

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .superRefine((value, ctx) => {
    const error = getPasswordValidationError(value);
    if (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error,
      });
    }
  });
