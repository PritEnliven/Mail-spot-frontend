import { z } from "zod";

export const createAiLabelFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, { message: "Label name is required" })
        .max(100, { message: "Label name must be 100 characters or less" }),
    labelIconColor: z.string().min(1, "Please select a color"),
    rulePrompt: z
        .string()
        .trim()
        .min(1, { message: "Label prompt is required" })
        .max(2000, { message: "Label prompt must be 2000 characters or less" }),
    labelId: z.string().optional(),
    isEdit: z.boolean().optional(),
});

export type CreateAiLabelFormValues = z.infer<typeof createAiLabelFormSchema>;
