import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterPageSchema } from '@features/register/RegisterPage.schema';
import type { RegisterPageFormValues } from '@features/register/RegisterPage.schema';

export function useRegisterForm() {
  return useForm<RegisterPageFormValues>({
    resolver: zodResolver(RegisterPageSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      imapEmail: '',
      imapPassword: '',
      imapServer: '',
      imapPort: '',
      secureType: undefined,
      smtpUsername: '', 
      smtpPassword: '',
      smtpHost: '',
      smtpPort: '',
      smtpSecurityType: undefined,
      rememberMe: false,
    },
  });
}
