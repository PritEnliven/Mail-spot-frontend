import { Controller } from "react-hook-form"
import smartMessageIcon from '@images/smart-message-icon.svg';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import trashIcon from '@images/trash-icon.svg';
import trashIconHover from '@images/trash-icon-hover.svg';
import attachmentStrokeRoundedIcon from '@images/attachment-stroke-rounded-icon.svg';
import attachmentStrokeRoundedIconHover from '@images/attachment-stroke-rounded-icon-hover.svg';
import generateAiIcon from '@images/generate-ai-icon.svg';
import scheduledIcon from '@images/scheduled-icon.svg';
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import { useMailUI, useContacts } from '../../context/index';
import { useComposeFormContext } from '@context/ComposeFormContext';
import { useComposeForm } from "@hooks/useComposeForm";
import { useCcBccToggle } from "@hooks/useCcBccToggle";
import { Collapse } from "react-bootstrap";
import CkEditorRichText from "@components/ui/CkEditor/CkEditorRichText";
import { useAttachmentManager } from "@hooks/useAttachmentManager";
import AttachmentPreview from "@components/ui/AttachmentPreview";
import SubmitButton from '@components/ui/form/SubmitButton';
import { useEffect, useState } from "react";
import type { Email } from "@models/Email";
import type { ReplyForwardType } from "@hooks/useReplyForward";
import { useReplyForward } from "@hooks/useReplyForward";
import { sendReply } from "@services/emailSending/emailSendingService";
import { scheduleEmail } from "@services/scheduleEmail/scheduleEmailService";
import { getSignatureForActions } from "@services/settings/settingsService";
import { useSignatureManager } from '@hooks/useSignatureManager';
import signatureIcon from "@images/signature-icon.svg";
import signatureIconHover from "@images/signature-icon-hover.svg";
import { Dropdown } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import { resolveThreadIdForReply } from '@utils/emailUtil';
import SimpleBar from "simplebar-react";

interface ReplyForwardComposerProps {
    email: Email;
    type: ReplyForwardType;
    onClose?: () => void;
    onEmailSent?: () => void; // Callback to refresh thread emails
}

