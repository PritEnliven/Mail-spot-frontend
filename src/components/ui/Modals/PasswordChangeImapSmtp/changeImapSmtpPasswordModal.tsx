import { Controller, useForm } from "react-hook-form";
import InteractiveIcon from "../../InteractiveIcon.tsx";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import CloseIcon from "@images/close-icon.svg";
import CloseIconHover from "@images/close-icon-hover.svg";
import passwordShowIcon from "@images/password-show-icon-16.svg";
import passwordHideIcon from "@images/password-hide-icon-16.svg";
import lockIconfocuse from "@images/password-icon-16-blue.svg"
import serverIcon from "@images/server-icon-16.svg";
import serverIconfocuse from "@images/server-icon-16-blue.svg"
import recommendedIconfocuse from "@images/recommended-icon-16-blue.svg"
import recommendedIcon from "@images/recommended-icon-16.svg"
import lockIcon from "@images/password-icon-16.svg";
import errorIcon16 from "@images/error-icon-16.svg";
import { changeImapSmtpPasswordSchema, type changeImapSmtpPasswordFormValues } from './changeImapSmtpPasswordModal.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from "react";
import BaseModal from "@components/ui/BaseModal";
import SubmitButton from "@components/ui/form/SubmitButton.tsx";
import { useMailUI } from "@context/MailUIContext.tsx";
import { showSuccess, showError } from "@components/ui/toast/toastNotification.ts";
import { updateImapSmtpDetails } from "@services/user/userService.ts";
import { useProfile } from "@context/userContext.tsx";
import SimpleBar from 'simplebar-react';

