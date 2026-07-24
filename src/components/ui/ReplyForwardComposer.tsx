import AttachmentPreview from "@components/ui/AttachmentPreview";
import { showError, showSuccess, showWarning } from "@components/ui/toast/toastNotification";
import CkEditorRichText from "@components/ui/CkEditor/CkEditorRichText";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import SubmitButton from '@components/ui/form/SubmitButton';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { useComposeFormContext } from '@context/ComposeFormContext';
import { useAttachmentManager } from "@hooks/useAttachmentManager";
import { useCcBccToggle } from "@hooks/useCcBccToggle";
import { useComposeForm } from "@hooks/useComposeForm";
import type { ReplyForwardType } from "@hooks/useReplyForward";
import { useReplyForward } from "@hooks/useReplyForward";
import { useSignatureManager } from '@hooks/useSignatureManager';
import attachmentStrokeRoundedIconHover from '@images/attachment-stroke-rounded-icon-hover.svg';
import attachmentStrokeRoundedIcon from '@images/attachment-stroke-rounded-icon.svg';
import generateAiIcon from '@images/generate-ai-icon.svg';
import scheduledIcon from '@images/scheduled-icon.svg';
import signatureIconHover from "@images/signature-icon-hover.svg";
import signatureIcon from "@images/signature-icon.svg";
import smartMessageIcon from '@images/smart-message-icon.svg';
import trashIconHover from '@images/trash-icon-hover.svg';
import trashIcon from '@images/trash-icon.svg';
import type { Email } from "@models/Email";
import type { PendingReply } from "@models/PendingReply";
import { sendReply } from "@services/emailSending/emailSendingService";
import { scheduleEmail } from "@services/scheduleEmail/scheduleEmailService";
import { getSignatureForActions } from "@services/settings/settingsService";
import { useEffect, useRef, useState, useId } from "react";
import { Collapse, Dropdown } from "react-bootstrap";
import { Controller } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import SimpleBar from "simplebar-react";
import { useContacts, useMailData, useMailUI } from '../../context/index';
import { ensureEmailTableBorders } from '@utils/emailHtmlUtil';
import { useSettings } from "@context/SettingsContext";

const extractBodyHtml = (html: string): string => {
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('#email-signature').forEach(el => el.remove());
        return doc.body.innerHTML.trim();
    } catch {
        return html;
    }
};

interface ReplyForwardComposerProps {
    email: Email;
    type: ReplyForwardType;
    onClose?: () => void;
    onEmailSent?: () => void;
    onPendingReply?: (reply: PendingReply) => void;
}