const ReplyForwardComposer = ({ email, type, onClose, onEmailSent }: ReplyForwardComposerProps) => {
    const navigate = useNavigate();
    const { contacts } = useContacts();
    const { openModal } = useMailUI();
    const { signatures, selectedSignatureId, handleSignatureSelect } = useSignatureManager();
    const {
        setFormData,
        setHandleSubmit,
        setTriggerValidation,
        setScheduleDateTime,
        scheduleDateTime,
    } = useComposeFormContext();
    const {
        control,
        handleSubmit,
        reset,
        getValues,
        setValue,
        trigger,
        formState: { errors }
    } = useComposeForm();
    const { isCcOpen, isBccOpen, toggleCc, toggleBcc } = useCcBccToggle();
    const { attachments, error, removeFile, handleFileChange } = useAttachmentManager();
    const { getRecipients, getSubject, getBody } = useReplyForward();
    const [isGenerateEmailCardOpen, setIsGenerateEmailCardOpen] = useState(false);
    const [defaultSignature, setDefaultSignature] = useState<string>("");
    const [isInitialized, setIsInitialized] = useState(false);
    const [signatureInserted, setSignatureInserted] = useState(false);

    useEffect(() => {
        if (error) {
            alert(error);
        }
    }, [error]);

    useEffect(() => {
        const fetchDefaultSignature = async () => {
            const response = await getSignatureForActions();
            if (response.statusCode === 200) {
                setDefaultSignature(response.data.body || "");
            }
        };

        fetchDefaultSignature();
    }, []);

    useEffect(() => {
        // Set up the validation trigger function for the schedule modal
        setTriggerValidation(async () => {
            const isValid = await trigger();
            if (isValid) {
                const currentFormData = getValues();
                setFormData(currentFormData);
            }
            return isValid;
        });
    }, [trigger, getValues, setFormData, setTriggerValidation]);

    useEffect(() => {
        // Set up the submit handler
        setHandleSubmit(() => onSubmit);
    }, [setHandleSubmit]);

    // Create wrapper for signature selection with proper parameters
    const handleSignatureSelectWrapper = (signature: any) => {
        console.log('ReplyForwardComposer: Selecting signature', signature._id);
        const currentBody = getValues('body') || '';
        console.log('ReplyForwardComposer: Current body before signature:', currentBody);

        handleSignatureSelect(signature, (value: string) => {
            console.log('ReplyForwardComposer: New body after signature:', value);
            setValue('body', value);
        }, () => getValues('body') || '');
    };

    // Handle manage signatures
    const handleManageSignatures = () => {
        navigate('/mail/settings');
    };

    useEffect(() => {
        if (!email || isInitialized) return;

        const recipients = getRecipients(type, email);
        const subject = getSubject(type, email);

        const quotedBody = getBody(type, email);

        reset({
            to: recipients.to,
            cc: recipients.cc,
            bcc: recipients.bcc,
            subject,
            body: quotedBody
        });

        setIsInitialized(true);

    }, [email, type]);

    useEffect(() => {

        if (!defaultSignature) return;
        if (!isInitialized) return;
        if (signatureInserted) return;

        const currentBody = getValues("body") || "";

        const signatureHtml = `
                <div id="email-signature">
                ${defaultSignature}
                </div>
                <p><br></p>
                <p><br></p>
                `;

        const quotedIndex = currentBody.indexOf('id="quoted-message"');

        let updatedBody = "";

        if (quotedIndex !== -1) {
            updatedBody =
                signatureHtml +
                currentBody;
        } else {
            updatedBody =
                signatureHtml +
                currentBody;
        }

        setValue("body", updatedBody);

        setSignatureInserted(true);

    }, [defaultSignature, isInitialized]);

    const onSubmit = async (data: any) => {
        console.log('REPLY/FORWARD SUBMITTED DATA:', { ...data, type, originalEmailId: email.messageId });

        const threadIdForApi = resolveThreadIdForReply(email.threadId, email.messageId);

        // Add scheduled date if available and use scheduleEmail service
        if (scheduleDateTime) {
            // Create FormData for schedule email with attachments
            const scheduleFormData = new FormData();

            // Add email fields
            scheduleFormData.append('subject', data.subject);
            scheduleFormData.append('html', data.body || '');
            scheduleFormData.append('to', data.to.join(','));
            if (data.cc && data.cc.length > 0) {
                scheduleFormData.append('cc', data.cc.join(','));
            }
            if (data.bcc && data.bcc.length > 0) {
                scheduleFormData.append('bcc', data.bcc.join(','));
            }

            // Add reply/forward specific fields
            scheduleFormData.append('messageId', email.messageId);
            scheduleFormData.append('threadId', threadIdForApi);
            scheduleFormData.append('type', type);

            // Add schedule date
            scheduleFormData.append('scheduleAt', typeof scheduleDateTime === 'string' ? scheduleDateTime : scheduleDateTime.toISOString());
            scheduleFormData.append('isSchedule', 'true');

            // Add attachments as files
            attachments.forEach((file) => {
                if (file instanceof File) {
                    scheduleFormData.append('attachments', file);
                } else {
                    // For existing attachments, send as JSON string
                    scheduleFormData.append('existingAttachments', JSON.stringify(file));
                }
            });

            console.log('Schedule Reply/Forward FormData contents:');
            for (let [key, value] of scheduleFormData.entries()) {
                console.log(key, value);
            }

            try {
                const response: any = await scheduleEmail(scheduleFormData);
                console.log('Reply/Forward scheduled successfully:', response);
                if (response.statusCode === 200) {
                    onEmailSent?.();
                    onClose?.();
                }
            } catch (error) {
                console.error('Failed to schedule reply/forward:', error);
            }
        } else {
            // Regular reply/forward sending
            // Create FormData object
            const formData = new FormData();

            // Add string fields
            formData.append('subject', data.subject);
            formData.append('content', data.body || '');

            // Add array fields as comma-separated strings
            formData.append('to', data.to.join(','));
            if (data.cc && data.cc.length > 0) {
                formData.append('cc', data.cc.join(','));
            }
            if (data.bcc && data.bcc.length > 0) {
                formData.append('bcc', data.bcc.join(','));
            }

            // Add attachments
            attachments.forEach((file) => {
                if (file instanceof File) {
                    formData.append('attachments', file);
                } else {
                    // For existing attachments, send as JSON string
                    formData.append('existingAttachments', JSON.stringify(file));
                }
            });

            formData.append('messageId', email.messageId)
            formData.append('threadId', threadIdForApi)

            // Log FormData for debugging
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            try {
                const response: any = await sendReply(formData);
                console.log('Reply/Forward sent successfully:', response);
                if (response.statusCode === 200) {
                    onEmailSent?.();
                    onClose?.();
                }
            } catch (error) {
                console.error('Failed to send reply/forward:', error);
            }
        }
    };

    const openScheduleModal = () => {
        openModal('schedule');
    }

    const toggleGenerateEmailCard = () => {
        setIsGenerateEmailCardOpen(!isGenerateEmailCardOpen);
    }

    const handleClose = () => {
        setScheduleDateTime(null);
        onClose?.();
    };

    return (
        <div className="reply-forward-inside-section colllapse reply-forward-main-section" id="reply-mail-btn">
            <div className="reply-mail-box pb-0">
                <div className="compose-modal-body pb-0">
                    <div className="new-input-group new-input-group-border">
                        <div className="d-flex w-100">
                            <label className="control-label">
                                <span className="control-label-span">To</span>
                            </label>
                            <div className="form-group mb-0 form-row select2-profile ">
                                <Controller
                                    name="to"
                                    control={control}
                                    render={({ field }) => (
                                        <Select2Wrapper
                                            value={field.value || []}
                                            onChange={field.onChange}
                                            options={contacts}
                                            placeholder="Select or type to add"
                                            isMulti={true}
                                            moduleName="compose"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="d-flex align-items-center">
                            <a type="button" className={`fs-12 me-2 link-ap ${isCcOpen ? 'active-cc-bcc' : ''}`} onClick={toggleCc}>CC</a>
                            <a type="button" className={`fs-12 link-ap ${isBccOpen ? 'active-cc-bcc' : ''}`} onClick={toggleBcc}>BCC</a>
                        </div>
                    </div>
                    {errors.to && (
                        <div className="invalid-feedback d-block mb-2">{errors.to.message}</div>
                    )}
                    <Collapse in={isCcOpen} timeout={200}>
                        <div id="composeCcSection">
                            <div className="new-input-group new-input-group-border profile-cc-add">
                                <div className="form-group form-row select2-profile">
                                    <label className="control-label"><span className="control-label-span">CC</span></label>
                                    <div className="input-control">
                                        <Controller
                                            name="cc"
                                            control={control}
                                            render={({ field }) => (
                                                <Select2Wrapper
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                    options={contacts}
                                                    placeholder="Select or type to add"
                                                    isMulti={true}
                                                    moduleName="compose"
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Collapse>

                    <Collapse in={isBccOpen} timeout={200}>
                        <div id="composeBccSection">
                            <div className="new-input-group new-input-group-border">
                                <div className="profile-cc-bcc-add w-100 ">
                                    <div className="form-group form-row select2-profile">
                                        <label className="control-label">
                                            <span className="control-label-span">BCC</span>
                                        </label>
                                        <div className="input-control">
                                            <Controller
                                                name="bcc"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select2Wrapper
                                                        value={field.value || []}
                                                        onChange={field.onChange}
                                                        options={contacts}
                                                        placeholder="Select or type to add"
                                                        isMulti={true}
                                                        moduleName="compose"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Collapse>

                    { /* Subject */}
                    <div className="new-input-group new-input-group-border">
                        <div className="form-group form-row w-100">
                            <label className="control-label"><span className="control-label-span">Subject</span></label>
                            <Controller
                                name="subject" control={control}
                                render={({ field }) => (
                                    <input
                                        type="text"
                                        id="composeSubject"
                                        className={`form-control`}
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {errors.subject && (
                        <div className="invalid-feedback d-block mb-2">{errors.subject.message}</div>
                    )}

                    { /* Smart Replies */}
                    <div className="smart-replies d-none">
                        <button className="btn-small-new smart-reply-suggestion hover-link">
                            <img className="me-2" src={smartMessageIcon} width="16" height="16" />
                            Thanks for reaching out.
                        </button>
                        <button className="btn-small-new smart-reply-suggestion hover-link">
                            <img className="me-2" src={smartMessageIcon} width="16" height="16" />
                            I appreciate your message.
                        </button>
                        <button className="btn-small-new smart-reply-suggestion hover-link">
                            <img className="me-2" src={smartMessageIcon} width="16" height="16" />
                            this and respond soon.
                        </button>
                    </div>

                    { /* Editor */}
                    <Controller
                        name="body"
                        control={control}
                        render={({ field }) => (
                            <CkEditorRichText
                                id="reply-forward-email-body"
                                value={field.value}
                                onChange={field.onChange}
                                isSmartReplyEnable={true}
                                isGenerateEmailOpen={isGenerateEmailCardOpen}
                                onGenerateEmailClose={() => setIsGenerateEmailCardOpen(false)}
                                emailContent={email.body || ''}
                            />
                        )}
                    />

                    {attachments.length > 0 && (
                        <div className="compose-mail-attachments">
                            <ul className="compose-mail-attachments-list attachments-box-small"
                                id="composeMailAttachmentsList">
                                <AttachmentPreview attachments={attachments} onRemove={removeFile} />
                            </ul>
                        </div>
                    )}


                </div>
                <div className="compose-btn-box d-flex align-items-center justify-content-between mt-3">
                    <a className="hover-link icon-hover-effect" onClick={handleClose} >
                        <InteractiveIcon
                            defaultIcon={trashIcon}
                            hoverIcon={trashIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Discard"
                        />
                    </a>
                    <div className="d-flex align-items-center">
                        <Dropdown drop="up" align="end"
                            className={`more-actions-dropdown react-dropdown signature-dropdown ms-3`}
                        >
                            <Dropdown.Toggle
                                as="a"
                                className="hover-link d-flex align-items-center icon-hover-effect"
                            >
                                <InteractiveIcon
                                    defaultIcon={signatureIcon}
                                    hoverIcon={signatureIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Insert signature"
                                />
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {/* Manage Signature Option */}
                                <Dropdown.Item
                                    as="div"
                                    className="dropdown-item d-flex justify-content-between align-items-center"
                                    onClick={handleManageSignatures}
                                >
                                    Manage Signature
                                </Dropdown.Item>

                                {signatures.length > 0 && <Dropdown.Divider />}

                                {/* Dynamic Signatures */}
                                {signatures.map((signature) => (
                                    <SimpleBar style={{ maxHeight: 100, scrollBehavior: 'smooth' }}
                                        autoHide={false}
                                        forceVisible="y"
                                        scrollableNodeProps={{
                                            style: { scrollBehavior: 'smooth' }
                                        }}>
                                        <Dropdown.Item
                                            key={signature._id}
                                            as="div"
                                            className={`dropdown-item d-flex justify-content-between align-items-center ${selectedSignatureId === signature._id ? 'active-line-t' : ''
                                                }`}
                                            onClick={() => handleSignatureSelectWrapper(signature)}
                                        >
                                            {signature.name || 'Untitled Signature'}
                                        </Dropdown.Item>
                                    </SimpleBar>
                                ))}

                                {signatures.length === 0 && (
                                    <Dropdown.Item
                                        as="div"
                                        className="dropdown-item disabled"
                                        disabled
                                    >
                                        No signatures available
                                    </Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                        <div className="custom-file-mail mg-5 icon-hover-effect hover-link ms-3" id="reply-forward-bottom-box">
                            <div className="custom-file">
                                <input
                                    type="file"
                                    id="composeFileAttachments"
                                    multiple
                                    className="custom-file-input addAttachmentBtn"
                                    onChange={handleFileChange}
                                />
                                <label className="custom-file-label" htmlFor="composeFileAttachments">
                                    <span className="file-name">
                                        <InteractiveIcon
                                            defaultIcon={attachmentStrokeRoundedIcon}
                                            hoverIcon={attachmentStrokeRoundedIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip="Attachment"
                                        />
                                    </span>
                                </label>
                            </div>
                        </div>
                        <button className="btn-new ms-3" id="generateEmailButton" onClick={toggleGenerateEmailCard}>
                            <img className="me-2" src={generateAiIcon} />
                            Generate Email
                        </button>
                        <button className="btn-new ms-3" onClick={openScheduleModal}>
                            <img className="me-2" src={scheduledIcon} />
                            Schedule
                        </button>
                        <SubmitButton
                            className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                            onClick={handleSubmit(onSubmit, (errors: any) => {
                                console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                            })}
                        >Send</SubmitButton>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReplyForwardComposer;