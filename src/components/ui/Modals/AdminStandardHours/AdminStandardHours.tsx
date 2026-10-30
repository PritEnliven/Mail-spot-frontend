import BaseModal from '@components/ui/BaseModal';
import Select2Wrapper, { type SingleOption } from '@components/ui/form/Select2Wrapper';
import SubmitButton from '@components/ui/form/SubmitButton';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import CustomTimeSelector from '@components/ui/Modals/CalendarEventModal/TimerList';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useAdminUI } from '@context/AdminUIContext';
import timeIcon from '@images/time-icon-16.svg';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import {
    adminGetUserStandardHours,
    adminSaveUserStandardHours,
    type StandardHoursDay,
} from '@services/adminService/adminService';
import { generateTimeOptions } from '@utils/calendarUtil';
import { formatTime12HrFrom24HrString, formatTime24HrFrom12HrString } from '@utils/dateUtil';
import { useEffect, useMemo, useState } from 'react';

interface AdminStandardHoursProps {
    modalId: string;
    zIndex?: number;
    userId: string;
    userName?: string;
    onSaved?: () => void;
}

interface DayRow {
    day: number;
    label: string;
    active: boolean;
    start: string;
    end: string;
}

const TIMEZONE_OPTIONS: SingleOption[] = [
    { value: 'UTC', label: 'GMT +00:00 — UTC' },
    { value: 'Asia/Kolkata', label: 'GMT +05:30 — Asia/Kolkata' },
    { value: 'America/New_York', label: 'GMT -05:00 — America/New_York' },
    { value: 'Europe/London', label: 'GMT +00:00 — Europe/London' },
    { value: 'Asia/Dubai', label: 'GMT +04:00 — Asia/Dubai' },
    { value: 'Asia/Tokyo', label: 'GMT +09:00 — Asia/Tokyo' },
    { value: 'Australia/Sydney', label: 'GMT +10:00 — Australia/Sydney' },
];

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_OPTIONS_15 = generateTimeOptions({ interval: 15 });

const DEFAULT_START = '09:00 AM';
const DEFAULT_END = '06:00 PM';

const apiErrorMessage = (response: any, fallback: string): string =>
    response?.data?.error
    || response?.data?.message
    || response?.message
    || response?.error
    || fallback;

const toDisplayTime = (value: unknown, fallback: string): string => {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    const trimmed = value.trim();
    if (/AM|PM/i.test(trimmed)) {
        return formatTime12HrFrom24HrString(formatTime24HrFrom12HrString(trimmed)) || fallback;
    }
    return formatTime12HrFrom24HrString(trimmed) || fallback;
};

