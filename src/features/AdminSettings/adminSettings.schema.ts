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
  status: z.boolean()
}).refine(
  (data) => {
    if (data.both) {
      return data.send && data.receive;
    }
    return true;
  },
  {
    message: "When 'Both' is enabled, Send and Receive must be enabled",
    path: ["both"],
  }
)



export type AdminSettingsFormValues = z.infer<typeof adminSettingsSchema>;
