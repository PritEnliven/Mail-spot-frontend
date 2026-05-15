import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { filterEmailForm, type FilterEmailFormValues } from '@components/layout/header/filterEmailForm.schema';

export function useFilterEmailForm() {
  return useForm<FilterEmailFormValues>({
    resolver: zodResolver(filterEmailForm),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      from: [],
      to: [],
      subject: '',
      attachmentSizeType: undefined,
      dateRange: undefined,
    },
  });
}
