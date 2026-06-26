import { Controller, useForm, useWatch } from 'react-hook-form';
import { useMailData } from '@context/MailDataContext';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import arrowExpandIcon from '@images/arrow-expand-icon.svg';
import arrowExpandIconHover from '@images/arrow-expand-icon-hover.svg';
import arrowShrinkIcon from '@images/arrow-outexpand-icon.svg';
import arrowShrinkIconHover from '@images/arrow-outexpand-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import attachmentStrokeRoundedIcon from '@images/attachment-stroke-rounded-icon.svg';
import attachmentStrokeRoundedIconHover from '@images/attachment-stroke-rounded-icon-hover.svg';
import generateAiIcon from '@images/generate-ai-icon.svg';
import scheduledIcon from '@images/scheduled-icon.svg';
import signatureIconHover from '@images/signature-icon-hover.svg';
import signatureIcon from "@images/signature-icon.svg";
import smartMessageIcon from '@images/smart-message-icon.svg';
import trashIconHover from '@images/trash-icon-hover.svg';
import trashIcon from '@images/trash-icon.svg';
import { saveDraft, sendEmail } from '@services/emailSending/emailSendingService';
import { scheduleEmail } from '@services/scheduleEmail/scheduleEmailService';
import { getSignatureForActions } from '@services/settings/settingsService';
import { getBoxNameFromSidebar, verifyBoxName } from '@utils/emailUtil';
import { useEffect, useRef, useState } from 'react';
import { Collapse, Dropdown } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import { useContacts, useMailUI } from '../../context/index';
import { useSettings } from '@context/SettingsContext';
import { useComposeFormContext } from '@context/ComposeFormContext';
import { useCcBccToggle } from '@hooks/useCcBccToggle';
import { useSignatureManager } from '@hooks/useSignatureManager';
import { useAttachmentManager, isExistingAttachment } from '@hooks/useAttachmentManager';
import { zodResolver } from '@hookform/resolvers/zod';
import { composeSchema, type ComposeFormValues } from './compose.schema';
import { useDebounce } from '@hooks/useDebounce';
import { showError, showSuccess, showWarning } from '@components/ui/toast/toastNotification';
import { sendEmailWithUndo } from '@components/ui/toast/SendMailDelayToast';
import { ensureEmailTableBorders } from '@utils/emailHtmlUtil';
import BaseModal from '@components/ui/BaseModal';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import CkEditorRichText from '@components/ui/CkEditor/CkEditorRichText';
import AttachmentPreview from '@components/ui/AttachmentPreview';
import SubmitButton from '@components/ui/form/SubmitButton';
import { useShortcutAction } from '@hooks/useShortcutAction';

interface ComposeEmailModalProps {
    modalId: string;
    zIndex: number;
    emailData?: {
        _id: string;
        to: string[];
        cc?: string[];
        bcc?: string[];
        subject?: string;
        body?: string;
        attachments?: File[] | any[];
        scheduledTime?: string;
        isScheduled?: boolean;
        isDraftMail?: boolean | false;
        draftEmailId?: string;
        draftMessageId?: string;
        isEditScheduleEmail?: boolean;
    }
}

