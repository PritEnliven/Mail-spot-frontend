import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { filterFormSchema } from '@models/filterForm.schema';
import type { FilterFormValues } from '@models/filterForm.schema';

export function useFilterEmailForm() {
  return useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      from: [],
      to: [],
      subject: '',
      attachmentSize: '',
      dateRange: '',
    },
  });
}
