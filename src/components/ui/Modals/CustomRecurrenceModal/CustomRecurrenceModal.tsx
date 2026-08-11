import InteractiveIcon from "@components/ui/InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import dateIcon from "@images/date-icon-16.svg";
import BaseModal from "@components/ui/BaseModal";
import { useMailUI } from "@context/MailUIContext";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customRecurrenceFormSchema, type CustomRecurrenceFormValues } from "./customRecurrence.schema";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import Flatpickr from 'react-flatpickr';
import SubmitButton from "@components/ui/form/SubmitButton";
import { useEffect } from "react";
import { useCalendar } from "@context/CalendarContext";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";

interface CustomRecurrenceModalProps {
    modalId: string;
    zIndex: number;
    onConfirm?: (recurrenceData: CustomRecurrenceData) => void;
    initialData?: CustomRecurrenceData;
}

interface CustomRecurrenceData {
    interval: number;
    intervalUnit: "daily" | "weekly" | "monthly" | "yearly";
    recurrenceEnd: "never" | "endOn" | "after";
    weekDay?: string[];
    endDate?: string;
    numberOfOccurrences?: number;
}


const daysOfWeekOptions = [
    { label: "Sunday", value: "sunday" },
    { label: "Monday", value: "monday" },
    { label: "Tuesday", value: "tuesday" },
    { label: "Wednesday", value: "wednesday" },
    { label: "Thursday", value: "thursday" },
    { label: "Friday", value: "friday" },
    { label: "Saturday", value: "saturday" },
];

const parseFlatpickrDate = (value?: string) => {
    if (!value || typeof value !== 'string') return undefined;
    // Handle DD-MM-YYYY format (from Flatpickr/formatted dates)
    if (value.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [d, m, y] = value.split('-').map(Number);
        if (d && m && y) return new Date(y, m - 1, d);
    }
    // Handle YYYY-MM-DD format
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = value.split('-').map(Number);
        if (y && m && d) return new Date(y, m - 1, d);
    }
    return undefined;
};

const formatLocalYmd = (date?: Date) => {
    if (!date) return undefined;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};


