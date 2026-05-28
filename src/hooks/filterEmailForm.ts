import { zodResolver } from '@hookform/resolvers/zod';
import type { FilterFormValues } from '@models/filterForm.schema';
import { filterFormSchema } from '@models/filterForm.schema';
import { useForm } from 'react-hook-form';

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
