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
import { buildSignatureHtml, useSignatureManager } from '@hooks/useSignatureManager';
import attachmentStrokeRoundedIconHover from '@images/attachment-stroke-rounded-icon-hover.svg';
import attachmentStrokeRoundedIcon from '@images/attachment-stroke-rounded-icon.svg';
import generateAiIcon from '@images/generate-ai-icon.svg';
import scheduledIcon from '@images/scheduled-icon.svg';
import signatureIconHover from "@images/signature-icon-hover.svg";
import signatureIcon from "@images/signature-icon.svg";
import smartMessageIcon from '@images/smart-message-icon.svg';
import trashIconHover from '@images/trash-icon-hover.svg';
import trashIcon from '@images/trash-icon.svg';
import moreActionIcon from "@images/ellipsis-vertical-icon.svg";
import moreActionIconHover from "@images/ellipsis-vertical-icon-hover.svg";
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
import { prepareUniqueAttachmentFiles } from '@utils/attachmentNameUtil';
import { useSettings } from "@context/SettingsContext";
import { useScreen } from '@context/ScreenContext';
import { useComposeActionsOverflow } from '@hooks/useComposeActionsOverflow';

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
    const { contacts, searchContacts, fetchContacts, resetContactSuggestions, loadMoreContacts, hasMoreContacts, isLoadingContacts, isLoadingMoreContacts } = useContacts();
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
    const { isCcOpen, isBccOpen, toggleBcc } = useCcBccToggle();
    const { attachments, error, removeFile, handleFileChange } = useAttachmentManager();
    const { getRecipients, getSubject, getBody } = useReplyForward();
    const [isGenerateEmailCardOpen, setIsGenerateEmailCardOpen] = useState(false);
    const [defaultSignature, setDefaultSignature] = useState<string>("");
    const [isInitialized, setIsInitialized] = useState(false);
    const [signatureInserted, setSignatureInserted] = useState(false);
    const onSubmitRef = useRef<(data: any, scheduleAt?: string) => Promise<void>>(async () => { });
    const composerRef = useRef<HTMLDivElement>(null);
    const instanceId = useId();
    const { isMobile } = useScreen();
    const composeFooterActionsRef = useRef<HTMLDivElement>(null);
    const composeActionsMeasureRef = useRef<HTMLDivElement>(null);
    const isComposeActionsCompact = useComposeActionsOverflow(
        composeFooterActionsRef,
        composeActionsMeasureRef,
        [userPermissions?.aiFeatures],
    );

    // Bring the reply/forward composer into view when it opens below a long
    // message or deep in a thread (scrolls the mail-details pane, not the page).
    useEffect(() => {
        const el = composerRef.current;
        if (!el) return;

        let cancelled = false;
        const timeoutIds: number[] = [];

        const getScrollContainer = (): HTMLElement | null => {
            const details = el.closest('.mail-details-box') as HTMLElement | null;
            if (details) return details;

            let node = el.parentElement;
            while (node) {
                const { overflowY } = getComputedStyle(node);
                if (
                    (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
                    node.scrollHeight > node.clientHeight + 1
                ) {
                    return node;
                }
                node = node.parentElement;
            }
            return null;
        };

        const scrollComposerIntoView = () => {
            if (cancelled) return;

            const scrollContainer = getScrollContainer();
            if (scrollContainer) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const footer = el.querySelector('.compose-modal-footer') as HTMLElement | null;
                const footerRect = footer?.getBoundingClientRect();

                // Ideal: pin composer top near the top of the details pane so the
                // reply form (and footer actions) are reachable without hunting below.
                const idealTop = elRect.top - containerRect.top + scrollContainer.scrollTop - 12;
                const alreadyNearTop =
                    elRect.top >= containerRect.top - 2 &&
                    elRect.top <= containerRect.top + 40;
                const footerInView = footerRect
                    ? footerRect.top < containerRect.bottom - 24
                    : elRect.bottom <= containerRect.bottom - 24;

                // Only skip when the composer is already pinned near the top AND
                // the action footer isn't clipped below the fold.
                if (alreadyNearTop && footerInView) return;

                scrollContainer.scrollTo({
                    top: Math.max(0, idealTop),
                    behavior: 'smooth',
                });
                return;
            }

            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        const raf1 = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollComposerIntoView();
                // Retry after CKEditor / toolbar-slot layout settles.
                timeoutIds.push(window.setTimeout(scrollComposerIntoView, 280));
                timeoutIds.push(window.setTimeout(scrollComposerIntoView, 600));
            });
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf1);
            timeoutIds.forEach((id) => window.clearTimeout(id));
        };
    }, []);

    // Forward needs a recipient — focus To. Reply/Reply all focus the editor (via CkEditor autoFocus).
    useEffect(() => {
        if (type !== 'forward') return;

        let cancelled = false;
        const focusToInput = () => {
            if (cancelled || !composerRef.current) return;
            const input = composerRef.current.querySelector(
                '.new-input-group .select2-profile input'
            ) as HTMLInputElement | null;
            input?.focus();
        };

        const timeoutId = window.setTimeout(focusToInput, 120);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [type]);

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
        const goToSettings = () => navigate('/mail/settings');

        if (!isMobile) {
            goToSettings();
            return;
        }

        openModal('confirmDelete', {
            title: 'Leave message?',
            message: 'Do you want to discard this message before managing signatures?',
            confirmLabel: 'Discard',
            cancelLabel: 'Keep editing',
            showIcon: false,
            onConfirm: () => {
                onClose?.();
                goToSettings();
            },
        });
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

        const signatureHtml = buildSignatureHtml(defaultSignature);

        const quotedIndex = currentBody.indexOf('id="quoted-message"');

        let updatedBody = "";

        if (quotedIndex !== -1) {
            updatedBody =  
                signatureHtml +  
                currentBody;
        } 
        else {
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
            const scheduleBodyHtml = ensureEmailTableBorders(data.body || '');

            // Add email fields
            scheduleFormData.append('subject', data.subject);
            scheduleFormData.append('html', scheduleBodyHtml);
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

            // Rename attachments that collide with inline body image filenames
            prepareUniqueAttachmentFiles(scheduleBodyHtml, attachments).forEach((file) => {
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
        } 
        else {
            // Regular reply/forward sending
            // Create FormData object
            const formData = new FormData();
            const bodyHtml = ensureEmailTableBorders(data.body || '');

            // Add string fields
            formData.append('subject', data.subject);
            formData.append('content', bodyHtml);

            // Add array fields as comma-separated strings
            formData.append('to', data.to.join(','));

            if (data.cc && data.cc.length > 0) {
                formData.append('cc', data.cc.join(','));
            }

            if (data.bcc && data.bcc.length > 0) {
                formData.append('bcc', data.bcc.join(','));
            }

            // Rename attachments that collide with inline body image filenames
            prepareUniqueAttachmentFiles(bodyHtml, attachments).forEach((file) => {
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
        <div
            ref={composerRef}
            className="reply-forward-inside-section colllapse reply-forward-main-section"
            id="reply-mail-btn"
        >
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
                                            onInputChange={searchContacts}
                                            onOpen={fetchContacts}
                                            onClose={resetContactSuggestions}
                                            onLoadMore={loadMoreContacts}
                                            hasMore={hasMoreContacts}
                                            isLoading={isLoadingContacts}
                                            isLoadingMore={isLoadingMoreContacts}
                                            showSuggestionBadge={true}
                                            placeholder="Select or type to add"
                                            isMulti={true}
                                            moduleName="compose"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="d-flex align-items-center">
                            {/* DO NOT REMOVE BELOW COMMENTED CODE LINE AT ANY CONDITION/SITUATION
                                @Note: Before updating/removing ask Raj Vasoya
                            */}
                            {/* <a type="button" className={`fs-12 me-2 link-ap ${isCcOpen ? 'active-cc-bcc' : ''}`} onClick={toggleCc}>CC</a> */}
                            <a type="button" className={`fs-12 link-ap ${isBccOpen ? 'active-cc-bcc' : ''}`} onClick={toggleBcc}>BCC</a>
                        </div>
                    </div>
                    {errors.to && (
                        <div className="invalid-feedback d-block mb-2">{errors.to.message}</div>
                    )}
                    <Collapse in={isCcOpen} timeout={200}>
                        <div id="composeCcSection" className="collapse show">
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
                                                    onInputChange={searchContacts}
                                                    onOpen={fetchContacts}
                                                    onClose={resetContactSuggestions}
                                                    onLoadMore={loadMoreContacts}
                                                    hasMore={hasMoreContacts}
                                                    isLoading={isLoadingContacts}
                                                    isLoadingMore={isLoadingMoreContacts}
                                                    showSuggestionBadge={true}
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
                                                        onInputChange={searchContacts}
                                                        onOpen={fetchContacts}
                                                        onClose={resetContactSuggestions}
                                                        onLoadMore={loadMoreContacts}
                                                        hasMore={hasMoreContacts}
                                                        isLoading={isLoadingContacts}
                                                        isLoadingMore={isLoadingMoreContacts}
                                                        showSuggestionBadge={true}
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
                                autoFocus={type !== 'forward'}
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

                    <div
                        className="compose-btn-box d-flex align-items-center justify-content-between px-0"
                        ref={composeFooterActionsRef}
                    >
                        <a
                            className="hover-link icon-hover-effect"
                            data-compose-discard
                            onClick={handleClose}
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
                        <div className="super-action-single-group-box">
                            {/* CKEditor toolbar moves here via ToolbarAtBottomPlugin */}
                            <div className="compose-editor-toolbar-slot" />

                            {/* Off-screen measure of expanded actions — drives overflow → More menu */}
                            <div
                                ref={composeActionsMeasureRef}
                                className="compose-actions-measure"
                                aria-hidden="true"
                            >
                                <img src={attachmentStrokeRoundedIcon} alt="" width={20} height={20} />
                                <img src={signatureIcon} alt="" width={20} height={20} />
                                <span className="super-action-icon-brack-line" />
                                {userPermissions?.aiFeatures && (
                                    <img src={generateAiIcon} alt="" width={20} height={20} />
                                )}
                                <img src={scheduledIcon} alt="" width={20} height={20} />
                            </div>

                            {!isComposeActionsCompact ? (
                                <>
                                    <div className="super-action-single-group-items">
                                        <div className="custom-file-mail icon-hover-effect hover-link" id="reply-forward-bottom-box">
                                            <div className="custom-file">
                                                <input
                                                    type="file"
                                                    id={`composeFileAttachments-${instanceId}`}
                                                    multiple
                                                    className="custom-file-input addAttachmentBtn"
                                                    onChange={handleFileChange}
                                                />
                                                <label
                                                    className="custom-file-label"
                                                    htmlFor={`composeFileAttachments-${instanceId}`}
                                                >
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

                                        <Dropdown
                                            drop="up"
                                            align="end"
                                            className="more-actions-dropdown react-dropdown signature-dropdown"
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
                                                <Dropdown.Item
                                                    as="div"
                                                    className="dropdown-item d-flex justify-content-between align-items-center"
                                                    onClick={handleManageSignatures}
                                                >
                                                    Manage Signature
                                                </Dropdown.Item>

                                                {signatures.length > 0 && <Dropdown.Divider />}

                                                {signatures.map((signature) => (
                                                    <SimpleBar
                                                        key={signature._id}
                                                        style={{ maxHeight: 100, scrollBehavior: 'smooth' }}
                                                        autoHide={false}
                                                        forceVisible="y"
                                                        scrollableNodeProps={{
                                                            style: { scrollBehavior: 'smooth' },
                                                        }}
                                                    >
                                                        <Dropdown.Item
                                                            as="div"
                                                            className={`dropdown-item d-flex justify-content-between align-items-center ${
                                                                selectedSignatureId === signature._id
                                                                    ? 'active-line-t'
                                                                    : ''
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
                                    </div>

                                    <span className="super-action-icon-brack-line" />

                                    <div className="super-action-single-group-items">
                                        {userPermissions?.aiFeatures && (
                                            <button
                                                className="btn hover-link icon-hover-effect"
                                                id="generateEmailButton"
                                                onClick={toggleGenerateEmailCard}
                                            >
                                                <InteractiveIcon
                                                    defaultIcon={generateAiIcon}
                                                    hoverIcon={generateAiIcon}
                                                    activeIcon=""
                                                    isActive={false}
                                                    alt=""
                                                    className="interactive-icon hover-image"
                                                    renderAs="img"
                                                    tooltip="Generate Email"
                                                />
                                            </button>
                                        )}

                                        <button
                                            className="btn hover-link icon-hover-effect"
                                            onClick={openScheduleModal}
                                        >
                                            <InteractiveIcon
                                                defaultIcon={scheduledIcon}
                                                hoverIcon={scheduledIcon}
                                                activeIcon=""
                                                isActive={false}
                                                alt=""
                                                className="interactive-icon hover-image"
                                                renderAs="img"
                                                tooltip="Schedule"
                                            />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="super-action-single-group-items">
                                    <input
                                        type="file"
                                        id={`composeFileAttachments-${instanceId}`}
                                        multiple
                                        className="d-none"
                                        onChange={handleFileChange}
                                    />
                                    <Dropdown
                                        drop="up"
                                        align="end"
                                        className="more-actions-dropdown react-dropdown compose-overflow-more-dropdown"
                                    >
                                        <Dropdown.Toggle
                                            as="a"
                                            className="hover-link d-flex align-items-center icon-hover-effect"
                                        >
                                            <InteractiveIcon
                                                defaultIcon={moreActionIcon}
                                                hoverIcon={moreActionIconHover}
                                                activeIcon=""
                                                isActive={false}
                                                alt=""
                                                className="interactive-icon hover-image"
                                                renderAs="img"
                                                tooltip="More"
                                            />
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            <Dropdown.Item
                                                as="div"
                                                className="dropdown-item d-flex align-items-center"
                                                onClick={() =>
                                                    document
                                                        .getElementById(`composeFileAttachments-${instanceId}`)
                                                        ?.click()
                                                }
                                            >
                                                <img
                                                    className="me-2"
                                                    src={attachmentStrokeRoundedIcon}
                                                    alt=""
                                                    width={16}
                                                    height={16}
                                                />
                                                Attachment
                                            </Dropdown.Item>

                                            <Dropdown.Divider />

                                            <Dropdown.Item
                                                as="div"
                                                className="dropdown-item d-flex align-items-center"
                                                onClick={handleManageSignatures}
                                            >
                                                <img
                                                    className="me-2"
                                                    src={signatureIcon}
                                                    alt=""
                                                    width={16}
                                                    height={16}
                                                />
                                                Manage Signature
                                            </Dropdown.Item>

                                            {signatures.map((signature) => (
                                                <Dropdown.Item
                                                    key={signature._id}
                                                    as="div"
                                                    className={`dropdown-item d-flex align-items-center ${
                                                        selectedSignatureId === signature._id
                                                            ? 'active-line-t'
                                                            : ''
                                                    }`}
                                                    onClick={() => handleSignatureSelectWrapper(signature)}
                                                >
                                                    <img
                                                        className="me-2"
                                                        src={signatureIcon}
                                                        alt=""
                                                        width={16}
                                                        height={16}
                                                    />
                                                    {signature.name || 'Untitled Signature'}
                                                </Dropdown.Item>
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

                                            <Dropdown.Divider />

                                            {userPermissions?.aiFeatures && (
                                                <Dropdown.Item
                                                    as="div"
                                                    className="dropdown-item d-flex align-items-center"
                                                    onClick={toggleGenerateEmailCard}
                                                >
                                                    <img
                                                        className="me-2"
                                                        src={generateAiIcon}
                                                        alt=""
                                                        width={16}
                                                        height={16}
                                                    />
                                                    Generate Email
                                                </Dropdown.Item>
                                            )}

                                            <Dropdown.Item
                                                as="div"
                                                className="dropdown-item d-flex align-items-center"
                                                onClick={openScheduleModal}
                                            >
                                                <img
                                                    className="me-2"
                                                    src={scheduledIcon}
                                                    alt=""
                                                    width={16}
                                                    height={16}
                                                />
                                                Schedule
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            )}

                            <span
                                data-compose-send
                                data-tooltip-id="my-tooltip"
                                data-tooltip-content="Ctrl + Enter"
                                data-tooltip-place="top"
                            >
                                <SubmitButton
                                    className="btn-new send-btn d-flex align-items-center loading-spinner"
                                    onClick={handleSubmit((data) => onSubmit(data), (errors: any) => {
                                        console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                    })}
                                >Send
                                </SubmitButton>
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ReplyForwardComposer;
