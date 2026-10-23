import InteractiveIcon from "@components/ui/InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import { useMailUI } from "@context/MailUIContext";
import { createAiLabelFormSchema, type CreateAiLabelFormValues } from "./createAiLabel.schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import BaseModal from "@components/ui/BaseModal";
import SubmitButton from "@components/ui/form/SubmitButton";
import ColorSingleSelect from "@components/ui/form/Select2ColorOption";
import { colorListConfi } from "../../../../config/fullCalendar.config";
import { createAiLabel, updateAiLabel } from "@services/aiService/aiLabelService";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import SimpleBar from "simplebar-react";

const defaultColor = colorListConfi.find((c) => c.default)?.value ?? colorListConfi[0].value;

interface CreateAiLabelModalProps {
    modalId: string;
    zIndex: number;
    name?: string;
    rulePrompt?: string;
    labelIconColor?: string;
    labelId?: string;
    isEdit?: boolean;
    onSuccess?: () => void | Promise<void>;
}

function CreateAiLabelModal({
    modalId,
    zIndex,
    onSuccess,
    ...props
}: CreateAiLabelModalProps) {
    const { closeModal } = useMailUI();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateAiLabelFormValues>({
        resolver: zodResolver(createAiLabelFormSchema),
        defaultValues: {
            name: props.name ?? "",
            labelIconColor: props.labelIconColor ?? defaultColor,
            rulePrompt: props.rulePrompt ?? "",
            labelId: props.labelId,
            isEdit: props.isEdit,
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: CreateAiLabelFormValues) => {
        const response = props.isEdit && props.labelId
            ? await updateAiLabel({
                labelId: props.labelId,
                name: data.name,
                rulePrompt: data.rulePrompt,
                color: data.labelIconColor,
            })
            : await createAiLabel({
                name: data.name,
                rulePrompt: data.rulePrompt,
                color: data.labelIconColor,
            });

        const ok =
            response?.statusCode === 200 ||
            response?.statusCode === 201 ||
            response?.data?._id ||
            response?._id;

        if (ok) {
            showSuccess(`Label ${props.isEdit ? "updated" : "created"} successfully`);
            await onSuccess?.();
            onClose();
            return;
        }

        const message =
            response?.message ||
            response?.error ||
            response?.data?.message ||
            `Label ${props.isEdit ? "updated" : "created"} failed`;
        showError(typeof message === "string" ? message : "Something went wrong");
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
            showBackdrop={true}
            backdropClassName="modal-backdrop-transparent"
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div
                id="createAiLabelModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered m-0">
                    <div className="modal-content modal-box-shadow-c1">
                        <div className="modal-header drag-handle">
                            <button className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
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
                            <h5 className="modal-title modal-title-center" id="createAiLabelModalLabel">
                                {props.isEdit ? "Edit Label" : "Create Label"}
                            </h5>
                            <button type="button" className="btn-close hover-link btn icon-hover-effect" onClick={onClose}>
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

                        <div className="modal-body folder-features-select-2 p-0">
                            <SimpleBar className="creat-folder-custom-modal" autoHide={true}>
                                <div className="d-block">
                                    <div className="form-group form-row mb-0">
                                        <label className="control-label" htmlFor="aiLabelName">
                                            Label Name
                                        </label>
                                    </div>
                                    <div className="d-flex align-items-start">
                                        <div className="form-group form-row mb-3 me-3 w-100">
                                            <Controller
                                                name="name"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        type="text"
                                                        id="aiLabelName"
                                                        className="form-control"
                                                        maxLength={100}
                                                        placeholder="e.g. Invoices"
                                                        {...field}
                                                    />
                                                )}
                                            />
                                            {errors.name && (
                                                <div className="invalid-feedback d-block mb-2">
                                                    {errors.name.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group m-0 form-row select2-color-pick color-pik folder-icon-color-pick">
                                            <div className="input-control">
                                                <Controller
                                                    name="labelIconColor"
                                                    control={control}
                                                    render={({ field }) => {
                                                        const selectedOption =
                                                            colorListConfi.find((opt) => opt.value === field.value) ?? null;

                                                        return (
                                                            <ColorSingleSelect
                                                                value={selectedOption}
                                                                options={colorListConfi}
                                                                onChange={(option) => {
                                                                    field.onChange(option?.value ?? "");
                                                                }}
                                                            />
                                                        );
                                                    }}
                                                />
                                                {errors.labelIconColor && (
                                                    <div className="invalid-feedback d-block mb-2">
                                                        {errors.labelIconColor.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group form-row mb-0">
                                        <label className="control-label" htmlFor="aiLabelRulePrompt">
                                            Label prompt
                                        </label>
                                    </div>
                                    <div className="form-group form-row mb-3">
                                        <Controller
                                            name="rulePrompt"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea
                                                    id="aiLabelRulePrompt"
                                                    className="form-control"
                                                    rows={8}
                                                    maxLength={2000}
                                                    placeholder="Describe which emails should get this label…"
                                                    style={{ minHeight: 160, resize: 'vertical' }}
                                                    {...field}
                                                />
                                            )}
                                        />
                                        {errors.rulePrompt && (
                                            <div className="invalid-feedback d-block mb-2">
                                                {errors.rulePrompt.message}
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex align-items-center justify-content-between">
                                        <button className="btn-new me-3" type="button" onClick={onClose}>
                                            Cancel
                                        </button>
                                        <SubmitButton
                                            className="btn-new loading-spinner"
                                            onClick={handleSubmit(onSubmit)}
                                        >
                                            Save
                                        </SubmitButton>
                                    </div>
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default CreateAiLabelModal;
