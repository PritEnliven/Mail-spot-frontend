import SubmitButton from '@components/ui/form/SubmitButton';
import { showError } from '@components/ui/toast/toastNotification';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import type { FieldErrors, SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import CreateRuleActionsFields from './CreateRuleActionsFields';
import { createRuleSchema, type CreateRuleFormValues } from './CreateRuleForm.schema';

interface CreateRuleFormProps {
    isModalOpen: boolean;
    onReset: () => void;
    submitForm: SubmitHandler<CreateRuleFormValues>;
}

interface LabelOption {
    value: string;
    label: string;
}

const CreateRuleForm = ({ isModalOpen, onReset, submitForm }: CreateRuleFormProps) => {
    const { sidebarState } = useMailData();
    const { openModal } = useMailUI();
    const [validLabels, setValidLabels] = useState<LabelOption[]>([]);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
    } = useForm<CreateRuleFormValues>({
        resolver: zodResolver(createRuleSchema),
        defaultValues: {
            markAsRead: false,
            moveToFolder: false,
            selectedFolder: '',
            forwardIt: false,
            forwardEmails: [],
            deleteIt: false,
            applyTheLabel: false,
            neverSendToSpam: false,
        },
    });

    const loadAllLabels = async () => {
        const validSystemBoxes = new Set(['spam', 'junk', 'bin']);

        const validBoxes = [
            ...sidebarState.boxes.filter((box: any) => validSystemBoxes.has(box.key.toLowerCase())),
            ...(sidebarState.customBoxes || []),
        ];

        const options = validBoxes.map((box: any) => ({
            value: typeof box.value === 'object' ? box.value?.value : box.value,
            label: box.key,
        }));

        setValidLabels(options);
    };

    useEffect(() => {
        loadAllLabels();
    }, [isModalOpen]);

    const onForwardEmailSubmit = (data: any) => {
        setValue('forwardEmails', data.forwardToEmailList || []);
    };

    const openForwardItModal = () => {
        const currentForwardItEmail = getValues('forwardEmails') || [];
        openModal('forwardIt', {
            initialForwardEmailList: currentForwardItEmail,
            onConfirm: onForwardEmailSubmit,
        });
    };

    const forwardItChecked = watch('forwardIt');
    const moveToFolderChecked = watch('moveToFolder');

    const onSubmit = (data: CreateRuleFormValues) => {
        submitForm(data);
        reset();
    };

    const handleReset = () => {
        reset();
        onReset();
    };

    return (
        <div className={`dropdown-menu dropdown-menu-end t-filter-dropdown-menu more-list search-create-filter-cmt ${isModalOpen ? 'show' : ''}`}>
            <div className="filter-body">
                <CreateRuleActionsFields
                    control={control}
                    setValue={setValue}
                    moveToFolderChecked={moveToFolderChecked}
                    forwardItChecked={forwardItChecked}
                    validLabels={validLabels}
                    onOpenForwardModal={openForwardItModal}
                    idPrefix="create-filter"
                />
            </div>
            <div className="filter-footer">
                <button type="button" className="btn-new create-filter-cancel-btn" onClick={handleReset}>
                    Reset
                </button>
                <SubmitButton
                    className="btn-new loading-spinner"
                    onClick={handleSubmit(onSubmit, (errors: FieldErrors<CreateRuleFormValues>) => {
                        if (errors.forwardEmails?.message) {
                            showError(String(errors.forwardEmails.message));
                            return;
                        }
                        showError('Please fix the form errors before saving');
                    })}
                >
                    Save
                </SubmitButton>
            </div>
        </div>
    );
};

export default CreateRuleForm;
