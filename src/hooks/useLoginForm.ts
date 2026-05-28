import type { LoginFormValues } from "@features/login/login.schema";
import { loginSchema } from "@features/login/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function useLoginForm() {
    return useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: 'onSubmit',
        reValidateMode: 'onSubmit',
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        }
    })
}