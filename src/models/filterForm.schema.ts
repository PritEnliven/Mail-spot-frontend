import { z } from 'zod';

export const filterFormSchema = z.object({
  from: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required'),
  to: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  attachmentSize: z.string().optional().or(z.literal('')),
  dateRange: z.string().optional().or(z.literal('')),
});

export type FilterFormValues = z.infer<typeof filterFormSchema>;
