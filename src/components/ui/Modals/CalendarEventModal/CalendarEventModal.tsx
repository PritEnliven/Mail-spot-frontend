import addTitleIcon from "@assets/images/add-title-icon-16.svg";
import arrowPointingOutIconHover from "@assets/images/arrows-pointing-out-icon-hover.svg";
import arrowPointingOutIcon from "@assets/images/arrows-pointing-out-icon.svg";
import calendarEventIcon from "@assets/images/calendar-event-icon.svg";
import closeIconHover from "@assets/images/close-icon-hover.svg";
import closeIcon from "@assets/images/close-icon.svg";
import dateIcon from "@assets/images/date-icon-16.svg";
import earthTimeIcon from "@assets/images/erth-time-icon.svg";
import refreshIcon from "@assets/images/refresh-icon.svg";
import timeIcon from "@assets/images/time-icon-16.svg";
import BaseModal from "@components/ui/BaseModal";
import GuestTag, { type Guest } from "@components/ui/calendar/GuestTag";
import ColorSingleSelect from "@components/ui/form/Select2ColorOption";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import SubmitButton from "@components/ui/form/SubmitButton";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { showSuccess } from "@components/ui/toast/toastNotification";
import TimerList from "@components/ui/Modals/CalendarEventModal/TimerList";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";
import { useCalendar } from "@context/CalendarContext";
import { useContacts } from "@context/index";
import { useMailUI } from "@context/MailUIContext";
import { useCalendarEventForm } from "@hooks/useCalendarEventForm";
import { useRecurrence } from "@hooks/useRecurringForm";
import addPesionIcon from "@images/add-pesion-icon.svg";
import descriptionIcon from "@images/description-icon-16.svg";
import linkIcon from "@images/link-icon-16.svg";
import locationIcon from "@images/location-icon.svg";
import { createEvent, editEvent } from "@services/calendar/calendarService";
import { generateTimeOptions } from "@utils/calendarUtil";
import { formatDate, formatTime24HrFrom12HrString, parseDateForFlatpickr, TimeFormat } from "@utils/dateUtil";
import { filterGuestByEmail, normalizeGuests } from "@utils/guestUtil";
import { useEffect, useMemo, useRef } from "react";
import Flatpickr from 'react-flatpickr';
import { Controller, useWatch, type FieldErrors } from "react-hook-form";
import SimpleBar from 'simplebar-react';
import { colorListConfi } from "../../../../config/fullCalendar.config";
import type { CalendarEventModalFormValues } from "./calendarEventModal.schema";

/** Keeps Flatpickr's `value` Date referentially stable unless the form string changes. */
function StableEventDatePicker({
    value,
    options,
    className,
    placeholder,
    id,
}: {
    value?: string;
    options: Record<string, unknown>;
    className?: string;
    placeholder?: string;
    id?: string;
}) {
    const parsedValue = useMemo(() => parseDateForFlatpickr(value) ?? '', [value]);
    return (
        <Flatpickr
            id={id}
            value={parsedValue}
            options={options}
            className={className}
            placeholder={placeholder}
        />
    );
}

const timezoneOptions = [
    { value: "UTC", label: "GMT +00:00 — UTC" },
    { value: "Asia/Kolkata", label: "GMT +05:30 — Asia/Kolkata" },
    { value: "America/New_York", label: "GMT -05:00 — America/New_York" },
    { value: "Europe/London", label: "GMT +00:00 — Europe/London" },
    { value: "Asia/Dubai", label: "GMT +04:00 — Asia/Dubai" },
    { value: "Asia/Tokyo", label: "GMT +09:00 — Asia/Tokyo" },
    { value: "Australia/Sydney", label: "GMT +10:00 — Australia/Sydney" }
];

interface CalendarEventModalProps {
    modalId: string;
    zIndex: number;
    // Pass anything you want through openModal
    info?: any;
    title?: string;
    startDate?: string;
    endDate?: string;
    guestsList?: string[];
    location?: string;
    meetingLink?: string;
    description?: string;
    timeZone?: string;
    recurrence?: any;
    [key: string]: any;
}

