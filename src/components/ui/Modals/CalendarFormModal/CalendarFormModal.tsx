import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import BaseModal from '@components/ui/BaseModal';
import ColorSingleSelect from '@components/ui/form/Select2ColorOption';
import SubmitButton from '@components/ui/form/SubmitButton';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { colorListConfi } from '../../../../config/fullCalendar.config';
import { useCalendar } from '@context/CalendarContext';
import { useMailUI } from '@context/MailUIContext';
import { addCalendar, editCalendar } from '@services/calendar/calendarsService';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import SimpleBar from 'simplebar-react';
import { calendarFormSchema, DEFAULT_CALENDAR_COLOR, type CalendarFormValues } from './calendarForm.schema';

interface CalendarFormModalProps {
    modalId: string;
    zIndex: number;
    isEdit?: boolean;
    calendarId?: string;
    name?: string;
    color?: string;
    isDefault?: boolean;
}

function CalendarFormModal({
    modalId,
    zIndex,
    isEdit = false,
    calendarId,
    name = '',
    color,
}: CalendarFormModalProps) {
    const { closeModal } = useMailUI();
    const { fetchCalendars, getAllEventList } = useCalendar();

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<CalendarFormValues>({
        resolver: zodResolver(calendarFormSchema),
        defaultValues: {
            name,
            color: color || DEFAULT_CALENDAR_COLOR,
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: CalendarFormValues) => {
        const response = isEdit && calendarId
            ? await editCalendar({
                calendarId,
                name: data.name,
                color: data.color,
            })
            : await addCalendar({
                name: data.name,
                color: data.color,
            });

        if (response.statusCode === 200) {
            const createdId = response.data?.calendar?._id;
            showSuccess(response.data?.message || `Calendar ${isEdit ? 'updated' : 'created'} successfully`);
            await fetchCalendars(createdId && !isEdit ? { ensureSelectedIds: [createdId] } : undefined);
            if (isEdit) {
                await getAllEventList();
            }
            onClose();
            return;
        }

        const message =
            (typeof response?.message === 'string' && response.message) ||
            `Calendar ${isEdit ? 'updated' : 'created'} failed`;

        if (/already exists/i.test(message)) {
            setError('name', { type: 'manual', message });
        }
        showError(message);
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
            <div
                id="calendarFormModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered m-0">
                    <div className="modal-content modal-box-shadow-c1">
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
                            <h5 className="modal-title modal-title-center" id="calendarFormModalLabel">
                                {isEdit ? 'Edit calendar' : 'Create calendar'}
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
                                        <label className="control-label">Calendar name</label>
                                    </div>
                                    <div className="d-flex align-items-start">
                                        <div className="form-group form-row mb-3 me-3 w-100">
                                            <Controller
                                                name="name"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        type="text"
                                                        id="calendarName"
                                                        className="form-control"
                                                        maxLength={100}
                                                        {...field}
                                                    />
                                                )}
                                            />
                                            {errors.name && (
                                                <div className="invalid-feedback d-block mb-2">{errors.name.message}</div>
                                            )}
                                        </div>
                                        <div className="form-group m-0 form-row select2-color-pick color-pik folder-icon-color-pick">
                                            <div className="input-control">
                                                <Controller
                                                    name="color"
                                                    control={control}
                                                    render={({ field }) => {
                                                        const selectedOption =
                                                            colorListConfi.find((opt) => opt.value === field.value) ?? {
                                                                label: field.value,
                                                                value: field.value,
                                                                color: field.value,
                                                            };

                                                        return (
                                                            <ColorSingleSelect
                                                                value={selectedOption}
                                                                options={colorListConfi}
                                                                onChange={(option) => {
                                                                    field.onChange(option?.value ?? DEFAULT_CALENDAR_COLOR);
                                                                }}
                                                            />
                                                        );
                                                    }}
                                                />
                                                {errors.color && (
                                                    <div className="invalid-feedback d-block mb-2">{errors.color.message}</div>
                                                )}
                                            </div>
                                        </div>
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

export default CalendarFormModal;
