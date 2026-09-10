import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { lazy, Suspense, useMemo, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useFlatpickrMonthDropdown } from '@components/ui/useFlatpickrMonthDropdown';
import { useMailUI } from '@context/MailUIContext';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import removeIcon from '@images/trash-icon.svg';
import removeIconHover from '@images/trash-icon-hover.svg';
import closeIconHover from "@assets/images/close-icon-hover.svg";
import closeIcon from "@assets/images/close-icon.svg";
import dateIcon from '@images/date-icon-16.svg';
import plusIcon from '@images/plus-icon.svg';
import plusIconHover from '@images/plus-icon-hover.svg';

import type { Contact } from '@models/Contact';
import { getContactEmails, getContactPhones } from '@models/Contact';
import { addContact, editContact } from '@services/contact/contactService';
import { formatDate, parseDateForFlatpickr, TimeFormat } from '@utils/dateUtil';
import {
    CONTACT_MAX_EMAILS,
    CONTACT_MAX_PHONES,
    contactFormSchema,
    type ContactFormSchemaValues,
} from './contactForm.schema';

const Flatpickr = lazy(() => import('react-flatpickr'));

interface ContactFormModalProps {
    modalId: string;
    zIndex: number;
    isEdit?: boolean;
    contact?: Contact | null;
    onSuccess?: () => void;
}

