import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailUI } from '@context/MailUIContext';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import type { Contact } from '@models/Contact';
import { addContact, editContact } from '@services/contact/contactService';
import { contactFormSchema, type ContactFormSchemaValues } from './contactForm.schema';

interface ContactFormModalProps {
    modalId: string;
    zIndex: number;
    isEdit?: boolean;
    contact?: Contact | null;
    onSuccess?: () => void;
}

function ContactFormModal({ modalId, zIndex, isEdit = false, contact, onSuccess }: ContactFormModalProps) {
    const { closeModal } = useMailUI();

    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ContactFormSchemaValues>({
        resolver: zodResolver(contactFormSchema),
        mode: 'onSubmit',
        defaultValues: {
            name: contact?.name ?? '',
            email: contact?.email ?? '',
            phone: contact?.phone ?? '',
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: ContactFormSchemaValues) => {
        const payload = {
            name: data.name.trim(),
            email: data.email.trim(),
            phone: data.phone?.trim() || undefined,
        };

        const response = isEdit && contact?._id
            ? await editContact(contact._id, payload)
            : await addContact(payload);

        if (response?.statusCode === 200) {
            const message = response.message === 'Already exists'
                ? 'Contact already exists'
                : isEdit
                    ? 'Contact updated successfully'
                    : 'Contact added successfully';
            showSuccess(message);
            onSuccess?.();
            onClose();
            return;
        }

        showError(response?.message || 'Failed to save contact');
    };

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div className="signatur-Create-Modal modal-center-draggable" id="contactFormModal">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header drag-handle">
                            <button className="expand-btn btn hover-link icon-hover-effect drag-handle-btn" type="button">
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
                            <h1 className="modal-title modal-title-center">
                                {isEdit ? 'Edit Contact' : 'Add Contact'}
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
                        <div className="modal-body" data-simplebar="" data-simplebar-auto-hide="false">
                            <div className="form-group mb-3 w-100">
                                <label className="control-label" htmlFor="contactName">Name</label>
                                <Controller
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="contactName"
                                            type="text"
                                            className="form-control"
                                            placeholder="Name"
                                            autoComplete="name"
                                        />
                                    )}
                                />
                                {errors.name && (
                                    <div className="invalid-feedback d-block">{errors.name.message}</div>
                                )}
                            </div>
                            <div className="form-group mb-3 w-100">
                                <label className="control-label" htmlFor="contactEmail">Email</label>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="contactEmail"
                                            type="email"
                                            className="form-control"
                                            placeholder="Email"
                                            autoComplete="email"
                                        />
                                    )}
                                />
                                {errors.email && (
                                    <div className="invalid-feedback d-block">{errors.email.message}</div>
                                )}
                            </div>
                            <div className="form-group mb-3 w-100">
                                <label className="control-label" htmlFor="contactPhone">Phone (optional)</label>
                                <Controller
                                    name="phone"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            id="contactPhone"
                                            type="tel"
                                            className="form-control"
                                            placeholder="Phone"
                                            autoComplete="tel"
                                        />
                                    )}
                                />
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <button type="button" className="btn-new" onClick={onClose}>
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
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default ContactFormModal;
