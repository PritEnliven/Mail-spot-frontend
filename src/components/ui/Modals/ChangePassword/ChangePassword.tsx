import { Controller, useForm } from "react-hook-form";
import InteractiveIcon from "../../InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import CloseIcon from "@images/close-icon.svg";
import CloseIconHover from "@images/close-icon-hover.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import { ChangePasswordSchema, type ChangePasswordFormValues } from './ChangePassword.schema.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from "react";
import SubmitButton from "@components/ui/form/SubmitButton.tsx";
import { useMailUI } from "@context/MailUIContext.tsx";
import BaseModal from "@components/ui/BaseModal";
import { showSuccess, showError } from "@components/ui/toast/toastNotification.ts";
import { resetPassword } from "@services/forgotPassword/forgotPasswordService.ts";
import { useProfile } from "@context/userContext.tsx";
import SimpleBar from 'simplebar-react';

interface ChangePasswordProps {
    modalId: string;
    zIndex?: number;
}

function ChangePassword({ modalId, zIndex }: ChangePasswordProps) {

    const { closeModal } = useMailUI();
    const { profileEmail } = useProfile();
    const [showPassword, setShowPassword] = useState(false);
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(ChangePasswordSchema),
        mode: "onSubmit",
        reValidateMode: "onChange",
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const onClose = () => {
        reset()
        closeModal(modalId)
    };

    const onSubmit = async (data: ChangePasswordFormValues) => {
        console.log(data);
        const payload = {
            email: profileEmail,
            password: data.password,
            token: localStorage.getItem("token") || "",
        };
        const response = await resetPassword(payload);
        if (response.statusCode === 200) {
            showSuccess("Password updated successfully");
            onClose();
        } else {
            showError("Error updating password");
        }
    };

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className=""
            closeOnBackdrop={true}
            showBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div
                className="modal-change-password-admin-employee"
                id={modalId}
                style={{ zIndex: zIndex }}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content modal-dialog-scrollable">
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
                            <h5 className="modal-title modal-title-center ms-1" id="ModalChangePpasswordAdminEmployeeModalLabel">Change password</h5>
                            <button type="button" className="btn-close hover-link btn icon-hover-effect" onClick={onClose}>
                                <InteractiveIcon
                                    defaultIcon={CloseIcon}
                                    hoverIcon={CloseIconHover}
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
                                className="changePasswordModalSimpleBar"
                                autoHide={false}
                                forceVisible="y"
                            >
                                <div className="p-16">
                                    <div className="form-group form-row change-password-input">
                                        <label className="control-label" htmlFor="new-password">
                                            New password
                                        </label>
                                        <div className="input-control">
                                            <div className="input-icon-add">
                                                <Controller
                                                    name="password"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            {...field}
                                                            type={showPassword ? "text" : "Password"}
                                                            maxLength={25}
                                                            className="form-control"
                                                            placeholder="New Password"
                                                        />
                                                    )}
                                                />
                                                <img
                                                    src={showPassword ? passwordShowIcon : passwordHideIcon}
                                                    alt={showPassword ? "Hide" : "Show"}
                                                    className="input-icon-3"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </div>
                                        </div>
                                        {errors.password && (
                                            <div className="invalid-feedback d-block">{errors.password.message}</div>
                                        )}
                                    </div>
                                    <div className="form-group form-row ">
                                        <label className="control-label" htmlFor="confirm-password">
                                            Confirm password
                                        </label>
                                        <div className="input-control">
                                            <div className="input-icon-add">
                                                <Controller
                                                    name="confirmPassword"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            {...field}
                                                            type={showSmtpPassword ? "text" : "Password"}
                                                            maxLength={25}
                                                            className="form-control"
                                                            placeholder="Confirm Password"
                                                        />
                                                    )}
                                                />
                                                <img
                                                    src={showSmtpPassword ? passwordShowIcon : passwordHideIcon}
                                                    alt={showSmtpPassword ? "Hide" : "Show"}
                                                    className="input-icon-3"
                                                    onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </div>
                                        </div>
                                        {errors.confirmPassword && (
                                            <div className="invalid-feedback d-block">{errors.confirmPassword.message}</div>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <button className="btn-new me-3" type="button" data-bs-dismiss="modal" onClick={onClose}>
                                            Cancel
                                        </button>
                                        <SubmitButton className="btn-new loading-spinner"
                                            onClick={handleSubmit(onSubmit, (errors: any) => {
                                                console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                            })}
                                        >Save</SubmitButton>
                                    </div>
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div >
        </BaseModal>
    )
}
export default ChangePassword;