const toMinutes = (value: string): number | null => {
    const time24 = formatTime24HrFrom12HrString(value);
    if (!time24) return null;
    const [hours, minutes] = time24.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

const buildDefaultDays = (): DayRow[] =>
    DAY_LABELS.map((label, day) => ({
        day,
        label,
        active: day >= 1 && day <= 5,
        start: DEFAULT_START,
        end: DEFAULT_END,
    }));

const applyConfiguredDays = (days: StandardHoursDay[] | undefined): DayRow[] => {
    const byDay = new Map(
        (Array.isArray(days) ? days : [])
            .filter((entry) => Number.isInteger(entry?.day) && entry.day >= 0 && entry.day <= 6)
            .map((entry) => [
                entry.day,
                {
                    start: toDisplayTime(entry.start, DEFAULT_START),
                    end: toDisplayTime(entry.end, DEFAULT_END),
                },
            ]),
    );

    return DAY_LABELS.map((label, day) => {
        const configured = byDay.get(day);
        return {
            day,
            label,
            active: Boolean(configured),
            start: configured?.start ?? DEFAULT_START,
            end: configured?.end ?? DEFAULT_END,
        };
    });
};

function AdminStandardHours({ modalId, zIndex, userId, userName, onSaved }: AdminStandardHoursProps) {
    const { closeModal } = useAdminUI();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [timeZone, setTimeZone] = useState('Asia/Kolkata');
    const [days, setDays] = useState<DayRow[]>(buildDefaultDays);
    const [loadError, setLoadError] = useState('');

    const title = useMemo(() => {
        const label = (userName || '').trim();
        return label ? `Standard hours (${label})` : 'Standard hours';
    }, [userName]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setLoadError('');
            try {
                const response = await adminGetUserStandardHours(userId);
                if (cancelled) return;

                if (response?.statusCode && response.statusCode !== 200) {
                    setLoadError(apiErrorMessage(response, 'Standard hours could not be loaded.'));
                    return;
                }

                const payload = response?.data ?? {};
                const user = payload.user ?? {};
                const standardHours = payload.standardHours ?? user.standardHours ?? {};
                const nextZone = typeof payload.timeZone === 'string' && payload.timeZone
                    ? payload.timeZone
                    : (typeof user.timeZone === 'string' && user.timeZone ? user.timeZone : 'Asia/Kolkata');

                setTimeZone(nextZone);
                setEnabled(Boolean(standardHours?.enabled));
                setDays(applyConfiguredDays(standardHours?.days));
            } catch (error) {
                console.error('Failed to load standard hours', error);
                if (!cancelled) setLoadError('Standard hours could not be loaded.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const onClose = () => closeModal(modalId);

    const updateDay = (day: number, patch: Partial<DayRow>) => {
        setDays((current) => current.map((row) => (row.day === day ? { ...row, ...patch } : row)));
    };

    const validate = (): string | null => {
        if (!enabled) return null;
        if (!timeZone.trim()) return 'Select a time zone.';

        const activeDays = days.filter((row) => row.active);
        if (activeDays.length === 0) {
            return 'Select at least one working day, or turn standard hours off.';
        }

        for (const row of activeDays) {
            if (!row.start || !row.end) {
                return `Set start and end times for ${row.label}.`;
            }
            const startMinutes = toMinutes(row.start);
            const endMinutes = toMinutes(row.end);
            if (startMinutes === null || endMinutes === null) {
                return `Set valid start and end times for ${row.label}.`;
            }
            if (startMinutes >= endMinutes) {
                return `${row.label}: end time must be after start time.`;
            }
        }
        return null;
    };

    const onSave = async () => {
        if (loading || loadError || saving) return;

        const validationError = validate();
        if (validationError) {
            showError(validationError);
            return;
        }

        setSaving(true);
        try {
            const payload = enabled
                ? {
                    userId,
                    timeZone,
                    standardHours: {
                        enabled: true,
                        days: days
                            .filter((row) => row.active)
                            .map(({ day, start, end }) => ({
                                day,
                                start: formatTime24HrFrom12HrString(start),
                                end: formatTime24HrFrom12HrString(end),
                            })),
                    },
                }
                : {
                    userId,
                    standardHours: { enabled: false },
                };

            const response = await adminSaveUserStandardHours(payload);
            if (response?.statusCode === 200) {
                showSuccess('Standard hours saved successfully');
                onSaved?.();
                onClose();
                return;
            }
            showError(apiErrorMessage(response, 'Failed to save standard hours'));
        } catch (error) {
            console.error('Failed to save standard hours', error);
            showError('Failed to save standard hours');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            isOpen
            onClose={onClose}
            zIndex={zIndex}
            closeOnBackdrop
            closeOnEsc
            draggable
            showBackdrop
            dragHandleSelector=".drag-handle"
            width="min(100vw, 640px)"
            maxWidth="95vw"
        >
            <div className="admin-standard-hours-modal" id={modalId}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header drag-handle">
                            <button type="button" className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
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
                            <h5 className="modal-title modal-title-center" title={title}>{title}</h5>
                            <button
                                type="button"
                                className="btn-close hover-link btn icon-hover-effect"
                                onClick={onClose}
                                aria-label="Close"
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

                        <div className="modal-body admin-standard-hours-modal__body">
                            {loading ? (
                                <p className="admin-standard-hours-modal__status">Loading standard hours…</p>
                            ) : loadError ? (
                                <p className="admin-standard-hours-modal__status">{loadError}</p>
                            ) : (
                                <>
                                    <p className="admin-standard-hours-modal__hint">
                                        Emails outside these hours appear in Out of Hours Emails for this user.
                                    </p>

                                    <div className="admin-standard-hours-modal__toggle-row">
                                        <span className="fs-12-commom">Enable standard hours</span>
                                        <div className="switch-toggale d-flex align-items-center justify-content-center">
                                            <input
                                                type="checkbox"
                                                id="standardHoursEnabled"
                                                checked={enabled}
                                                onChange={(event) => setEnabled(event.target.checked)}
                                            />
                                            <label htmlFor="standardHoursEnabled">Toggle</label>
                                        </div>
                                    </div>

                                    <div className={`form-group form-row ${enabled ? '' : 'admin-standard-hours-modal__disabled'}`}>
                                        <label className="control-label" htmlFor="standardHoursTimeZone">
                                            Time zone
                                        </label>
                                        <div className="input-control">
                                            <Select2Wrapper
                                                value={timeZone}
                                                onChange={(value) => {
                                                    if (value) setTimeZone(value);
                                                }}
                                                options={TIMEZONE_OPTIONS}
                                                placeholder="Select time zone"
                                                isMulti={false}
                                                isDisabled={!enabled}
                                            />
                                        </div>
                                    </div>

                                    <div className={`admin-standard-hours-modal__days ${enabled ? '' : 'admin-standard-hours-modal__disabled'}`}>
                                        <div className="admin-standard-hours-modal__days-head">
                                            <span>Working days</span>
                                            <span>Hours</span>
                                        </div>
                                        {days.map((row) => (
                                            <div key={row.day} className="admin-standard-hours-modal__day-row">
                                                <label className="admin-standard-hours-modal__day-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.active}
                                                        disabled={!enabled}
                                                        onChange={(event) => updateDay(row.day, { active: event.target.checked })}
                                                    />
                                                    <span>{row.label}</span>
                                                </label>
                                                <div className={`admin-standard-hours-modal__times ${!row.active ? 'admin-standard-hours-modal__times--inactive' : ''}`}>
                                                    <div className="input-icon-add position-relative admin-standard-hours-modal__time-field">
                                                        <CustomTimeSelector
                                                            value={row.start}
                                                            onChange={(value) => updateDay(row.day, { start: value })}
                                                            options={TIME_OPTIONS_15}
                                                            placeholder="Select time"
                                                        />
                                                        <img src={timeIcon} alt="" className="input-icon-1" />
                                                    </div>
                                                    <span className="admin-standard-hours-modal__times-sep">–</span>
                                                    <div className="input-icon-add position-relative admin-standard-hours-modal__time-field">
                                                        <CustomTimeSelector
                                                            value={row.end}
                                                            onChange={(value) => updateDay(row.day, { end: value })}
                                                            options={TIME_OPTIONS_15}
                                                            minSequence={
                                                                TIME_OPTIONS_15.indexOf(row.start) >= 0
                                                                    ? TIME_OPTIONS_15.indexOf(row.start) + 1
                                                                    : undefined
                                                            }
                                                            placeholder="Select time"
                                                        />
                                                        <img src={timeIcon} alt="" className="input-icon-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer admin-standard-hours-modal__footer">
                            <button type="button" className="btn-new mb-0" onClick={onClose} disabled={saving}>
                                Cancel
                            </button>
                            <SubmitButton
                                className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                                onClick={onSave}
                                loading={saving}
                            >
                                Save
                            </SubmitButton>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default AdminStandardHours;