export const ComposeEmailModal = ({ modalId, zIndex, emailData }: ComposeEmailModalProps) => {
    const navigate = useNavigate();
    const { contacts } = useContacts();
    const { openModal, closeModal, isComposeExpanded, setIsComposeExpanded } = useMailUI();
    const { settings } = useSettings();
    const { updateBoxCount, sidebarState, boxName, setMailListPage, fetchEmails, refreshUserPermissions } = useMailData();
    const {
        setFormData,
        registerSubmitHandler,
        setTriggerValidation,
        scheduleDateTime,
        setScheduleDateTime
    } = useComposeFormContext();
    const { isCcOpen, isBccOpen, toggleCc, toggleBcc, openCc, openBcc } = useCcBccToggle();
    const { attachments, error, setInitialAttachments, removeFile, resetAttachments, handleFileChange } = useAttachmentManager();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerateEmailCardOpen, setIsGenerateEmailCardOpen] = useState(false);
    const { signatures, selectedSignatureId, handleSignatureSelect } = useSignatureManager();
    const onSubmitRef = useRef<(data: ComposeFormValues, scheduleAt?: string) => Promise<void>>(async () => { });

    useShortcutAction(
        'send_email',
        () => handleSubmit((data) => onSubmit(data))(),
    );

    useShortcutAction(
        'save_as_draft',
        () => onCloseSaveAsDraft(),
    );

    const normalizeRecipients = (recipients: any[]): string[] => {
        if (!recipients?.length) return [];
        return recipients.map((r) =>
            typeof r === 'string' ? r : r.email
        );
    };

    const {
        control,
        handleSubmit,
        getValues,
        setValue,
        formState: { errors },
        reset,
        trigger,
    } = useForm<ComposeFormValues>({
        resolver: zodResolver(composeSchema),
        mode: "onSubmit",
        defaultValues: {
            to: [],
            cc: [],
            bcc: [],
            subject: '',
            body: '',
        },
    });

    const subjectValue = useWatch({
        control,
        name: 'subject',
    });
    const debouncedSubject = useDebounce(subjectValue, 500);
    const [modalTitle, setModalTitle] = useState('Compose Email');

    useEffect(() => {
        void refreshUserPermissions();
    }, [refreshUserPermissions]);

    const toggleGenerateEmailCard = () => {
        setIsGenerateEmailCardOpen(!isGenerateEmailCardOpen);
    }

    // Fetch and set default signature when component mounts
    useEffect(() => {
        const setDefaultSignature = async () => {
            try {
                const response = await getSignatureForActions();
                if (response.statusCode !== 200) return;

                // `response.data` can be null even when statusCode is 200.
                const signatureBody = response?.data?.body;
                if (!emailData?.body && signatureBody) {
                    const signatureWithId = `<br><br><br><div id="email-signature" data-signature-id="default">${signatureBody}</div>`;
                    setValue('body', signatureWithId);
                }
            } catch (e) {
                console.error('Failed to fetch default signature:', e);
            }
        };

        setDefaultSignature();
    }, [emailData, setValue]);

    useEffect(() => {
        if (debouncedSubject && debouncedSubject.trim()) {
            const value = debouncedSubject.trim();
            // const maxLength = isComposeExpanded ? 180 : 35;
            let displayText = value;
            setModalTitle(displayText);
        } else {
            setModalTitle('Compose Email');
        }
    }, [debouncedSubject, isComposeExpanded]);

    /*Edit Moda Hydration */
    useEffect(() => {
        if (!emailData) return;

        // 1. Reset RHF values (RHF does NOT auto-update)
        reset({
            to: normalizeRecipients(emailData.to),
            cc: normalizeRecipients(emailData.cc ?? []),
            bcc: normalizeRecipients(emailData.bcc ?? []),
            subject: emailData.subject ?? '',
            body: emailData.body ?? '',
        });

        // 2. Restore scheduled datetime
        if (emailData.scheduledTime) {
            setScheduleDateTime(emailData.scheduledTime);
        }

        // 3. Restore attachments (CRITICAL)
        if (emailData.attachments?.length) {
            setInitialAttachments(emailData.attachments);
        } else {
            resetAttachments();
        }

        if (emailData.cc?.length) {
            openCc();
        }
        if (emailData.bcc?.length) {
            openBcc();
        }
    }, [emailData]);


    useEffect(() => {
        if (error) {
            // alert(error);
        }
    }, [error]);

    useEffect(() => {
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

    const handleManageSignatures = () => {
        navigate('/mail/settings');
    };

    const openScheduleModal = () => {
        openModal('schedule');
    }

    const toggleComposeExpanded = () => {
        setIsComposeExpanded(!isComposeExpanded);
    }


    const prepareFormData = (data: ComposeFormValues, isDraft: boolean = false) => {
        const formData = new FormData();

        // Add string fields
        formData.append('subject', data.subject || '');
        formData.append('html', ensureEmailTableBorders(data.body || ''));
        formData.append('isDraftMail', isDraft.toString());
        if (isDraft) {
            formData.append('draftEmailId', emailData?.draftEmailId || '');
            formData.append('draftMessageId', emailData?.draftMessageId || '');
        }

        // Add array fields as comma-separated strings
        if (data.to && data.to.length > 0) {
            formData.append('to', data.to.join(','));
        }
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
                formData.append('existingAttachments', JSON.stringify(file));
            }
        });

        return formData;
    };

    const onSubmit = async (data: ComposeFormValues, scheduleAtOverride?: string) => {
        const scheduleAt = scheduleAtOverride ?? scheduleDateTime;

        // Check if both subject and body are empty (trim whitespace and HTML tags for body)
        const isSubjectEmpty = !data.subject || data.subject.trim() === '';
        const isBodyEmpty = !data.body || data.body.replace(/<[^>]*>/g, '').trim() === '';

        if (isSubjectEmpty && isBodyEmpty) {
            const shouldSend = window.confirm("Your message has no subject or body. Are you sure you want to send it?");
            if (!shouldSend) {
                return;
            }
        }

        setIsSubmitting(true);
        const formData = prepareFormData(data, emailData?.isDraftMail || false);
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

            // Add schedule date
            scheduleFormData.append('scheduleAt', scheduleAt);
            scheduleFormData.append('isSchedule', 'true');

            if (emailData?.isEditScheduleEmail) {
                scheduleFormData.append('isEditScheduleEmail', (emailData?.isEditScheduleEmail ?? false).toString());
                scheduleFormData.append('scheduleId', emailData?._id || '');
            }

            // Add attachments as files
            attachments.forEach((file) => {
                if (file instanceof File) {
                    scheduleFormData.append('attachments', file);
                } else if ('file' in file && file.file instanceof File) {
                    scheduleFormData.append('attachments', file.file);
                }
            });

            // Add deleted existing attachments so backend knows what to remove
            const deletedAttachments = emailData?.attachments?.filter(
                serverAttachment => !attachments.some(current =>
                    isExistingAttachment(current) && current.name === serverAttachment.filename
                )
            ) || [];

            if (deletedAttachments.length > 0) {
                scheduleFormData.append('deletedAttachments', JSON.stringify(deletedAttachments));
            }

            try {
                const response: any = await scheduleEmail(scheduleFormData);
                if (response.statusCode === 200) {
                    showSuccess("Email scheduled successfully")
                    onClose();
                }
            } catch (error) {
                console.error('Failed to schedule email:', error);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            const restoreSnapshot: ComposeEmailModalProps['emailData'] = {
                _id: emailData?._id || '',
                to: data.to,
                cc: data.cc ?? [],
                bcc: data.bcc ?? [],
                subject: data.subject ?? '',
                body: data.body ?? '',
                attachments: [...attachments],
                scheduledTime: scheduleDateTime ?? undefined,
                isDraftMail: emailData?.isDraftMail,
                draftEmailId: emailData?.draftEmailId,
                draftMessageId: emailData?.draftMessageId,
            };

            dismissCompose();

            try {
                const outcome = await sendEmailWithUndo(
                    "Your email is being sent...",
                    settings.undoSendPeriod * 1000 || 3000,
                    () => sendMailHandler(formData, { skipClose: true })
                );
                if (outcome === 'cancelled') {
                    openModal('compose', { emailData: restoreSnapshot });
                    showSuccess('Undo successful. Your email was not sent.');
                }
            } catch (error) {
                openModal('compose', { emailData: restoreSnapshot });
                showError('Failed to send email. Your message has been restored.');
                console.error('Failed to send email:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const sendMailHandler = async (formData: any, options?: { skipClose?: boolean }) => {
        try {
            const response: any = await sendEmail(formData);
            if (response.statusCode === 200) {
                if (verifyBoxName(boxName, 'draft')) {
                    fetchEmails(1, boxName);
                    if (verifyBoxName(boxName, 'draft')) {
                        updateBoxCount(boxName, 0, -1);
                    }
                }
                if (!options?.skipClose) {
                    onClose();
                }
            } else if (response.statusCode === 429) {
                showWarning('Too Many Emails Sent. Please try again later.');
            } else if( response.statusCode === 400){
                showWarning(response.message);
            } else if( response.statusCode === 507){
                showWarning('Storage Limit Exceeded.');   
            }
            return response;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    const dismissCompose = () => {
        closeModal(modalId);
        setIsComposeExpanded(false);
    };

    const onClose = () => {
        reset()
        closeModal(modalId);
        resetAttachments();
        if (isCcOpen) toggleCc();
        if (isBccOpen) toggleBcc();
        setScheduleDateTime(null);
        setIsComposeExpanded(false);
    }

    onSubmitRef.current = onSubmit;

    useEffect(() => {
        registerSubmitHandler((data, scheduleAt) => onSubmitRef.current(data, scheduleAt));
    }, [registerSubmitHandler]);

    const getBodyTextWithoutSignature = (body: string | undefined): string => {
        if (!body) return '';
        const withoutSignature = body.replace(/<div[^>]*id="email-signature"[^>]*>[\s\S]*?<\/div>/gi, '');
        return withoutSignature.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
    };

    const hasDraftContent = (data: ComposeFormValues): boolean => {
        const hasRecipients =
            (data.to?.length ?? 0) > 0 ||
            (data.cc?.length ?? 0) > 0 ||
            (data.bcc?.length ?? 0) > 0;
        const hasSubject = !!(data.subject?.trim());
        const hasBodyContent = getBodyTextWithoutSignature(data.body).length > 0;
        const hasAttachments = attachments.length > 0;
        return hasRecipients || hasSubject || hasBodyContent || hasAttachments;
    };

    const handleComposeClose = () => {
        void onCloseSaveAsDraft();
    };

    const onCloseSaveAsDraft = async () => {
        try {
            const data = getValues();
            if (!hasDraftContent(data)) {
                onClose();
                return;
            }
            setIsSubmitting(true);
            const formData = prepareFormData(data, true);
            closeModal(modalId);

            const response = await saveDraft(formData as any);
            if (response.statusCode === 200) {
                showSuccess("Draft saved successfully");
                const draftBoxName = getBoxNameFromSidebar(sidebarState, 'draft');
                updateBoxCount(draftBoxName, 0, 1); 
                
                if (verifyBoxName(boxName, 'draft')) {
                    setMailListPage(1);
                    fetchEmails(1, draftBoxName);
                }

                onClose();
            }

        } catch (error) {
            console.error('Failed to save draft:', error);
            showError("Failed to save draft. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <BaseModal
            isOpen={true}
            onClose={handleComposeClose}
            zIndex={zIndex}
            className=""
            showBackdrop={isComposeExpanded ? true : false}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            moduleName="compose"
            isComposeExpanded={isComposeExpanded}
        >
            <div className="compose-email-modal" id="composeEmailModal">
                <div className='modal-dialog'>
                    <div className="modal-content modal-dialog-scrollable modal-dialog-custom modal-box-shadow-c1">
                        {/* HEADER */}
                        <div className="modal-header justify-content-between drag-handle">
                            <button className="btn hover-link icon-hover-effect drag-handle-btn">
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
                            {/* Mobile-back-btn-only */}
                            {/* <button type="button" className="btn hover-link input-icon-1 monile-back-btn" onClick={onCloseSaveAsDraft}>
                                <InteractiveIcon
                                    defaultIcon={backBtnIcon}
                                    hoverIcon={backBtnIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Back"
                                    customStyle={{
                                        width: '20px',
                                        height: '20px',
                                    }}
                                />
                            </button> */}
                            <h5 className="modal-title modal-title-center" id="composeEmailModalTitle">{modalTitle}</h5>
                            <div className="d-flex align-items-center modal-btn-group">
                                <button className="expand-btn-com btn hover-link icon-hover-effect expand-btn-cm" onClick={toggleComposeExpanded}>
                                    <InteractiveIcon
                                        defaultIcon={isComposeExpanded ? arrowShrinkIcon : arrowExpandIcon}
                                        hoverIcon={isComposeExpanded ? arrowShrinkIconHover : arrowExpandIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip={isComposeExpanded ? 'Exit full screen' : 'Expand'}
                                    />
                                </button>
                                <button className="btn-close hover-link icon-hover-effect" onClick={handleComposeClose}>
                                    <InteractiveIcon
                                        defaultIcon={closeIcon}
                                        hoverIcon={closeIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip="Save and close"
                                    />
                                </button>
                            </div>
                        </div>
                        {/* BODY */}
                        <div className="modal-body p-0">

                            <SimpleBar
                                className="ComposeModalSimpleBar"
                                autoHide={false}
                                forceVisible="y"
                            >

                                <div className="compose-modal-body p-16 pb-0">
                                    <div className="new-input-group new-input-group-border">
                                        <div className="d-flex w-100">
                                            <label className="control-label">
                                                <span className="control-label-span">To</span>
                                            </label>
                                            <div className="form-group mb-0 form-row select2-profile">
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
                                            <a type="button" className={`fs-12 me-2 link-ap ${isBccOpen ? 'active-cc-bcc' : ''}`} onClick={toggleBcc}>BCC</a>
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
                                                id="compose-email-body"
                                                value={field.value}
                                                onChange={field.onChange}
                                                isSmartReplyEnable={false}
                                                isGenerateEmailOpen={isGenerateEmailCardOpen}
                                                onGenerateEmailClose={() => setIsGenerateEmailCardOpen(false)}
                                            />
                                        )}
                                    />

                                </div>
                            </SimpleBar>
                        </div>
                        <div className="compose-modal-footer">
                            {attachments.length > 0 && (
                                <div className="compose-attachments-bar">
                                    <AttachmentPreview attachments={attachments} onRemove={removeFile} />
                                </div>
                            )}
                            <div className="compose-btn-box d-flex align-items-center justify-content-between">
                                <a href="javascript:;" className="hover-link icon-hover-effect"
                                    onClick={onClose}
                                >
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
                                                        onClick={() => handleSignatureSelect(signature, (value: string) => setValue('body', value), () => getValues('body') || '')}
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
                                    <div className="custom-file-mail mg-5 icon-hover-effect hover-link ms-3">
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
                                    <button className="btn-new ms-3 btn-new-icon-mobile" id="generateEmailButton" onClick={toggleGenerateEmailCard}>
                                        <img className="me-2" src={generateAiIcon} />
                                        <span className="d-flex align-items-center">Generate Email</span>
                                    </button>
                                    <button className="btn-new ms-3 btn-new-icon-mobile" onClick={openScheduleModal}>
                                        <img className="me-2" src={scheduledIcon} />
                                        <span className='d-flex align-items-cnter'>Schedule</span>
                                    </button>
                                    <span
                                        data-tooltip-id="my-tooltip"
                                        data-tooltip-content="Ctrl + Enter"
                                        data-tooltip-place="top"
                                    >
                                        <SubmitButton
                                            className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                                            onClick={handleSubmit((data) => onSubmit(data), (errors: any) => {
                                                console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                            })}
                                            loading={isSubmitting}
                                        >Send
                                        </SubmitButton>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div>
        </BaseModal>
    );
}

export default ComposeEmailModal;
