import { Controller, useForm } from 'react-hook-form';
import InteractiveIcon from "../../InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import { signatureModalSchema, type signatureModalFormValues } from './signatureModal.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import BaseModal from '@components/ui/BaseModal';
import { useMailUI } from '@context/MailUIContext';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showSuccess, showError } from '@components/ui/toast/toastNotification';
import { createSignatureName } from '@services/settings/settingsService';

interface SignatureModalProps {
    modalId: string;
    zIndex: number;
    isEdit: boolean;
    signatureId?: string;
    signatureName?: string;
    isDefaultSignature?: boolean | false;
    onSuccess?: () => void;
}

function SignatureModal({ modalId, zIndex, ...props }: SignatureModalProps) {
    const { closeModal } = useMailUI();
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<signatureModalFormValues>({
        resolver: zodResolver(signatureModalSchema),
        mode: "onSubmit",
        defaultValues: {
            signatureName: props.signatureName || "",
            isDefaultSignature: props.isDefaultSignature || false,
        },
    });

    async function onSubmit(data: signatureModalFormValues) {
        const payload = {
            isEdit: props.isEdit,
            signatureId: props.signatureId,
            signatureName: data.signatureName,
            setDefaultSignature: data.isDefaultSignature,
        }
        const response = await createSignatureName(payload);
        if (response.statusCode === 200) {
            showSuccess(`${props.isEdit ? "Signature updated successfully" : "Signature created successfully"}`);
            if (props.onSuccess) {
                props.onSuccess();
            }
            onClose();
        }
        else {
            showError(response.message);
        }
    }

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className=""
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div className="signatur-Create-Modal modal-center-draggable" id="signaturCreateModal">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header drag-handle">
                            <button
                                className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
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
                            <h1 className="modal-title modal-title-center" id="signaturCreateModalLabel">
                                {props.isEdit ? "Edit Signature" : "Create Signature"}
                            </h1>
                            <button
                                type="button"
                                className="btn-close hover-link btn icon-hover-effect"
                                onClick={onClose}>
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
                        <div
                            className="modal-body"
                            data-simplebar=""
                            data-simplebar-auto-hide="false"
                        >
                            <div className="form-group mb-3 w-100">
                                <label className="control-label">Signature Name</label>
                                <Controller
                                    name="signatureName"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="text"
                                            id="signatureName"
                                            className="form-control"
                                            placeholder="Name"
                                        />
                                    )}
                                />
                                {errors.signatureName && (
                                    <div className="invalid-feedback d-block">{errors.signatureName.message}</div>
                                )}
                            </div>
                            <div className="form-group d-flex align-items-center">
                                <div className="mail-received-check-btn me-2">
                                    <div className="blue checkbox-custom table-check">
                                        <Controller
                                            name="isDefaultSignature"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    className="list-child"
                                                    type="checkbox"
                                                    id="setDefaultSignature"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                        <label htmlFor="setDefaultSignature" className="label-text" />
                                    </div>
                                </div>
                                <label htmlFor="setDefaultSignature" id="defaultSignatureCheckbox" className="control-label m-0 all-day-chaeck">
                                    make this as default signature
                                </label>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <button type="button" className="btn-new" onClick={onClose}>
                                    Cancel
                                </button>
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
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}
export default SignatureModal;