interface CalendarEventModalProps {
    modalId: string;
    zIndex: number;
    imapPassword?: string;
    imapServer?: string;
    imapPort?: number;
    imapSecurityType?: "tls" | "startls" | "None";
    smtpPassword?: string;
    smtpServer?: string;
    smtpPort?: number;
    smtpSecurityType?: "tls" | "startls" | "None";
    smtpHost?: string;
}
function ChangeImapSmtpPasswordModal({ modalId, zIndex, ...props }: CalendarEventModalProps) {

    const { closeModal } = useMailUI()
    const [showPassword, setShowPassword] = useState(false);
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const { profileEmail, profileName } = useProfile()

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<changeImapSmtpPasswordFormValues>({
        resolver: zodResolver(changeImapSmtpPasswordSchema),
        mode: "onTouched",
        defaultValues: {
            imapPassword: "",
            imapServer: "",
            imapPort: 993,
            imapSecurityType: "tls",
            smtpPassword: "",
            smtpServer: "",
            smtpPort: 465,
            smtpSecurityType: "tls",
            smtpHost: ""
        },
    });

    useEffect(() => {
        if (props) {
            reset({
                imapPassword: props.imapPassword || "",
                imapServer: props.imapServer || "",
                imapPort: props.imapPort || 993,
                imapSecurityType: (props as any).imapSecurityType || "tls",
                smtpPassword: props.smtpPassword || "",
                smtpServer: props.smtpServer || "",
                smtpPort: props.smtpPort || 465,
                smtpSecurityType: (props as any).smtpSecurityType || "tls",
                smtpHost: props.smtpHost || "",
            });
        }
    }, [reset, JSON.stringify(props)]);

    const onSubmit = async (data: changeImapSmtpPasswordFormValues) => {
        if (!profileEmail || !profileName) {
            console.error('Profile email or name is missing');
            return;
        }

        if (!data.imapServer || !data.smtpServer || !data.smtpHost) {
            console.error('Required fields are missing');
            return;
        }

        const updateImapSmtpData = {
            email: {
                email: profileEmail,
                name: profileName,
            },
            imap: {
                password: data.imapPassword || '',
                host: data.imapServer,
                port: data.imapPort || 993,
                secureType: data.imapSecurityType || 'tls',
                service: 'imap',
            },
            smtp: {
                password: data.smtpPassword || '',
                host: data.smtpServer,
                port: data.smtpPort || 465,
                secureType: data.smtpSecurityType || 'tls',
            }
        };

        try {
            const response = await updateImapSmtpDetails(updateImapSmtpData);
            if (response.statusCode === 200) {
                showSuccess('Imap & Smtp updated successfully');
                onClose();
            }
            else {
                showError(response.data.data.error || 'Failed to update IMAP/SMTP details');
            }
        } catch (error) {
            console.error('Failed to update IMAP/SMTP details:', error);
        }

    };

    const onClose = () => {
        reset()
        closeModal(modalId)
    };

    const [focusedField, setFocusedField] = useState<string | null>(null);
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
            <div
                className="password-change-modal"
                id="changeImapSmtpPasswordModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
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
                            <h5 className="modal-title modal-title-center" id="changePasswordModal">
                                Change IMAP/SMTP Configuration
                            </h5>
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
                                    <div className="form-group">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <label className="control-label">Imap Password</label>
                                        </div>
                                        <div className="input-group2 icon-right2 password-show-hide">
                                            <div className="input-control">
                                                <div className="input-icon-add">
                                                    <Controller
                                                        name="imapPassword"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                {...field}
                                                                type={showPassword ? "text" : "password"}
                                                                className="form-control"
                                                                placeholder="Password"
                                                                onFocus={() => setFocusedField("userPassword")}
                                                                onBlur={() => setFocusedField(null)}
                                                            />
                                                        )}
                                                    />
                                                    <img src={focusedField === "imapPassword" ? lockIconfocuse : lockIcon} alt={focusedField === "imapPassword" ? "Hide" : "Show"} className="input-icon-1"
                                                    />
                                                    <img
                                                        src={showPassword ? passwordShowIcon : passwordHideIcon}
                                                        alt={showPassword ? "Hide password" : "Show password"}
                                                        className="input-icon-2"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        style={{ cursor: "pointer" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        {errors.imapPassword && (
                                            <div className="invalid-feedback d-block mb-2">{errors.imapPassword.message}</div>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="form-group me-3 w-100">
                                            <label className="control-label">IMAP Server</label>
                                            <div className="input-group2 input-group-re-size">
                                                <div className="input-control">
                                                    <div className="input-icon-add">
                                                        <Controller
                                                            name="imapServer"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    {...field}
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="IMAP Server"
                                                                    id="imapServer"
                                                                    onFocus={() => setFocusedField("imapServer")}
                                                                    onBlur={() => setFocusedField(null)}
                                                                />
                                                            )}
                                                        />
                                                        <img src={focusedField === "imapServer" ? serverIconfocuse : serverIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {errors.imapServer && (
                                                <div className="invalid-feedback d-block mb-2">{errors.imapServer.message}</div>
                                            )}
                                        </div>
                                        <div className="form-group input-group-re-size-2">
                                            <label className="control-label">Port</label>
                                            <div className="input-group2 ">
                                                <div className="input-control">
                                                    <Controller
                                                        name="imapPort"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                {...field}
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Port"
                                                                id="imapPort"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            {errors.imapPort && (
                                                <div className="invalid-feedback d-block mb-2">{errors.imapPort.message}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group automatically-inf-details">
                                        <label className="control-label">Security Type</label>
                                        <div className="input-icon-add">
                                            <Controller
                                                name="imapSecurityType"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select2Wrapper
                                                        value={field.value || null}
                                                        onChange={field.onChange}
                                                        options={[
                                                            { label: "SSL / TLS (recommended)", value: "tls" },
                                                            { label: "STARTTLS", value: "startls" },
                                                            { label: "None", value: "None" },
                                                        ]}
                                                        isMulti={false}
                                                    />
                                                )}
                                            />
                                            <img src={focusedField === "imapSecurityType" ? recommendedIconfocuse : recommendedIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                                            />
                                        </div>
                                        {errors.imapSecurityType && (
                                            <div className="invalid-feedback d-block mb-2">{errors.imapSecurityType.message}</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <label className="control-label">SMTP Password</label>
                                        </div>
                                        <div className="input-group2 icon-right2 password-show-hide">
                                            <div className="input-control">
                                                <div className="input-icon-add">
                                                    <Controller
                                                        name="smtpPassword"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                {...field}
                                                                type={showSmtpPassword ? "text" : "password"}
                                                                className="form-control"
                                                                placeholder="SMTP Password"
                                                                id="smtpPassword"
                                                                onFocusCapture={() => setFocusedField("smtppassword")}
                                                                onBlurCapture={() => setFocusedField(null)}
                                                            />
                                                        )}
                                                    />
                                                    <img src={focusedField === "smtppassword" ? lockIconfocuse : lockIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                                                    />
                                                    <img
                                                        src={showSmtpPassword ? passwordShowIcon : passwordHideIcon}
                                                        alt={showSmtpPassword ? "Hide" : "Show"}
                                                        className="input-icon-2"
                                                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                                                        style={{ cursor: "pointer" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <span className="sub-input-label">
                                            Leave blank if same as IMAP Password
                                        </span>
                                        {errors.smtpPassword && (
                                            <div className="invalid-feedback d-block mb-2">{errors.smtpPassword.message}</div>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center ">
                                        <div className="form-group me-3 w-100">
                                            <label className="control-label">SMTP Server</label>
                                            <div className="input-group2 input-group-re-size">
                                                <div className="input-control">
                                                    <div className="input-icon-add">
                                                        <Controller
                                                            name="smtpHost"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    {...field}
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="SMTP Server"
                                                                    id="smtpHost"
                                                                    onFocus={() => setFocusedField("smtpHost")}
                                                                    onBlur={() => setFocusedField(null)}
                                                                />
                                                            )}
                                                        />
                                                        <img src={focusedField === "smtpHost" ? serverIconfocuse : serverIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {errors.smtpHost && (
                                                <div className="invalid-feedback d-block mb-2">{errors.smtpHost.message}</div>
                                            )}
                                        </div>
                                        <div className="form-group input-group-re-size-2">
                                            <label className="control-label">Port</label>
                                            <div className="input-group2">
                                                <div className="input-control">
                                                    <Controller
                                                        name="smtpPort"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                {...field}
                                                                type="number"
                                                                className="form-control"
                                                                placeholder="Port"
                                                                id="imapPort"
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            {errors.smtpPort && (
                                                <span className="error-input-text">
                                                    <img src={errorIcon16} alt="" width="16" height="16" className="me-2" />
                                                    <span className="error-text">{errors.smtpPort.message}</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-group automatically-inf-details">
                                        <label className="control-label">Security Type</label>
                                        <div className="input-icon-add">
                                            <Controller
                                                name="smtpSecurityType"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select2Wrapper
                                                        value={field.value || null}
                                                        onChange={field.onChange}
                                                        options={[
                                                            { label: "SSL / TLS (recommended)", value: "tls" },
                                                            { label: "STARTTLS", value: "startls" },
                                                            { label: "None", value: "None" },
                                                        ]}
                                                        isMulti={false}
                                                    />
                                                )}
                                            />
                                            <img src={focusedField === "smtpSecurityType" ? recommendedIconfocuse : recommendedIcon} alt={focusedField === "name" ? "Hide" : "Show"} className="input-icon-1"
                                            />
                                        </div>
                                        {errors.smtpSecurityType && (
                                            <div className="invalid-feedback d-block mb-2">{errors.smtpSecurityType.message}</div>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between mt-4">
                                        <button type="button" className="btn-new" onClick={onClose}>Cancel</button>
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
            </div>
        </BaseModal>
    )
}
export default ChangeImapSmtpPasswordModal;