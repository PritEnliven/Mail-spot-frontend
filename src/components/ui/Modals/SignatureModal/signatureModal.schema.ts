import { z } from 'zod';

export const signatureModalSchema = z.object({
   signatureName:z.string().min(1, 'Signature name is required'),
   isDefaultSignature: z.boolean(),
});

export type signatureModalFormValues = z.infer<typeof signatureModalSchema>;