function ContactFormModal({ modalId, zIndex, isEdit = false, contact, onSuccess }: ContactFormModalProps) {
    const { closeModal } = useMailUI();
    const birthdateOnChangeRef = useRef<(value: string) => void>(() => {});
    const mountMonthDropdown = useFlatpickrMonthDropdown(0);

    const defaultEmails = getContactEmails(contact ?? { email: '', emails: [] }).slice(0, CONTACT_MAX_EMAILS);
    const defaultPhones = getContactPhones(contact ?? { phone: null, phones: [] }).slice(0, CONTACT_MAX_PHONES);

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
            emails: (defaultEmails.length > 0 ? defaultEmails : ['']).map((value) => ({ value })),
            phones: (defaultPhones.length > 0 ? defaultPhones : ['']).map((value) => ({ value })),
            notes: contact?.notes ?? '',
            address: contact?.address ?? '',
            birthdate: contact?.birthdate ?? '',
        },
    });

    const {
        fields: emailFields,
        append: appendEmail,
        remove: removeEmail,
    } = useFieldArray({
        control,
        name: 'emails',
    });

    const {
        fields: phoneFields,
        append: appendPhone,
        remove: removePhone,
    } = useFieldArray({
        control,
        name: 'phones',
    });

    const canAddEmail = emailFields.length < CONTACT_MAX_EMAILS;
    const canAddPhone = phoneFields.length < CONTACT_MAX_PHONES;

    const flatpickrOptions = useMemo(() => ({
        enableTime: false,
        dateFormat: 'Y-m-d',
        maxDate: 'today',
        disableMobile: true,
        onReady: (_: Date[], __: string, instance: any) => {
            mountMonthDropdown(instance);
        },
        onOpen: (_: Date[], __: string, instance: any) => {
            mountMonthDropdown(instance);
        },
        onChange: (selectedDates: Date[]) => {
            const date = selectedDates[0];
            birthdateOnChangeRef.current(
                date ? String(formatDate(date, TimeFormat.YYYYMMDD)) : '',
            );
        },
    }), [mountMonthDropdown]);

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const handleAddEmail = () => {
        if (!canAddEmail) {
            showError(`Maximum ${CONTACT_MAX_EMAILS} emails allowed`);
            return;
        }
        appendEmail({ value: '' });
    };

    const handleAddPhone = () => {
        if (!canAddPhone) {
            showError(`Maximum ${CONTACT_MAX_PHONES} phones allowed`);
            return;
        }
        appendPhone({ value: '' });
    };

    const onSubmit = async (data: ContactFormSchemaValues) => {
        const emails = data.emails.map((e) => e.value.trim()).filter(Boolean);
        const phones = (data.phones ?? []).map((p) => p.value.trim()).filter(Boolean);

        if (emails.length > CONTACT_MAX_EMAILS) {
            showError(`Maximum ${CONTACT_MAX_EMAILS} emails allowed`);
            return;
        }
        if (phones.length > CONTACT_MAX_PHONES) {
            showError(`Maximum ${CONTACT_MAX_PHONES} phones allowed`);
            return;
        }

        const payload = {
            name: data.name.trim(),
            email: emails[0],
            emails,
            phone: phones[0] || undefined,
            phones,
            notes: data.notes?.trim() || undefined,
            address: data.address?.trim() || undefined,
            birthdate: data.birthdate?.trim() || undefined,
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
            showBackdrop={true}
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div className=" modal-center-draggable" id="contactFormModal">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content contact-form-modal-content">
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
                        <div className="modal-body p-0 contact-form-modal-body">
                            <SimpleBar
                                className="contact-form-modal-scroll"
                                autoHide={false}
                                forceVisible="y"
                            >
                                <div className="contact-form-modal-scroll-inner">
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
                                        <label className="control-label">Email</label>
                                        {emailFields.map((item, index) => {
                                            const fieldError = errors.emails?.[index]?.value?.message;
                                            return (
                                                <div className="mb-2" key={item.id}>
                                                    <div className="contact-field-row">
                                                        <Controller
                                                            name={`emails.${index}.value`}
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    {...field}
                                                                    id={index === 0 ? 'contactEmail' : `contactEmail-${index}`}
                                                                    type="email"
                                                                    className={`form-control${fieldError ? ' is-invalid' : ''}`}
                                                                    placeholder="Email"
                                                                    autoComplete="email"
                                                                />
                                                            )}
                                                        />
                                                        {index === emailFields.length - 1 && canAddEmail && (
                                                            <button
                                                                type="button"
                                                                className="contact-field-action-btn hover-link"
                                                                onClick={handleAddEmail}
                                                                aria-label="Add email"
                                                            >
                                                                <InteractiveIcon
                                                                    defaultIcon={plusIcon}
                                                                    hoverIcon={plusIconHover}
                                                                    activeIcon=""
                                                                    isActive={false}
                                                                    alt=""
                                                                    className="interactive-icon hover-image"
                                                                    renderAs="img"
                                                                    tooltip="Add email"
                                                                />
                                                            </button>
                                                        )}
                                                        {index > 0 && (
                                                            <button
                                                                type="button"
                                                                className="contact-field-action-btn hover-link"
                                                                onClick={() => removeEmail(index)}
                                                                aria-label="Remove email"
                                                            >
                                                                <InteractiveIcon
                                                                   defaultIcon={removeIcon}
                                                                    hoverIcon={removeIconHover}
                                                                    activeIcon=""
                                                                    isActive={false}
                                                                    alt=""
                                                                    className="interactive-icon hover-image"
                                                                    renderAs="img"
                                                                    tooltip="Remove"
                                                                />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {fieldError && (
                                                        <div className="invalid-feedback d-block">{fieldError}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {typeof errors.emails?.message === 'string' && (
                                            <div className="invalid-feedback d-block">{errors.emails.message}</div>
                                        )}
                                        {errors.emails?.root?.message && (
                                            <div className="invalid-feedback d-block">{errors.emails.root.message}</div>
                                        )}
                                    </div>

                                    <div className="form-group mb-3 w-100">
                                        <label className="control-label">Phone</label>
                                        {phoneFields.map((item, index) => (
                                            <div className="contact-field-row mb-2" key={item.id}>
                                                <Controller
                                                    name={`phones.${index}.value`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            {...field}
                                                            id={index === 0 ? 'contactPhone' : `contactPhone-${index}`}
                                                            type="tel"
                                                            className="form-control"
                                                            placeholder="Phone"
                                                            autoComplete="tel"
                                                        />
                                                    )}
                                                />
                                                {index === phoneFields.length - 1 && canAddPhone && (
                                                    <button
                                                        type="button"
                                                        className="contact-field-action-btn hover-link"
                                                        onClick={handleAddPhone}
                                                        aria-label="Add phone"
                                                    >
                                                        <InteractiveIcon
                                                            defaultIcon={plusIcon}
                                                            hoverIcon={plusIconHover}
                                                            activeIcon=""
                                                            isActive={false}
                                                            alt=""
                                                            className="interactive-icon hover-image"
                                                            renderAs="img"
                                                            tooltip="Add phone"
                                                        />
                                                    </button>
                                                )}
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        className="contact-field-action-btn hover-link"
                                                        onClick={() => removePhone(index)}
                                                        aria-label="Remove phone"
                                                    >
                                                        <InteractiveIcon
                                                            defaultIcon={removeIcon}
                                                            hoverIcon={removeIconHover}
                                                            activeIcon=""
                                                            isActive={false}
                                                            alt=""
                                                            className="interactive-icon hover-image"
                                                            renderAs="img"
                                                            tooltip="Remove"
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {typeof errors.phones?.message === 'string' && (
                                            <div className="invalid-feedback d-block">{errors.phones.message}</div>
                                        )}
                                        {errors.phones?.root?.message && (
                                            <div className="invalid-feedback d-block">{errors.phones.root.message}</div>
                                        )}
                                    </div>

                                    <div className="form-group mb-3 w-100 two-arrow-input">
                                        <label className="control-label" htmlFor="contactBirthdate">Birthdate</label>
                                        <div className="input-icon-add custom-datepicker-month-selector-c2-vm">
                                            <Controller
                                                name="birthdate"
                                                control={control}
                                                render={({ field }) => {
                                                    birthdateOnChangeRef.current = field.onChange;
                                                    return (
                                                        <Suspense fallback={<input className="form-control" placeholder="Select date" readOnly />}>
                                                            <Flatpickr
                                                                id="contactBirthdate"
                                                                value={parseDateForFlatpickr(field.value) ?? ''}
                                                                options={flatpickrOptions}
                                                                className="form-control DateRangePickerStaticTop"
                                                                placeholder="Select date"
                                                            />
                                                        </Suspense>
                                                    );
                                                }}
                                            />
                                            <img src={dateIcon} alt="" className="input-icon-1" />
                                        </div>
                                    </div>

                                    <div className="form-group mb-3 w-100">
                                        <label className="control-label" htmlFor="contactNotes">Note</label>
                                        <Controller
                                            name="notes"
                                            control={control}
                                            render={({ field }) => (
                                                <textarea
                                                    {...field}
                                                    id="contactNotes"
                                                    className="form-control contact-notes-textarea"
                                                    placeholder="Note"
                                                    rows={6}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="form-group mb-0 w-100">
                                        <label className="control-label" htmlFor="contactAddress">Address</label>
                                        <Controller
                                            name="address"
                                            control={control}
                                            render={({ field }) => (
                                               <textarea
                                                    {...field}
                                                    id="contactAddress"
                                                    className="form-control contact-notes-textarea"
                                                    placeholder="Address"
                                                    autoComplete="street-address"
                                                />
                                            )}
                                        />
                                    </div>

                                    
                                </div>
                            </SimpleBar>

                            <div className="contact-form-modal-footer">
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
