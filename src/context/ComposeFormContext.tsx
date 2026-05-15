import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { ComposeFormValues } from '@features/compose/compose.schema';
import type { SubmitHandler } from 'react-hook-form';

interface ComposeFormContextType {
    formData: ComposeFormValues | null;
    setFormData: (data: ComposeFormValues) => void;
    validateForm: () => Promise<boolean>;
    handleSubmit: SubmitHandler<ComposeFormValues> | null;
    setHandleSubmit: (handler: SubmitHandler<ComposeFormValues>) => void;
    setTriggerValidation: (trigger: () => Promise<boolean>) => void;
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
    const [handleSubmit, setHandleSubmit] = useState<SubmitHandler<ComposeFormValues> | null>(null);
    const [scheduleDateTime, setScheduleDateTime] = useState<string | null>(null);
    const [triggerValidation, setTriggerValidationState] = useState<(() => Promise<boolean>) | null>(null);

    const setTriggerValidation = useCallback((trigger: () => Promise<boolean>) => {
        setTriggerValidationState(() => trigger);
    }, []);

    const validateForm = useCallback(async (): Promise<boolean> => {
        if (triggerValidation) {
            return await triggerValidation();
        }
        return Promise.resolve(false);
    }, [triggerValidation]);

    const value = useMemo(() => ({
        formData,
        setFormData,
        validateForm,
        handleSubmit,
        setHandleSubmit,
        setTriggerValidation,
        scheduleDateTime,
        setScheduleDateTime,
    }), [formData, validateForm, handleSubmit, setHandleSubmit, setTriggerValidation, scheduleDateTime]);

    return (
        <ComposeFormContext.Provider value={value}>
            {children}
        </ComposeFormContext.Provider>
    );
};
