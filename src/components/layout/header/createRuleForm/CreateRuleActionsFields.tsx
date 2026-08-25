import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import type { CreateRuleFormValues } from './CreateRuleForm.schema';

interface LabelOption {
    value: string;
    label: string;
}

interface CreateRuleActionsFieldsProps {
    control: Control<CreateRuleFormValues>;
    setValue: UseFormSetValue<CreateRuleFormValues>;
    moveToFolderChecked: boolean;
    forwardItChecked: boolean;
    validLabels: LabelOption[];
    onOpenForwardModal: () => void;
    idPrefix?: string;
}

const CreateRuleActionsFields = ({
    control,
    setValue,
    moveToFolderChecked,
    forwardItChecked,
    validLabels,
    onOpenForwardModal,
    idPrefix = 'create-filter',
}: CreateRuleActionsFieldsProps) => {
    const check1 = `${idPrefix}-check1`;
    const check4 = `${idPrefix}-check4`;
    const check5 = `${idPrefix}-check5`;
    const check6 = `${idPrefix}-check6`;
    const check7 = `${idPrefix}-check7`;
    const forwardEmails = useWatch({ control, name: 'forwardEmails' }) || [];
    const hasForwardRecipients = Array.isArray(forwardEmails) && forwardEmails.length > 0;

    return (
        <>
            <div className="form-group d-flex align-items-center">
                <div className="mail-received-check-btn me-2">
                    <Controller
                        name="markAsRead"
                        control={control}
                        render={({ field }) => (
                            <div className="blue checkbox-custom table-check">
                                <input
                                    type="checkbox"
                                    id={check1}
                                    className="list-child"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                                <label htmlFor={check1} className="label-text" />
                            </div>
                        )}
                    />
                </div>
                <label htmlFor={check1} className="control-label m-0 create-filter-check">
                    Mark As Read
                </label>
            </div>

            <div className="form-group d-flex align-items-center">
                <div className="mail-received-check-btn me-2">
                    <Controller
                        name="moveToFolder"
                        control={control}
                        render={({ field }) => (
                            <div className="blue checkbox-custom table-check">
                                <input
                                    type="checkbox"
                                    id={check4}
                                    className="list-child"
                                    checked={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.target.checked);
                                        if (!e.target.checked) {
                                            setValue('selectedFolder', '');
                                        }
                                    }}
                                />
                                <label htmlFor={check4} className="label-text" />
                            </div>
                        )}
                    />
                </div>
                <div className="control-label m-0 create-filter-check w-100 align-items-center d-flex justify-content-between">
                    <label htmlFor={check4} className="me-2 label-span flex-grow-1">
                        Apply the label:
                    </label>
                    <div onClick={(e) => e.stopPropagation()} className="flex-grow-1">
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
                                    isDisabled={!moveToFolderChecked}
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
                            <div className="blue checkbox-custom table-check">
                                <input
                                    type="checkbox"
                                    id={check5}
                                    className="list-child"
                                    checked={field.value}
                                    onChange={(e) => {
                                        field.onChange(e.target.checked);
                                        if (!e.target.checked) {
                                            setValue('forwardEmails', []);
                                        }
                                    }}
                                />
                                <label htmlFor={check5} className="label-text" />
                            </div>
                        )}
                    />
                </div>
                <div className="d-flex align-items-center justify-content-between w-100">
                    <label htmlFor={check5} className="control-label m-0 create-filter-check">
                        <span className="label-span me-2 flex-grow-1">Forward it</span>
                    </label>
                    <button
                        type="button"
                        className="btn w-100 flex-grow-1"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onOpenForwardModal();
                        }}
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
                            <div className="blue checkbox-custom table-check">
                                <input
                                    type="checkbox"
                                    id={check6}
                                    className="list-child"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                                <label htmlFor={check6} className="label-text" />
                            </div>
                        )}
                    />
                </div>
                <label htmlFor={check6} className="control-label m-0 create-filter-check">
                    Delete it
                </label>
            </div>

            <div className="form-group d-flex align-items-center">
                <div className="mail-received-check-btn me-2">
                    <Controller
                        name="neverSendToSpam"
                        control={control}
                        render={({ field }) => (
                            <div className="blue checkbox-custom table-check">
                                <input
                                    type="checkbox"
                                    id={check7}
                                    className="list-child"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                                <label htmlFor={check7} className="label-text" />
                            </div>
                        )}
                    />
                </div>
                <label htmlFor={check7} className="control-label m-0 create-filter-check">
                    Never send it to Spam
                </label>
            </div>
        </>
    );
};

export default CreateRuleActionsFields;
