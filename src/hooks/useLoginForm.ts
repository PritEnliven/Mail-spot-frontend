import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@features/login/login.schema";
import type { LoginFormValues } from "@features/login/login.schema";

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