const ReplyForwardComposer = ({ email, type, onClose, onEmailSent, onPendingReply }: ReplyForwardComposerProps) => {
    const navigate = useNavigate();
    const { contacts } = useContacts();
    const { openModal } = useMailUI();
    const { settings } = useSettings();
    const { userPermissions } = useMailData();
    const { signatures, selectedSignatureId, handleSignatureSelect } = useSignatureManager();
    const {
        setFormData,
        registerSubmitHandler,
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
    const onSubmitRef = useRef<(data: any, scheduleAt?: string) => Promise<void>>(async () => { });
    const instanceId = useId();

    const normalizeRecipients = (recipients: any[]): string[] => {
        if (!recipients?.length) return [];
        return recipients.map((r) =>
            typeof r === 'string' ? r : r.email
        );
    };

    useEffect(() => {
        if (error) {
            alert(error);
        }
    }, [error]);

    useEffect(() => {
        const fetchDefaultSignature = async () => {
            try {
                if (!settings?.enableReplyForwardUse) return;
                const response = await getSignatureForActions();
                if (response.statusCode !== 200) return;

                // `response.data` can be null even when statusCode is 200.
                const signatureBody = response?.data?.body;
                setDefaultSignature(signatureBody || "");
            } catch (e) {
                console.error('Failed to fetch default signature:', e);
            }
        };

        fetchDefaultSignature();
    }, []);

    useEffect(() => {
        // Set up the validation trigger function for the schedule modal
        setTriggerValidation(async () => {
            const isValid = await trigger();
            if (!isValid) {
                return null;
            }
            const currentFormData = getValues();
            setFormData(currentFormData);
            return currentFormData;
        });
    }, [trigger, getValues, setFormData, setTriggerValidation]);

    // Create wrapper for signature selection with proper parameters
    const handleSignatureSelectWrapper = (signature: any) => {
        handleSignatureSelect(signature, (value: string) => {
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
            to: normalizeRecipients(recipients.to),
            cc: normalizeRecipients(recipients.cc),
            bcc: normalizeRecipients(recipients.bcc),
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

    const onSubmit = async (data: any, scheduleAtOverride?: string) => {
        const scheduleAt = scheduleAtOverride ?? scheduleDateTime;

        // Add scheduled date if available and use scheduleEmail service
        if (scheduleAt) {
            // Create FormData for schedule email with attachments
            const scheduleFormData = new FormData();

            // Add email fields
            scheduleFormData.append('subject', data.subject);
            scheduleFormData.append('html', ensureEmailTableBorders(data.body || ''));
            scheduleFormData.append('to', data.to.join(','));
            if (data.cc && data.cc.length > 0) {
                scheduleFormData.append('cc', data.cc.join(','));
            }
            if (data.bcc && data.bcc.length > 0) {
                scheduleFormData.append('bcc', data.bcc.join(','));
            }

            // Add reply/forward specific fields
            scheduleFormData.append('messageId', email.messageId);
            scheduleFormData.append('threadId', email.threadId);
            scheduleFormData.append('type', type);

            // Add schedule date
            scheduleFormData.append('scheduleAt', scheduleAt);
            scheduleFormData.append('isSchedule', 'true');

            // Add attachments as files
            attachments.forEach((file) => {
                if (file instanceof File) {
                    scheduleFormData.append('attachments', file, file.name);
                } else {
                    // For existing attachments, send as JSON string
                    scheduleFormData.append('existingAttachments', JSON.stringify(file));
                }
            });

            try {
                const response: any = await scheduleEmail(scheduleFormData);
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
            formData.append('content', ensureEmailTableBorders(data.body || ''));

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
                    formData.append('attachments', file, file.name);
                } else {
                    // For existing attachments, send as JSON string
                    formData.append('existingAttachments', JSON.stringify(file));
                }
            });

            formData.append('messageId', email.messageId)
            formData.append('threadId', email.threadId)

            // Generate a client-side ID so the socket event can match this send
            const clientMessageId =
                typeof crypto?.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            formData.append('clientMessageId', clientMessageId);

            try {
                const response: any = await sendReply(formData);
                if (response.statusCode === 200) {
                    if (response.data?.status === 'pending') {
                        const currentUserEmail = localStorage.getItem('email') || '';
                        const bodyPreview = extractBodyHtml(data.body || '');
                        onPendingReply?.({
                            clientMessageId: response.data.clientMessageId ?? clientMessageId,
                            fromEmail: currentUserEmail,
                            fromName: currentUserEmail.split('@')[0],
                            toEmails: data.to ?? [],
                            subject: data.subject ?? '',
                            bodyPreview,
                            sentAt: new Date().toISOString(),
                            status: 'pending',
                        });
                        showSuccess('Reply sent successfully!');
                    } else {
                        showSuccess('Reply sent successfully!');
                        onEmailSent?.();
                    }
                    onClose?.();
                } else if (response.statusCode === 429) {
                    showWarning('Too Many Emails Sent. Please try again later.');
                } else if (response.statusCode === 400) {
                    showWarning(response.message);
                } else if (response.statusCode === 507) {
                    showWarning('Storage Limit Exceeded.');
                } else {
                    showError(response.data?.error || response.message);
                }
            } catch (error) {
                console.error('Failed to send reply/forward:', error);
                showError('Failed to send reply/forward. Please try again.');
            }
        }
    };

    onSubmitRef.current = onSubmit;

    useEffect(() => {
        registerSubmitHandler((data, scheduleAt) => onSubmitRef.current(data, scheduleAt));
    }, [registerSubmitHandler]);

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
                                isSmartReplyEnable={userPermissions?.aiFeatures}
                                isGenerateEmailOpen={isGenerateEmailCardOpen}
                                onGenerateEmailClose={() => setIsGenerateEmailCardOpen(false)}
                                emailContent={email.body || ''}
                            />
                        )}
                    />

                </div>
                <div className="compose-modal-footer">
                    {attachments.length > 0 && (
                        <div className="compose-attachments-bar">
                            <AttachmentPreview attachments={attachments} onRemove={removeFile} />
                        </div>
                    )}
                    <div className="compose-btn-box d-flex align-items-center justify-content-between">
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
                            <div className="custom-file-mail icon-hover-effect hover-link ms-3" id="reply-forward-bottom-box">
                                <div className="custom-file">
                                    <input
                                        type="file"
                                        id={`composeFileAttachments-${instanceId}`}
                                        multiple
                                        className="custom-file-input addAttachmentBtn"
                                        onChange={handleFileChange}
                                    />
                                    <label className="custom-file-label" htmlFor={`composeFileAttachments-${instanceId}`}>
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

                            {userPermissions?.aiFeatures && (
                                <button className="btn-new ms-3" id="generateEmailButton" onClick={toggleGenerateEmailCard}>
                                    <img className="me-2" src={generateAiIcon} />
                                    Generate Email
                                </button>
                            )}

                            <button className="btn-new ms-3" onClick={openScheduleModal}>
                                <img className="me-2" src={scheduledIcon} />
                                Schedule
                            </button>
                            <SubmitButton
                                className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                                onClick={handleSubmit((data) => onSubmit(data), (errors: any) => {
                                    console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                })}
                            >Send
                            </SubmitButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReplyForwardComposer;
