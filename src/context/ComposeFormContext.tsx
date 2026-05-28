import type { ComposeFormValues } from '@features/compose/compose.schema';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ComposeSubmitHandler = (
    data: ComposeFormValues,
    scheduleAt?: string
) => void | Promise<void>;

interface ComposeFormContextType {
    formData: ComposeFormValues | null;
    setFormData: (data: ComposeFormValues) => void;
    /** Returns validated compose values, or null if invalid / no validator registered */
    validateForm: () => Promise<ComposeFormValues | null>;
    registerSubmitHandler: (handler: ComposeSubmitHandler | null) => void;
    submitComposeForm: (data: ComposeFormValues, scheduleAt?: string) => Promise<void>;
    setTriggerValidation: (trigger: () => Promise<ComposeFormValues | null>) => void;
    scheduleDateTime: string | null;
    setScheduleDateTime: (dateTime: string | null) => void;
}

const ComposeFormContext = createContext<ComposeFormContextType | undefined>(undefined);

export const useComposeFormContext = () => {
    const ctx = useContext(ComposeFormContext);
    if (!ctx) throw new Error('useComposeFormContext must be used inside ComposeFormProvider');
    return ctx;
};

interface ComposeFormProviderProps {
    children: ReactNode;
}

export const ComposeFormProvider = ({ children }: ComposeFormProviderProps) => {
    const [formData, setFormData] = useState<ComposeFormValues | null>(null);
    const [scheduleDateTime, setScheduleDateTime] = useState<string | null>(null);
    const [triggerValidation, setTriggerValidationState] = useState<(() => Promise<ComposeFormValues | null>) | null>(null);
    const submitHandlerRef = useRef<ComposeSubmitHandler | null>(null);

    const registerSubmitHandler = useCallback((handler: ComposeSubmitHandler | null) => {
        submitHandlerRef.current = handler;
    }, []);

    const submitComposeForm = useCallback(async (data: ComposeFormValues, scheduleAt?: string) => {
        const handler = submitHandlerRef.current;
        if (!handler) {
            throw new Error('Compose submit handler is not registered');
        }
        await handler(data, scheduleAt);
    }, []);

    const setTriggerValidation = useCallback((trigger: () => Promise<ComposeFormValues | null>) => {
        setTriggerValidationState(() => trigger);
    }, []);

    const validateForm = useCallback(async (): Promise<ComposeFormValues | null> => {
        if (triggerValidation) {
            return await triggerValidation();
        }
        return null;
    }, [triggerValidation]);

    const value = useMemo(() => ({
        formData,
        setFormData,
        validateForm,
        registerSubmitHandler,
        submitComposeForm,
        setTriggerValidation,
        scheduleDateTime,
        setScheduleDateTime,
    }), [formData, validateForm, registerSubmitHandler, submitComposeForm, setTriggerValidation, scheduleDateTime]);

    return (
        <ComposeFormContext.Provider value={value}>
            {children}
        </ComposeFormContext.Provider>
    );
};