export function getISTRoundedStartEndTime(
    isoDateTime?: string,
    intervalMinutes = 15
): { startTime: string; endTime: string } {
    if (!isoDateTime) {
        return { startTime: '', endTime: '' };
    }

    // 1️⃣ Parse ISO with offset correctly
    const parsed = new Date(isoDateTime);
    if (isNaN(parsed.getTime())) {
        return { startTime: '', endTime: '' };
    }

    const istDate = new Date(
        parsed.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    );

    const intervalMs = intervalMinutes * 60 * 1000;
    const roundedStart = new Date(
        Math.round(istDate.getTime() / intervalMs) * intervalMs
    );

    const roundedEnd = new Date(roundedStart.getTime() + intervalMs);

    const formatHHMM = (d: Date) =>
        `${String(d.getHours()).padStart(2, '0')}:${String(
            d.getMinutes()
        ).padStart(2, '0')}`;

    return {
        startTime: formatHHMM(roundedStart),
        endTime: formatHHMM(roundedEnd),
    };
}

function CalendarEventModal({ modalId, zIndex, ...props }: CalendarEventModalProps) {
    const { contacts, searchContacts, fetchContacts, resetContactSuggestions, loadMoreContacts, hasMoreContacts, isLoadingContacts, isLoadingMoreContacts } = useContacts();
    const { closeModal, openModal } = useMailUI();
    const { getAllEventList, selectedEvent, calendars } = useCalendar();
    const pendingEditDataRef = useRef<any>(null);
    const { startTime, endTime } = getISTRoundedStartEndTime(props.dateStr);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        clearErrors,
        formState: { errors },
    } = useCalendarEventForm();

    useEffect(() => {
        if (!props?.isEdit) return;
        if (!startTime || !endTime) return;

        setValue('eventStartTime', startTime, { shouldDirty: false });
        setValue('eventEndTime', endTime, { shouldDirty: false });

    }, [startTime, endTime, setValue]);

    const eventStartDate = useWatch({
        control,
        name: 'eventStartDate',
    });

    const {
        getSelectValue,
        onChange: onRecurrenceChange,
        buildPayload
    } = useRecurrence({ setValue, openModal, eventStartDate });

    const guestsList = useWatch({
        control,
        name: 'guestsList',
    });

    const eventStartTime = useWatch({
        control,
        name: 'eventStartTime',
    });

    const guests: Guest[] = normalizeGuests(guestsList);
    const selectedCalendarId = useWatch({
        control,
        name: 'calendarId',
    });

    const defaultCalendarId = calendars.find((calendar) => calendar.isDefault)?._id || calendars[0]?._id || '';
    const calendarOptions = calendars.map((calendar) => ({
        value: calendar._id,
        label: calendar.name,
    }));
    const selectedCalendar = calendars.find((calendar) => calendar._id === selectedCalendarId);
    const selectedCalendarColor = selectedCalendar?.color || '';

    const resolveEventColor = (eventColor: string | undefined, calendarId: string) => {
        const calendar = calendars.find((item) => item._id === calendarId);
        if (eventColor && eventColor !== calendar?.color) {
            return eventColor;
        }
        return '';
    };

    const onRemoveGuest = (email: string) => {
        const current = getValues("guestsList") || [];
        setValue("guestsList", filterGuestByEmail(current, email), { shouldDirty: true });
    };

    // Reset/populate form when modal opens or props change
    useEffect(() => {
        if (props?.isEdit) {
            // Normalize guestsList to ensure all entries are strings
            const normalizedGuests = Array.isArray(props.guestList)
                ? props.guestList.map(g => typeof g === 'string' ? g : g.email || '').filter(Boolean)
                : [];

            reset({
                title: props.title || '',
                eventStartDate: props.startDate ? formatDate(props.startDate, TimeFormat.YYYYMMDD) as string : '',
                eventEndDate: props.endDate ? formatDate(props.endDate, TimeFormat.YYYYMMDD) as string : '',
                allDayCheckbox: !!props.allDay,
                eventStartTime: props.startTime || '',
                eventEndTime: props.endTime || '',
                eventLocation: props.location || '',
                eventMeetingLink: props.meetingLink || '',
                eventDescription: props.eventDescription || '',
                eventTimeZone: props.timeZone || 'Asia/Kolkata',
                guestsList: normalizedGuests,
                eventColor: props.eventColor || '',
                calendarId: props.calendarId || defaultCalendarId,
                recurrence: props.recurrence?.isCustom
                    ? "custom"
                    : (props.recurrence?.type ?? "doesNotRepeat"),
                sendMailToGuest: props.sendMailToGuest ?? false
            });
        } 
        else if (props?.date) {
            reset({
                title: '',
                eventColor: '',
                calendarId: defaultCalendarId,
                eventStartDate: formatDate(props.date, TimeFormat.YYYYMMDD) as string,
                eventEndDate: formatDate(props.date, TimeFormat.YYYYMMDD) as string,
                eventStartTime: '',
                eventEndTime: '',
                allDayCheckbox: !!props.allDay,
                recurrence: 'doesNotRepeat',
                guestsList: [],
                eventLocation: '',
                eventMeetingLink: '',
                eventDescription: '',
                sendMailToGuest: false,
                eventTimeZone: 'Asia/Kolkata',
            });
        } else {
            const today = formatDate(new Date(), TimeFormat.YYYYMMDD) as string;
            reset({
                title: '',
                eventColor: '',
                calendarId: defaultCalendarId,
                eventStartDate: today,
                eventStartTime: '',
                eventEndDate: today,
                eventEndTime: '',
                allDayCheckbox: true,
                recurrence: 'doesNotRepeat',
                guestsList: [],
                eventLocation: '',
                eventMeetingLink: '',
                eventDescription: '',
                sendMailToGuest: false,
                eventTimeZone: 'Asia/Kolkata',
            });
        }
        return () => {
            reset();
        };
    }, [props?.isEdit, props?.date, props?.calendarId, reset]);

    useEffect(() => {
        if (!defaultCalendarId) return;
        if (!getValues('calendarId')) {
            setValue('calendarId', props?.calendarId || defaultCalendarId, { shouldDirty: false });
        }
    }, [defaultCalendarId, getValues, props?.calendarId, setValue]);

    const onClose = () => {
        closeModal(modalId);
        if (props?.parentModalId) {
            closeModal(props.parentModalId);
        }
    };

    /** Date-only YYYY-MM-DD from local calendar fields — never UTC (avoids off-by-one). */
    const formatDateForCalendarEvent = (date: string | Date | undefined) => {
        if (!date) return '';
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        return (formatDate(date, TimeFormat.YYYYMMDD) as string) || '';
    };

    const onSubmit = async (data: CalendarEventModalFormValues) => {
        const recurrencePayloadString = buildPayload(data.recurrence);

        // Transform form data to match backend requirements
        const payload = {
            title: data.title,
            startDate: formatDateForCalendarEvent(data.eventStartDate),
            endDate: formatDateForCalendarEvent(data.eventEndDate),
            startTime: formatTime24HrFrom12HrString(data.eventStartTime),
            endTime: formatTime24HrFrom12HrString(data.eventEndTime),
            allDayCheckbox: data.allDayCheckbox,
            location: data.eventLocation || '',
            meetingLink: data.eventMeetingLink || '',
            description: data.eventDescription || '',
            timeZone: data.eventTimeZone,
            eventColor: resolveEventColor(data.eventColor, data.calendarId),
            calendarId: data.calendarId,
            recurrence: recurrencePayloadString,
            sendMailToGuest: data.sendMailToGuest,
            guest: data.guestsList ? data.guestsList.join(',') : ''
        };

        if (props?.isEdit) {
            const selectedEventDateValue = selectedEvent?.selectedEventDate;
            const editEventDate = selectedEventDateValue
                ? (() => {
                    const d = new Date(selectedEventDateValue as any);
                    return isNaN(d.getTime()) ? undefined : d;
                })()
                : undefined;

            const editPayload = {
                eventId: selectedEvent?.id || '',
                title: data.title,
                eventColor: resolveEventColor(data.eventColor, data.calendarId),
                calendarId: data.calendarId,
                startDate: formatDateForCalendarEvent(data.eventStartDate),
                endDate: formatDateForCalendarEvent(data.eventEndDate),
                startTime: formatTime24HrFrom12HrString(data.eventStartTime),
                endTime: formatTime24HrFrom12HrString(data.eventEndTime),
                allDayCheckbox: data.allDayCheckbox,
                recurrence: recurrencePayloadString ? JSON.parse(recurrencePayloadString) : null,
                guestsList: data.guestsList,
                location: data.eventLocation || '',
                meetingLink: data.eventMeetingLink || '',
                description: data.eventDescription || '',
                attachments: [],
                editEventDate,
                eventEditType: '',
                sendMailToGuest: data.sendMailToGuest,
                type: "update"
            };

            if (recurrencePayloadString) {
                pendingEditDataRef.current = editPayload;
                const recurrenceData = JSON.parse(recurrencePayloadString);
                openModal('recurrenceModal', {
                    onConfirm: (eventEditType: 'thisEvent' | 'thisAndFollowingEvent' | 'allEvent') => {
                        const pendingEditData = pendingEditDataRef.current;
                        if (!pendingEditData) {
                            console.error('No pending edit data available');
                            return;
                        }

                        const editPayload = {
                            ...pendingEditData,
                            eventEditType,
                        };

                        editEvent(editPayload).then((response) => {
                            if (response.statusCode === 200) {
                                getAllEventList();
                                onClose();
                            }
                        }).catch((error) => {
                            console.error('Error editing event:', error);
                        });
                    },
                    initialData: recurrenceData,
                });
            } else {
                editPayload.eventEditType = 'originalEvent';
                const response = await editEvent(editPayload);
                if (response.statusCode === 200) {
                    getAllEventList();
                    onClose();
                }
            }
            return;
        }

        // Handle form submission here
        const response = await createEvent(payload);
        if (response.statusCode === 200) {
            showSuccess('Event created successfully');
            getAllEventList();
            onClose();
        }
    };

    const handleInvalidSubmit = (formErrors: FieldErrors<CalendarEventModalFormValues>) => {
        console.log('SUBMIT BLOCKED BY ERRORS:', formErrors);
    };

    const timeOptions15 = generateTimeOptions({ interval: 15 });

    useEffect(() => {
        if (!eventStartTime) return;
        const startIndex = timeOptions15.indexOf(eventStartTime);
        if (startIndex === -1) return;
        const currentEndTime = getValues('eventEndTime');
        if (!currentEndTime) return;
        const endIndex = timeOptions15.indexOf(currentEndTime);
        if (endIndex === -1) return;
        // If end time is same or before start time → reset it
        if (endIndex <= startIndex) {
            setValue('eventEndTime', '', { shouldDirty: true });
        }

    }, [eventStartTime, timeOptions15, getValues, setValue]);

    const endTimeMinSequence = (() => {
        if (!eventStartTime) return undefined;
        const startIndex = timeOptions15.indexOf(eventStartTime);
        if (startIndex === -1) return undefined;
        return startIndex + 1;
    })();

    // Keep Flatpickr option objects stable across guest-contact pagination re-renders.
    // Otherwise react-flatpickr destroys/recreates the inputs and they visibly blink.
    const startFromMonth = useMemo(() => new Date().getMonth(), []);
    const mountMonthDropdown = useFlatpickrMonthDropdown(startFromMonth);
    const startDateOnChangeRef = useRef<(value: string) => void>(() => {});
    const endDateOnChangeRef = useRef<(value: string) => void>(() => {});
    const syncEndDateAfterStartRef = useRef<(startYmd: string) => void>(() => {});

    syncEndDateAfterStartRef.current = (startYmd: string) => {
        const currentEnd = getValues('eventEndDate');
        if (!currentEnd || currentEnd < startYmd) {
            setValue('eventEndDate', startYmd, { shouldDirty: true });
        }
    };

    const minEndDate = useMemo(() => {
        if (!eventStartDate) return undefined;
        return parseDateForFlatpickr(eventStartDate);
    }, [eventStartDate]);

    const formatFlatpickrLocalYmd = (date: Date) =>
        formatDate(date, TimeFormat.YYYYMMDD) as string;

    const startFlatpickrOptions = useMemo(() => ({
        mode: 'single' as const,
        dateFormat: 'd-m-Y',
        allowInput: false,
        disableMobile: true,
        onReady: (_dates: Date[], _str: string, instance: any) => mountMonthDropdown(instance),
        onChange: (dates: Date[]) => {
            const date = dates[0];
            if (date) {
                const ymd = formatFlatpickrLocalYmd(date);
                startDateOnChangeRef.current(ymd);
                // Keep To date valid so its calendar opens on the same month as From
                syncEndDateAfterStartRef.current(ymd);
            } else {
                startDateOnChangeRef.current('');
            }
        },
    }), [mountMonthDropdown]);

    const endFlatpickrOptions = useMemo(() => ({
        mode: 'single' as const,
        dateFormat: 'd-m-Y',
        allowInput: false,
        minDate: minEndDate,
        disableMobile: true,
        onReady: (_dates: Date[], _str: string, instance: any) => {
            mountMonthDropdown(instance);
            // Ensure calendar opens on the selected / min month (not a stale prior month)
            const jumpTo = instance.selectedDates?.[0] || minEndDate;
            if (jumpTo) {
                instance.jumpToDate(jumpTo, true);
            }
        },
        onOpen: (_dates: Date[], _str: string, instance: any) => {
            const jumpTo = instance.selectedDates?.[0] || minEndDate;
            if (jumpTo) {
                instance.jumpToDate(jumpTo, true);
            }
        },
        onChange: (dates: Date[]) => {
            const date = dates[0];
            if (date) {
                endDateOnChangeRef.current(formatFlatpickrLocalYmd(date));
            } else {
                endDateOnChangeRef.current('');
            }
        },
    }), [mountMonthDropdown, minEndDate]);

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
            width="min(100vw, 640px)"
        >
            <div
                className="calendar-event-modal search-bar-work"
                id="eventModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content modal-box-shadow-c1 max-w-640">
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
                            <h5 className="modal-title modal-title-center" id="eventModalTitle"> {props?.isEdit ? 'Edit Event' : 'Create new event'}</h5>
                            <button type="button" className="btn-close hover-link btn  icon-hover-effect" onClick={onClose}>
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
                        <div className="modal-body p-0" >
                            <SimpleBar
                                className="CalendarModalSimpleBar"
                                autoHide={false}
                                forceVisible="y"
                            >
                                <div className="calendar-event-modal-body p-16 pb-0">
                                    <form
                                        id="calendarEventForm"
                                        noValidate
                                        onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
                                    >
                                    <div className="d-block">
                                        <div className="form-group m-0 mb-2 d-flex align-items-center justify-content-between">
                                            <label className="control-label mb-0">Title</label>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <div className="form-group mb-3 w-100 me-3">
                                                <div className="input-icon-add">
                                                    <Controller
                                                        name="title"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <input
                                                                type="text"
                                                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                                id="title"
                                                                placeholder="Add title"
                                                                {...field}
                                                            />
                                                        )}
                                                    />
                                                    <img src={addTitleIcon} alt="" className="input-icon-1" />
                                                </div>
                                                {errors.title && (
                                                    <div className="invalid-feedback d-block">{errors.title.message}</div>
                                                )}
                                            </div>
                                            <div className="form-group mb-3 form-row color-pik select2-color-pick color-pik">
                                                <div className="input-control">
                                                    <Controller
                                                        name="eventColor"
                                                        control={control}
                                                        render={({ field }) => {
                                                            const displayColor = field.value || selectedCalendarColor;
                                                            const selectedOption =
                                                                colorListConfi.find(opt => opt.value === displayColor) ??
                                                                (displayColor
                                                                    ? { label: displayColor, value: displayColor, color: displayColor }
                                                                    : null);

                                                            return (
                                                                <ColorSingleSelect
                                                                    value={selectedOption}
                                                                    options={colorListConfi}
                                                                    onChange={(option) => {
                                                                        field.onChange(option?.value ?? "");
                                                                    }}
                                                                />
                                                            );
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group mb-3">
                                            <label className="control-label" htmlFor="eventCalendar">Calendar</label>
                                            <div className="input-icon-add">
                                                <img src={calendarEventIcon} alt="" className="input-icon-1" width={16} height={16} />
                                                <Controller
                                                    name="calendarId"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select2Wrapper
                                                            value={field.value || defaultCalendarId}
                                                            onChange={field.onChange}
                                                            options={calendarOptions}
                                                            isMulti={false}
                                                            isModal={true}
                                                            placeholder="Select calendar"
                                                        />
                                                    )}
                                                />
                                            </div>
                                            {errors.calendarId && (
                                                <div className="invalid-feedback d-block">{errors.calendarId.message}</div>
                                            )}
                                        </div>
                                        <div className="row time-cntrol">
                                            <div className="form-group m-0 mb-2 px-2 d-flex align-items-center justify-content-between">
                                                <label className="control-label mb-0">
                                                    Date, time &amp; repeat event
                                                </label>
                                                <a href="#" className="fs-12 send-bcc show-time-zone d-none">
                                                    Show time zone
                                                </a>
                                            </div>
                                            <div className="col-md-6 p-0 d-flex flex-wrap event-datetime-fields">
                                                <div className="col-md-6 event-date-field">
                                                    <div className="form-group mb-2">
                                                        <div className="input-icon-add custom-datepicker-month-selector-c2-vm">
                                                            <Controller
                                                                name="eventStartDate"
                                                                control={control}
                                                                render={({ field }) => {
                                                                    startDateOnChangeRef.current = field.onChange;
                                                                    return (
                                                                    <StableEventDatePicker
                                                                        value={field.value}
                                                                        id="eventStartDate"
                                                                        options={startFlatpickrOptions}
                                                                        className={`form-control DateRangePickerStaticTop datepickermodal ${errors.eventStartDate ? 'is-invalid' : ''}`}
                                                                        placeholder="Select date range"
                                                                    />
                                                                    );
                                                                }}
                                                            />
                                                            <img
                                                                src={dateIcon}
                                                                alt=""
                                                                className="input-icon-1"
                                                            />
                                                        </div>
                                                        {errors.eventStartDate && (
                                                            <div className="invalid-feedback d-block">{errors.eventStartDate.message}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`col-md-6 all-day-time-show-hid event-time-field ${watch('allDayCheckbox') ? 'd-none' : ''}`} id="eventStartTimeSection">
                                                    <div className="form-group mb-2">
                                                        <div className="input-icon-add position-relative custom-datepicker-month-selector-c2-vm">
                                                            <Controller
                                                                name="eventStartTime"
                                                                control={control}
                                                                defaultValue="05:00 PM"
                                                                render={({ field }) => (
                                                                    <TimerList
                                                                        value={field.value || ''}
                                                                        onChange={field.onChange}
                                                                        options={timeOptions15}
                                                                        className={errors.eventStartTime ? 'is-invalid' : ''}
                                                                    />
                                                                )}
                                                            />
                                                            <img src={timeIcon} alt="" className="input-icon-1" />
                                                        </div>
                                                        {errors.eventStartTime && (
                                                            <div className="invalid-feedback d-block">{errors.eventStartTime.message}</div>
                                                        )}
                                                        <div className="custom-time-dropdown-container" id="eventStartTimeDropdown"></div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6 event-date-field">
                                                    <div className="form-group mb-2">
                                                        <div className="input-icon-add custom-datepicker-month-selector-c2-vm">
                                                            <Controller
                                                                name="eventEndDate"
                                                                control={control}
                                                                render={({ field }) => {
                                                                    endDateOnChangeRef.current = field.onChange;
                                                                    return (
                                                                        <StableEventDatePicker
                                                                            value={field.value}
                                                                            options={endFlatpickrOptions}
                                                                            className={`form-control DateRangePickerStaticTop datepickermodal ${errors.eventEndDate ? 'is-invalid' : ''}`}
                                                                            placeholder="Select enddate"
                                                                        />
                                                                    );
                                                                }}
                                                            />
                                                            <img src={dateIcon} alt="" className="input-icon-1" />
                                                        </div>
                                                        {errors.eventEndDate && (
                                                            <div className="invalid-feedback d-block">{errors.eventEndDate.message}</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`col-md-6 all-day-time-show-hid event-time-field ${watch('allDayCheckbox') ? 'd-none' : ''}`} id="eventEndTimeSection">
                                                    <div className="form-group mb-2">
                                                        <div className="input-icon-add position-relative">
                                                            <Controller
                                                                name="eventEndTime"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <TimerList
                                                                        key={`endTime-${field.value}-${endTimeMinSequence}`}
                                                                        value={field.value || ''}
                                                                        onChange={field.onChange}
                                                                        options={timeOptions15}
                                                                        minSequence={endTimeMinSequence}
                                                                        className={errors.eventEndTime ? 'is-invalid' : ''}
                                                                    />
                                                                )}
                                                            />
                                                            <img src={timeIcon} alt="" className="input-icon-1" />
                                                        </div>
                                                        {errors.eventEndTime && (
                                                            <div className="invalid-feedback d-block">{errors.eventEndTime.message}</div>
                                                        )}
                                                        <div className="custom-time-dropdown-container" id="eventEndTimeDropdown"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 px-2 d-flex flex-wrap">
                                                <div className="col-md-12 timezone-box">
                                                    <div className="form-group mb-2 form-row">
                                                        <div className="input-control">
                                                            <div className="input-icon-add">
                                                                <img src={earthTimeIcon} alt="" className="input-icon-1" />
                                                                <Controller
                                                                    name="eventTimeZone"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Select2Wrapper
                                                                            value={field.value || "Asia/Kolkata"}
                                                                            onChange={field.onChange}
                                                                            options={timezoneOptions}
                                                                            isMulti={false}
                                                                            isModal={true}
                                                                        />
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    className="col-md-12 timezone-box d-none"
                                                    id="eventEndTimezone"
                                                >
                                                    <div className="form-group form-row mb-2">
                                                        <div className="input-control">
                                                            <div className="input-icon-add">
                                                                <img src={earthTimeIcon} alt="" className="input-icon-1" />
                                                                <Controller
                                                                    name="eventTimeZone"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Select2Wrapper
                                                                            value={field.value || "Asia/Kolkata"}
                                                                            onChange={field.onChange}
                                                                            options={timezoneOptions}
                                                                            isMulti={false}
                                                                            isModal={true}
                                                                        />
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row time-cntrol mb-3 justify-content-between">
                                            <div className="col-md-2  d-flex align-items-center">
                                                <div className="form-group m-0 mb-2 d-flex align-items-center">
                                                    <div className="mail-received-check-btn me-2">
                                                        <div className="checkbox-custom table-check">
                                                            <Controller
                                                                name="allDayCheckbox"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <input
                                                                        className="list-child"
                                                                        type="checkbox"
                                                                        id="all-day-checkbox"
                                                                        checked={field.value}
                                                                        onChange={(e) => {
                                                                            field.onChange(e.target.checked);
                                                                            if (e.target.checked) {
                                                                                clearErrors(['eventStartTime', 'eventEndTime']);
                                                                            }
                                                                        }}
                                                                    />
                                                                )}
                                                            />
                                                            <label
                                                                htmlFor="all-day-checkbox"
                                                                className="label-text"
                                                            />
                                                        </div>
                                                    </div>
                                                    <label
                                                        htmlFor="all-day-checkbox"
                                                        className="control-label m-0 all-day-checkbox"
                                                    >
                                                        All Day
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row time-cntrol mb-3 justify-content-between">
                                            <div className="col-md-6">
                                                <div className="form-group mb-2 form-row does-not-repeat-box">
                                                    <div className="input-control">
                                                        <div className="input-icon-add">
                                                            <img src={refreshIcon} alt="" width={16} height={16} className="input-icon-1" />
                                                            <Controller
                                                                name="recurrence"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select2Wrapper
                                                                        value={getSelectValue(field.value)}
                                                                        onChange={onRecurrenceChange}
                                                                        options={[
                                                                            { label: "Does not repeat", value: "doesNotRepeat" },
                                                                            { label: "Daily", value: "daily" },
                                                                            { label: "Weekly", value: "weekly" },
                                                                            { label: "Monthly", value: "monthly" },
                                                                            { label: "Yearly", value: "yearly" },
                                                                            { label: "Custom", value: "custom" },
                                                                        ]}
                                                                        isMulti={false}
                                                                        isModal={true}
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className="col-auto ends-on-box d-none"
                                                id="customRecurrenceStringBox"
                                            >
                                                <div className="form-group mb-2">
                                                    <div className="input-icon-add d-flex align-items-center justify-content-start">
                                                        <span id="customRecurrenceString" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-block guests-section-calendar po">
                                            <div className="form-group form-row select2-profile mb-2">
                                                <label className="control-label">Guests</label>
                                                <div className="input-control">
                                                    <div className="input-icon-add">
                                                        <img src={addPesionIcon} alt="" width={16} height={16} className="input-icon-1" />
                                                        <Controller
                                                            name="guestsList"
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
                                                                    isModal={true}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-group  mb-2">
                                                <div className="">
                                                    <div className="mt-2 d-block selected-tags-addmail mb-3">
                                                        <SimpleBar
                                                            className="gustsTagsScrollbar"
                                                            autoHide={false}
                                                            forceVisible="y"
                                                        >
                                                            {guests.length > 0
                                                                && guests.map((guest, index) => (
                                                                    <GuestTag
                                                                        key={`${guest.email}-${index}`}
                                                                        guest={guest}
                                                                        mode="edit"
                                                                        onRemove={onRemoveGuest}
                                                                    />
                                                                ))
                                                            }
                                                        </SimpleBar>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row time-cntrol ">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label htmlFor="location" className="control-label">
                                                        Location
                                                    </label>
                                                    <div className="input-icon-add">
                                                        <img src={locationIcon} alt="" width={16} height={16} className="input-icon-1" />
                                                        <Controller
                                                            name="eventLocation"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="location"
                                                                    placeholder="Add location"
                                                                    {...field}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label htmlFor="meetingLink" className="control-label"> Meeting Link </label>
                                                    <div className="input-icon-add">
                                                        <img src={linkIcon} alt="" className="input-icon-1" />
                                                        <Controller
                                                            name="eventMeetingLink"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="meetingLink"
                                                                    placeholder="Add meeting link"
                                                                    {...field}
                                                                />
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row time-cntrol ">
                                            <div className="form-group px-2 description">
                                                <label htmlFor="description" className="control-label">
                                                    Description
                                                </label>
                                                <div className="input-icon-add">
                                                    <img src={descriptionIcon} alt="" className="input-icon-1" />
                                                    <Controller
                                                        name="eventDescription"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <textarea
                                                                className="form-control"
                                                                id="description"
                                                                placeholder="Add description"
                                                                rows={3}
                                                                {...field}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-group m-0 d-flex align-items-center px-2 mb-3">
                                                <div className="mail-received-check-btn me-2 p-0">
                                                    <div className="checkbox-custom table-check">
                                                        <Controller
                                                            name="sendMailToGuest"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <input
                                                                    className="list-child"
                                                                    type="checkbox"
                                                                    id="sendMailToGuest"
                                                                    checked={field.value}
                                                                    onChange={field.onChange}
                                                                />
                                                            )}
                                                        />
                                                        <label htmlFor="sendMailToGuest" className="label-text" />
                                                    </div>
                                                </div>
                                                <label htmlFor="sendMailToGuest" id="sendMailToGuest" className="control-label m-0 all-day-chaeck">
                                                    Send Mail To Guest
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    </form>
                                </div>
                            </SimpleBar>
                            <div className="compose-btn-box d-flex align-items-center justify-content-between">
                                <button type="button" className="btn-new" onClick={onClose}> Cancel </button>
                                <SubmitButton className="btn-new btn-new-bg"
                                    onClick={handleSubmit(onSubmit, handleInvalidSubmit)}
                                >
                                    Save
                                </SubmitButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>

    )
}

export default CalendarEventModal;