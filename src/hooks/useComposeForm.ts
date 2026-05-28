import type { ComposeFormValues } from '@features/compose/compose.schema';
import { composeSchema } from '@features/compose/compose.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function useComposeForm() {
  return useForm<ComposeFormValues>({
    resolver: zodResolver(composeSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      body: '',
    },
  });
}
