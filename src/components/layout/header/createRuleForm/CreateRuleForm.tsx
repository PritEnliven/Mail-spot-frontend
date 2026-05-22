import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import SubmitButton from '@components/ui/form/SubmitButton';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
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
            neverSendToSpam: false,
        },
    });

    const loadAllLabels = async () => {
        const validSystemBoxes = new Set(['spam', 'junk', 'bin']);

        const validBoxes = [
            ...sidebarState.boxes.filter((box: any) => validSystemBoxes.has(box.key.toLowerCase())),
            ...(sidebarState.customBoxes || [])
        ];

        const options = validBoxes.map(
            (box: any) => ({
                value: typeof box.value === 'object' ? box.value?.value : box.value,
                label: box.key,
            })
        );

        setValidLabels(options);
    }

    useEffect(() => {
        loadAllLabels();
    }, [isModalOpen]);

    const onForwardEmailSubmit = (data: any) => {
        setValue('forwardEmails', data.forwardToEmailList || []);
    }

    const openForwardItModal = () => {
        const currentForwardItEmail = getValues('forwardEmails') || [];
        openModal('forwardIt',
            {
                initialForwardEmailList: currentForwardItEmail,
                onConfirm: onForwardEmailSubmit
            }
        );
    }

    const forwardItChecked = watch('forwardIt');

    const onSubmit = (data: any) => {
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
                <div className="form-group d-flex align-items-center">
                    <div className="mail-received-check-btn me-2">
                        <Controller
                            name="markAsRead"
                            control={control}
                            render={({ field }) => (
                                <div className="checkbox-custom table-check">
                                    <input
                                        type="checkbox"
                                        id="create-filter-check1"
                                        className="list-child"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                    <label htmlFor="create-filter-check1" className="label-text" />
                                </div>
                            )}
                        />
                    </div>
                    <label htmlFor="create-filter-check1" className="control-label m-0 create-filter-check">
                        Mark As Read
                    </label>
                </div>

                <div className="form-group d-flex align-items-center">
                    <div className="mail-received-check-btn me-2">
                        <Controller
                            name="moveToFolder"
                            control={control}
                            render={({ field }) => (
                                <div className="checkbox-custom table-check">
                                    <input
                                        type="checkbox"
                                        id="create-filter-check4"
                                        className="list-child"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                    <label htmlFor="create-filter-check4" className="label-text" />
                                </div>
                            )}
                        />
                    </div>
                    <div className="control-label m-0 create-filter-check w-100 align-items-center d-flex justify-content-between">
                        <label htmlFor="create-filter-check4" className="me-2 label-span flex-grow-1">
                            Apply the label:
                        </label>
                        <div onClick={(e) => e.stopPropagation()} className='flex-grow-1'>
                            <Controller
                                name="selectedFolder"
                                control={control}
                                render={({ field }) => (
                                    <Select2Wrapper
                                        value={field.value || null}
                                        onChange={(value) => field.onChange(value)}
                                        options={validLabels}
                                        placeholder="Select one"
                                        isMulti={false}
                                        isModal={true}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group d-flex align-items-center">
                    <div className="mail-received-check-btn me-2">
                        <Controller
                            name="forwardIt"
                            control={control}
                            render={({ field }) => (
                                <div className="checkbox-custom table-check">
                                    <input
                                        type="checkbox"
                                        id="create-filter-check5"
                                        className="list-child"
                                        checked={field.value}
                                        onChange={(e) => {
                                            field.onChange(e.target.checked);
                                            if (!e.target.checked) {
                                            }
                                        }}
                                    />
                                    <label htmlFor="create-filter-check5" className="label-text" />
                                </div>
                            )}
                        />
                    </div>
                    <div className='d-flex align-items-center justify-content-between w-100'>
                        <label htmlFor="create-filter-check5" className="control-label m-0 create-filter-check">
                            <span className="label-span me-2 flex-grow-1">Forward it</span>
                        </label>
                        <button
                            type="button"
                            className="btn w-100 flex-grow-1"
                            onClick={openForwardItModal}
                            disabled={!forwardItChecked}
                        >
                            Add Forward
                        </button>
                    </div>
                </div>

                <div className="form-group d-flex align-items-center">
                    <div className="mail-received-check-btn me-2">
                        <Controller
                            name="deleteIt"
                            control={control}
                            render={({ field }) => (
                                <div className="checkbox-custom table-check">
                                    <input
                                        type="checkbox"
                                        id="create-filter-check6"
                                        className="list-child"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                    <label htmlFor="create-filter-check6" className="label-text" />
                                </div>
                            )}
                        />
                    </div>
                    <label htmlFor="create-filter-check6" className="control-label m-0 create-filter-check">
                        Delete it
                    </label>
                </div>

                <div className="form-group d-flex align-items-center">
                    <div className="mail-received-check-btn me-2">
                        <Controller
                            name="neverSendToSpam"
                            control={control}
                            render={({ field }) => (
                                <div className="checkbox-custom table-check">
                                    <input
                                        type="checkbox"
                                        id="create-filter-check7"
                                        className="list-child"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                    />
                                    <label htmlFor="create-filter-check7" className="label-text" />
                                </div>
                            )}
                        />
                    </div>
                    <label htmlFor="create-filter-check7" className="control-label m-0 create-filter-check">
                        Never send it to Spam
                    </label>
                </div>
            </div>
            <div className="filter-footer">
                <button type="button" className="btn-new create-filter-cancel-btn" onClick={handleReset} onSubmit={handleReset}>Reset</button>
                <SubmitButton
                    className="btn-new loading-spinner"
                    onClick={handleSubmit(onSubmit, (errors: any) => {
                        console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                    })}
                >
                    Save
                </SubmitButton>
            </div>
        </div>
    );
};

export default CreateRuleForm;