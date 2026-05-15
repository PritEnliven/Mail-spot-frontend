import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { composeSchema } from '@features/compose/compose.schema';
import type { ComposeFormValues } from '@features/compose/compose.schema';

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