function CustomRecurrenceModal({ modalId, zIndex, onConfirm, initialData }: CustomRecurrenceModalProps) {
    const { closeModal } = useMailUI();
    const { selectedEvent } = useCalendar();

    const {
        control,
        handleSubmit,
        setValue,
        reset,
    } = useForm<CustomRecurrenceFormValues>({
        resolver: zodResolver(customRecurrenceFormSchema),
        defaultValues: {
            interval: 1,
            intervalUnit: "daily",
            weekDay: [],
            recurrenceEnd: "never",
            endDate: undefined,
            numberOfOccurrences: undefined,
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    useEffect(() => {
        if (initialData) {
            // Use initialData when provided (from recurrence change)
            reset({
                interval: initialData.interval || 1,
                intervalUnit: initialData.intervalUnit || "daily",
                weekDay: initialData.weekDay || [],
                recurrenceEnd: initialData.recurrenceEnd || "never",
                endDate: initialData.endDate ? formatDate(initialData.endDate, TimeFormat.DD_MM_YYYY) as string : undefined,
                numberOfOccurrences: initialData.numberOfOccurrences,
            });
        } else if (selectedEvent?.recurrence) {
            const recurrence = selectedEvent.recurrence;
            const endCondition = recurrence.endCondition;

            // Map endCondition.type to recurrenceEnd values
            let recurrenceEnd: "never" | "endOn" | "after" = "never";
            if (endCondition?.type === "on") {
                recurrenceEnd = "endOn";
            } else if (endCondition?.type === "after") {
                recurrenceEnd = "after";
            }

            reset({
                interval: recurrence.interval,
                intervalUnit: recurrence.intervalUnit,
                weekDay: recurrence.repeatOn ?? [],
                recurrenceEnd: recurrenceEnd,
                endDate: endCondition?.untilDate ? formatDate(endCondition.untilDate, TimeFormat.DD_MM_YYYY) as string : undefined,
                numberOfOccurrences: endCondition?.occurrences,
            });
        } else if (selectedEvent?.selectedEventDate) {
            // Set default endDate to selectedEventDate + 1 day for new recurrence
            const eventDate = new Date(selectedEvent.selectedEventDate);
            const defaultEndDate = new Date(eventDate);
            defaultEndDate.setDate(defaultEndDate.getDate() + 1);

            reset({
                interval: 1,
                intervalUnit: "daily",
                weekDay: [],
                recurrenceEnd: "endOn",
                endDate: formatLocalYmd(defaultEndDate),
                numberOfOccurrences: undefined,
            });
        }
    }, [reset, initialData]);

    const onSubmit = async (data: CustomRecurrenceFormValues) => {
        try {
            const payload: CustomRecurrenceData = {
                interval: data.interval,
                intervalUnit: data.intervalUnit,
                recurrenceEnd: data.recurrenceEnd,
            };

            if (data.intervalUnit === "weekly") {
                payload.weekDay = data.weekDay;
            }

            if (data.recurrenceEnd === "endOn") {
                payload.endDate = data.endDate;
            }

            if (data.recurrenceEnd === "after") {
                payload.numberOfOccurrences = data.numberOfOccurrences;
            }

            // Call the onConfirm callback with the transformed data
            onConfirm?.(payload);

            // Close the modal
            onClose();
        } catch (error) {
            console.error('Error submitting custom recurrence:', error);
        }
    };

    const startFromMonth = new Date().getMonth();
    const mountMonthDropdown = useFlatpickrMonthDropdown(startFromMonth);

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
            width="min(100vw, 360px)"
        >
            <div
                className="custom-recurrence-modal-box"
                id="customRecurrenceModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
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
                            <h1 className="modal-title modal-title-center" id="customRecurrenceModalLabel">Repeat event</h1>
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
                        <div className="modal-body" data-simplebar data-simplebar-auto-hide="false">
                            <div className="recurrence-card">
                                <div className="row row-col-control">
                                    <div className="col-12 col-m">
                                        <div className="form-group mb-0">
                                            <label className="control-label">Every</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-m">
                                        <div className="form-group mb-0">
                                            <Controller
                                                name="interval"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        className="form-control"
                                                        type="number"
                                                        min="1"
                                                        value={field.value ?? ''}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            field.onChange(raw === '' ? undefined : Number(raw));
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <Controller
                                        name="intervalUnit"
                                        control={control}
                                        render={({ field }) => {
                                            const isWeekly = field.value === "weekly";
                                            return (
                                                <>
                                                    <div className="col-9 col-m">
                                                        <div className="form-group mb-0 form-row">
                                                            <div className="input-control">
                                                                <Select2Wrapper
                                                                    value={field.value || null}
                                                                    onChange={(value) => {
                                                                        field.onChange(value);
                                                                        if (value !== "weekly") {
                                                                            setValue("weekDay", []);
                                                                        }
                                                                    }}
                                                                    options={[
                                                                        { label: "Day", value: "daily" },
                                                                        { label: "Week", value: "weekly" },
                                                                        { label: "Month", value: "monthly" },
                                                                        { label: "Year", value: "yearly" },
                                                                    ]}
                                                                    isMulti={false}
                                                                    isModal={true}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="col-12">
                                                        <hr className="my-3" />
                                                    </div>
                                                    {isWeekly && (
                                                        <div className="col-12 col-m" id="repeat-on-section">
                                                            <div className="form-group mb-0">
                                                                <label className="control-label">On (for Weekly)</label>
                                                            </div>
                                                            <div className="form-group mb-3">
                                                                <div className="weekday-checkboxes">
                                                                    {daysOfWeekOptions.map((day) => (
                                                                        <Controller
                                                                            key={day.value}
                                                                            name="weekDay"
                                                                            control={control}
                                                                            render={({ field: daysField }) => (
                                                                                <label className="control-label mb-0">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        value={day.value}
                                                                                        checked={daysField.value?.includes(day.value) || false}
                                                                                        onChange={(e) => {
                                                                                            const current = daysField.value || [];
                                                                                            daysField.onChange(
                                                                                                e.target.checked
                                                                                                    ? [...current, day.value]
                                                                                                    : current.filter((v: string) => v !== day.value)
                                                                                            );
                                                                                        }}
                                                                                    />
                                                                                    <span>{day.label.charAt(0)}</span>
                                                                                </label>
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        }}
                                    />
                                    <div className="col-md-6 col-m">
                                        <div className="radio-group">
                                            <div className="form-group">
                                                <Controller
                                                    name="recurrenceEnd"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <label className="radio-wrapper sm-label-fs">
                                                            Don't end
                                                            <input
                                                                type="radio"
                                                                value="never"
                                                                checked={field.value === 'never'}
                                                                onChange={() => {
                                                                    field.onChange('never');
                                                                    setValue('endDate', '');
                                                                    setValue('numberOfOccurrences', 0);
                                                                }}
                                                            />
                                                            <span className="custom-radio"></span>
                                                        </label>
                                                    )}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <Controller
                                                    name="recurrenceEnd"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <label className="radio-wrapper sm-label-fs">
                                                            End on
                                                            <input
                                                                type="radio"
                                                                value="endOn"
                                                                checked={field.value === 'endOn'}
                                                                onChange={() => {
                                                                    field.onChange('endOn');
                                                                    setValue('numberOfOccurrences', undefined);
                                                                }}
                                                            />
                                                            <span className="custom-radio"></span>
                                                        </label>
                                                    )}
                                                />
                                            </div>
                                            <div className="form-group mb-0">
                                                <Controller
                                                    name="recurrenceEnd"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <label className="radio-wrapper sm-label-fs">
                                                            End after
                                                            <input
                                                                type="radio"
                                                                value="after"
                                                                checked={field.value === 'after'}
                                                                onChange={() => {
                                                                    field.onChange('after');
                                                                    setValue('endDate', undefined);
                                                                }}
                                                            />
                                                            <span className="custom-radio"></span>
                                                        </label>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 col-m d-flex align-items-end">
                                        <div id="end-options" className="w-100">
                                            <Controller
                                                name="recurrenceEnd"
                                                control={control}
                                                render={({ field }) => (
                                                    <>
                                                        <div className="col-12 mb-2">
                                                            <div className="form-group mb-0" id="date-pv">
                                                                <div className="input-icon-add custom-datepicker-month-selector-c2-v">
                                                                    <Controller
                                                                        name="endDate"
                                                                        control={control}
                                                                        render={({ field: endDateField }) => (
                                                                            <Flatpickr
                                                                                value={parseFlatpickrDate(endDateField.value)}
                                                                                onChange={(dates) => {
                                                                                    const date = dates[0];
                                                                                    endDateField.onChange(
                                                                                        formatLocalYmd(date)
                                                                                    );
                                                                                }}
                                                                                options={{
                                                                                    mode: 'single',
                                                                                    dateFormat: 'd-m-Y',
                                                                                    allowInput: false,
                                                                                    minDate: formatDate(initialData?.endDate, TimeFormat.DDMMYYYY),
                                                                                    disableMobile: true,
                                                                                    onReady: (_, __, instance) => mountMonthDropdown(instance)
                                                                                }}
                                                                                readOnly={false}
                                                                                className="form-control"
                                                                                disabled={field.value !== 'endOn'}
                                                                            />
                                                                        )}
                                                                    />

                                                                    <img src={dateIcon} alt="" className="input-icon-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-12">
                                                            <div className="form-group mb-0 number-input" id="occurrences">
                                                                <Controller
                                                                    name="numberOfOccurrences"
                                                                    control={control}
                                                                    render={({ field: occurrencesField }) => (
                                                                        <input
                                                                            className="form-control mt-0"
                                                                            type="number"
                                                                            placeholder="No. of occurrences"
                                                                            disabled={field.value !== 'after'}
                                                                            value={occurrencesField.value ?? ''}
                                                                            onChange={(e) => {
                                                                                const raw = e.target.value;
                                                                                occurrencesField.onChange(raw === '' ? undefined : Number(raw));
                                                                            }}
                                                                        />
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between px-2 mt-4">
                                        <button type="button" className="btn-new" onClick={onClose}> Cancel </button>
                                        <SubmitButton
                                            className="btn-new btn-new-bg loading-spinner"
                                            onClick={handleSubmit(onSubmit, (errors: any) => {
                                                console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                            })}
                                        >
                                            Done
                                        </SubmitButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default CustomRecurrenceModal;
