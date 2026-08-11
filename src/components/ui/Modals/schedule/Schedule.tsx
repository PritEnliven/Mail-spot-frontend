import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { scheduleFormSchema, type ScheduleFormValues } from './schedule.schema';
import InteractiveIcon from "../../InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg"
import CloseIcon from "@images/close-icon.svg";
import CloseIconHover from "@images/close-icon-hover.svg";
import ScheduleIcon from "@images/Schedule-icon.svg";
import upDownArrowIcon from "@images/up-down-arrow-icon.svg"
import SubmitButton from '@components/ui/form/SubmitButton';
import Flatpickr from 'react-flatpickr';
import { useMailUI } from '@context/MailUIContext';
import { useComposeFormContext } from '@context/ComposeFormContext';
import { showError } from '@components/ui/toast/toastNotification';
import { useState, useEffect, useMemo, useRef } from 'react';
import { formatDate, formatTime, TimeFormat } from '@utils/dateUtil';
import BaseModal from "@components/ui/BaseModal";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";

interface ScheduleProps {
    modalId: string;
    zIndex: number;
}

function Schedule({ modalId, zIndex }: ScheduleProps) {
    const { closeModal } = useMailUI();
    const { validateForm, setScheduleDateTime, submitComposeForm } = useComposeFormContext();

    const [scheduleOptions, setScheduleOptions] = useState({
        tomorrowMorning: { date: '', time: '', dateTime: '' },
        tomorrowAfternoon: { date: '', time: '', dateTime: '' },
        tomorrowEvening: { date: '', time: '', dateTime: '' }
    });

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tomorrowMorning = new Date(tomorrow);
        tomorrowMorning.setHours(8, 0, 0, 0);

        const tomorrowAfternoon = new Date(tomorrow);
        tomorrowAfternoon.setHours(14, 0, 0, 0);

        const tomorrowEvening = new Date(tomorrow);
        tomorrowEvening.setHours(18, 0, 0, 0);

        setScheduleOptions({
            tomorrowMorning: {
                date: String(formatDate(tomorrow, TimeFormat.SCHEDULE_MODAL)),
                time: formatTime(8, 0),
                dateTime: tomorrowMorning.toISOString()
            },
            tomorrowAfternoon: {
                date: String(formatDate(tomorrow, TimeFormat.SCHEDULE_MODAL)),
                time: formatTime(14, 0),
                dateTime: tomorrowAfternoon.toISOString()
            },
            tomorrowEvening: {
                date: String(formatDate(tomorrow, TimeFormat.SCHEDULE_MODAL)),
                time: formatTime(18, 0),
                dateTime: tomorrowEvening.toISOString()
            }
        });
    }, []);

    const {
        control,
        handleSubmit,
        setValue,
        reset,
    } = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleFormSchema),
        mode: "onSubmit",
        defaultValues: {
            scheduleDateTime: new Date().toISOString(),
        },
    });

    const handleScheduleClick = (dateTime: string, option: string) => {
        setSelectedOption(option);
        // Update the form value with the selected date
        setValue('scheduleDateTime', dateTime, { shouldValidate: true });
    };

    const onClose = () => {
        reset();
        closeModal(modalId)
    }

    const onSubmit = async (data: ScheduleFormValues) => {
        const formattedDate = data.scheduleDateTime;
        const validatedComposeData = await validateForm();

        if (!validatedComposeData) {
            showError('Please complete the required fields in your email before scheduling.');
            return;
        }

        setScheduleDateTime(formattedDate);

        try {
            await submitComposeForm(validatedComposeData, formattedDate);
            closeModal(modalId);
        } catch (error) {
            console.error('Error submitting form:', error);
            showError('Unable to schedule email. Please try again.');
        }
    };
    const startFromMonth = new Date().getMonth();

    const mountMonthDropdown = useFlatpickrMonthDropdown(startFromMonth);
    const scheduleDateTimeOnChangeRef = useRef<(value: string) => void>(() => {});

    const flatpickrOptions = useMemo(() => ({
        dateFormat: 'd-m-Y H:i',
        enableTime: true,
        time_24hr: true,
        allowInput: false,
        closeOnSelect: false,
        minDate: 'today' as const,
        minTime: new Date().toTimeString().slice(0, 5),
        disableMobile: true,
        onReady: (_: Date[], __: string, instance: any) => mountMonthDropdown(instance),
        onClose: (dates: Date[]) => {
            const date = dates?.[0];
            scheduleDateTimeOnChangeRef.current(date ? date.toISOString() : '');
        },
    }), [mountMonthDropdown]);

    return (

        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className=""
            showBackdrop={false}
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div className="modal-schedule-box">
                <div className="modal-dialog  modal-dialog-centered">
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
                            <h5 className="modal-title modal-title-center" id="bottomRightModalLabel">Schedule send</h5>
                            <button type="button" className="btn-close hover-link btn  icon-hover-effect" onClick={onClose}>
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
                            <div className="schedule-body">
                                <ul className="list-style">
                                    <li>
                                        <a href="#" id="tomorrowMorning"
                                            className={`d-flex align-items-center justify-content-between schedule-link ${selectedOption === 'tomorrowMorning' ? 'active' : ''}`}
                                            onClick={() => handleScheduleClick(scheduleOptions.tomorrowMorning.dateTime, 'tomorrowMorning')}>
                                            <p className="m-0 label-sm">Tomorrow morning</p>
                                            <div className="d-flex align-items-center justify-content-end">
                                                <span className="date-content me-2 label-sm">{scheduleOptions.tomorrowMorning.date}</span>
                                                <span className="time-content label-sm">{scheduleOptions.tomorrowMorning.time}</span>
                                            </div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" id="tomorrowAfternoon"
                                            className={`d-flex align-items-center justify-content-between schedule-link ${selectedOption === 'tomorrowAfternoon' ? 'active' : ''}`}
                                            onClick={() => handleScheduleClick(scheduleOptions.tomorrowAfternoon.dateTime, 'tomorrowAfternoon')}>
                                            <p className="m-0 label-sm">Tomorrow Afternoon</p>
                                            <div className="d-flex align-items-center justify-content-end">
                                                <span className="date-content me-2 label-sm">{scheduleOptions.tomorrowAfternoon.date}</span>
                                                <span className="time-content label-sm">{scheduleOptions.tomorrowAfternoon.time}</span>
                                            </div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" id="tomorrowEvening"
                                            className={`d-flex align-items-center justify-content-between schedule-link ${selectedOption === 'tomorrowEvening' ? 'active' : ''}`}
                                            onClick={() => handleScheduleClick(scheduleOptions.tomorrowEvening.dateTime, 'tomorrowEvening')}>
                                            <p className="m-0 label-sm">Tomorrow Evening</p>
                                            <div className="d-flex align-items-center justify-content-end">
                                                <span className="date-content me-2 label-sm">{scheduleOptions.tomorrowEvening.date}</span>
                                                <span className="time-content label-sm">{scheduleOptions.tomorrowEvening.time}</span>
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                                <div className="form-group mb-3 two-arrow-input">
                                    <label className="control-label">Pick date & time</label>
                                    <div className="input-icon-add custom-datepicker-month-selector-c2-vm">
                                        <Controller
                                            name="scheduleDateTime"
                                            control={control}
                                            render={({ field }) => {
                                                scheduleDateTimeOnChangeRef.current = field.onChange;
                                                return (
                                                    <Flatpickr
                                                        value={field.value ? new Date(field.value) : ''}
                                                        options={flatpickrOptions}
                                                        className="form-control DateRangePickerStaticTop"
                                                        placeholder="Select date" />
                                                );
                                            }}
                                        />
                                        <img src={ScheduleIcon} alt="" className="input-icon-1" />
                                        <img src={upDownArrowIcon} alt="" className="input-icon-2" />
                                        <span className="left-side-after-line-icon"></span>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                    <button className="btn-new" type="button" onClick={onClose}>Cancel</button>
                                    <SubmitButton
                                        className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                                        onClick={handleSubmit(async (data) => {
                                            try {
                                                await onSubmit(data);
                                            } catch (error) {
                                                console.error('Error submitting form:', error);
                                            }
                                        }, (errors: any) => {
                                            console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                        })}
                                    >Schedule</SubmitButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default Schedule;
