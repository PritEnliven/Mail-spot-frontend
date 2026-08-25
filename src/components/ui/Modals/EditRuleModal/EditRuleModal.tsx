import CreateRuleActionsFields from '@components/layout/header/createRuleForm/CreateRuleActionsFields';
import type { CreateRuleFormValues } from '@components/layout/header/createRuleForm/CreateRuleForm.schema';
import BaseModal from '@components/ui/BaseModal';
import SubmitButton from '@components/ui/form/SubmitButton';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import type { Rule } from '@components/ui/settings/RulesList';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useContacts } from '@context/ContactsContext';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { zodResolver } from '@hookform/resolvers/zod';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import { editRule } from '@services/settings/settingsService';
import { useCallback, useEffect, useState } from 'react';
import type { Control, FieldErrors, Resolver, UseFormSetValue } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import SimpleBar from 'simplebar-react';
import EditRuleConditionsFields from './EditRuleConditionsFields';
import {
    actionsFromFormValues,
    buildRuleName,
    conditionsFromFormValues,
    formValuesFromRule,
    forwardEmailsFromActions,
} from './editRule.mapper';
import { editRuleSchema, type EditRuleFormValues } from './editRule.schema';

interface LabelOption {
    value: string;
    label: string;
}

interface EditRuleModalProps {
    modalId: string;
    zIndex: number;
    rule: Rule;
    onSuccess?: () => void;
}

function EditRuleModal({ modalId, zIndex, rule, onSuccess }: EditRuleModalProps) {
    const { closeModal, openModal, activeModals } = useMailUI();
    const { sidebarState } = useMailData();
    const { contacts, fetchContacts } = useContacts();
    const [validLabels, setValidLabels] = useState<LabelOption[]>([]);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
    } = useForm<EditRuleFormValues>({
        resolver: zodResolver(editRuleSchema) as Resolver<EditRuleFormValues>,
        defaultValues: formValuesFromRule(rule),
    });

    const loadAllLabels = () => {
        const validSystemBoxes = new Set(['spam', 'junk', 'bin']);
        const validBoxes = [
            ...sidebarState.boxes.filter((box: any) => validSystemBoxes.has(box.key.toLowerCase())),
            ...(sidebarState.customBoxes || []),
        ];
        setValidLabels(validBoxes.map((box: any) => ({
            value: typeof box.value === 'object' ? box.value?.value : box.value,
            label: box.key,
        })));
    };

    useEffect(() => {
        loadAllLabels();
    }, [sidebarState]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        reset(formValuesFromRule(rule));
    }, [rule._id, reset]);

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onForwardEmailSubmit = useCallback((data: any) => {
        setValue('forwardEmails', data.forwardToEmailList || [], {
            shouldDirty: true,
            shouldValidate: true,
        });
    }, [setValue]);

    const openForwardItModal = useCallback(() => {
        const fromForm = (getValues('forwardEmails') || []).filter(Boolean);
        const fromRule = forwardEmailsFromActions(rule.actions);
        openModal('forwardIt', {
            initialForwardEmailList: [...new Set(fromForm.length ? fromForm : fromRule)],
            onConfirm: onForwardEmailSubmit,
        });
    }, [getValues, openModal, onForwardEmailSubmit, rule.actions]);

    const isForwardItOpen = activeModals.some((modal) => modal.type === 'forwardIt');

    const onSubmit = async (data: EditRuleFormValues) => {
        const conditions = conditionsFromFormValues(data, rule.conditions);
        if (!conditions.length) {
            showError('Add at least one condition before saving');
            return;
        }

        const payload = {
            ruleId: rule._id,
            name: buildRuleName(rule, conditions),
            conditions,
            actions: actionsFromFormValues(data, rule.actions, validLabels),
            ...(rule.description !== undefined ? { description: rule.description } : {}),
            ...(rule.logic !== undefined ? { logic: rule.logic } : {}),
            ...(rule.order !== undefined ? { order: rule.order } : {}),
            ...(rule.stopProcessingMore !== undefined ? { stopProcessingMore: rule.stopProcessingMore } : {}),
            ...(rule.isActive !== undefined ? { isActive: rule.isActive } : {}),
            ...(rule.trigger !== undefined ? { trigger: rule.trigger } : {}),
        };

        const response = await editRule(payload);
        if (response.statusCode === 200) {
            showSuccess('Rule updated successfully');
            onSuccess?.();
            onClose();
            return;
        }
        showError(response.message || 'Failed to update rule');
    };

    const forwardItChecked = watch('forwardIt');
    const moveToFolderChecked = watch('moveToFolder');

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className="edit-rule-modal"
            showBackdrop={true}
            closeOnBackdrop={!isForwardItOpen}
            closeOnEsc={!isForwardItOpen}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 560px)"
        >
            <div className="signatur-Create-Modal modal-center-draggable" id="editRuleModal">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header drag-handle">
                            <button
                                type="button"
                                className="expand-btn btn hover-link icon-hover-effect drag-handle-btn"
                            >
                                <InteractiveIcon
                                    defaultIcon={arrowPointingOutIcon}
                                    hoverIcon={arrowPointingOutIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Move"
                                />
                            </button>
                            <h1 className="modal-title modal-title-center" id="editRuleModalLabel">
                                Edit Rule
                            </h1>
                            <button
                                type="button"
                                className="btn-close hover-link btn icon-hover-effect"
                                onClick={onClose}
                            >
                                <InteractiveIcon
                                    defaultIcon={closeIcon}
                                    hoverIcon={closeIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Close"
                                />
                            </button>
                        </div>
                        <div className="modal-body p-0">
                            <SimpleBar
                                className="edit-rule-modal-simple-scroll-bar-body"
                                autoHide={false}
                                forceVisible="y"
                            >
                                <div className="filter-body mb-3">
                                    <EditRuleConditionsFields
                                        control={control as unknown as Control<EditRuleFormValues>}
                                        contacts={contacts}
                                    />
                                </div>

                                <div className="single-header blue-line-aft">
                                    <h2 className="box-title">Actions</h2>
                                </div>
                                <div className="filter-body search-create-filter-cmt">
                                    <CreateRuleActionsFields
                                        control={control as unknown as Control<CreateRuleFormValues>}
                                        setValue={setValue as unknown as UseFormSetValue<CreateRuleFormValues>}
                                        moveToFolderChecked={moveToFolderChecked}
                                        forwardItChecked={forwardItChecked}
                                        validLabels={validLabels}
                                        onOpenForwardModal={openForwardItModal}
                                        idPrefix="edit-filter"
                                    />
                                </div>
                            </SimpleBar>
                        </div>
                        <div className="compose-btn-box d-flex align-items-center justify-content-between pt-2" style={{ bottom: 'unset' }}>
                            <button type="button" className="btn-new" onClick={onClose}>
                                Cancel
                            </button>
                            <SubmitButton
                                className="btn-new loading-spinner"
                                onClick={handleSubmit(onSubmit, (errors: FieldErrors<EditRuleFormValues>) => {
                                    if (errors.forwardEmails?.message) {
                                        showError(String(errors.forwardEmails.message));
                                        return;
                                    }
                                    if (errors.from?.message) {
                                        showError(String(errors.from.message));
                                        return;
                                    }
                                    showError('Please fix the form errors before saving');
                                })}
                            >
                                Save
                            </SubmitButton>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default EditRuleModal;
