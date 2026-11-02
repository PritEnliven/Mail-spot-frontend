import Select2Wrapper, { type SingleOption } from '@components/ui/form/Select2Wrapper';
import CustomTimeSelector from '@components/ui/Modals/CalendarEventModal/TimerList';
import timeIcon from '@images/time-icon-16.svg';
import { generateTimeOptions } from '@utils/calendarUtil';
import { formatTime12HrFrom24HrString, formatTime24HrFrom12HrString } from '@utils/dateUtil';
import type { StandardHoursConfig, StandardHoursDay } from '@services/adminService/adminService';

export interface StandardHoursDayRow {
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
export const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

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

export const buildDefaultStandardHoursDays = (): StandardHoursDayRow[] =>
    DAY_LABELS.map((label, day) => ({
        day,
        label,
        active: day >= 1 && day <= 5,
        start: DEFAULT_START,
        end: DEFAULT_END,
    }));

export const applyConfiguredStandardHoursDays = (
    days: StandardHoursDay[] | undefined,
): StandardHoursDayRow[] => {
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

export const validateStandardHours = (
    enabled: boolean,
    timeZone: string,
    days: StandardHoursDayRow[],
): string | null => {
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

export const buildStandardHoursPayload = (
    enabled: boolean,
    days: StandardHoursDayRow[],
): StandardHoursConfig => {
    if (!enabled) return { enabled: false };
    return {
        enabled: true,
        days: days
            .filter((row) => row.active)
            .map(({ day, start, end }) => ({
                day,
                start: formatTime24HrFrom12HrString(start),
                end: formatTime24HrFrom12HrString(end),
            })),
    };
};

interface UserStandardHoursFieldsProps {
    enabled: boolean;
    timeZone: string;
    days: StandardHoursDayRow[];
    onEnabledChange: (enabled: boolean) => void;
    onTimeZoneChange: (timeZone: string) => void;
    onDayChange: (day: number, patch: Partial<StandardHoursDayRow>) => void;
}

const UserStandardHoursFields = ({
    enabled,
    timeZone,
    days,
    onEnabledChange,
    onTimeZoneChange,
    onDayChange,
}: UserStandardHoursFieldsProps) => (
    <div className="admin-user-hours">
        <h6 className="admin-setting-section-title">Standard hours</h6>
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
                    onChange={(event) => onEnabledChange(event.target.checked)}
                />
                <label htmlFor="standardHoursEnabled">Toggle</label>
            </div>
        </div>
        {enabled && (
            <>
                <div className="form-group form-row">
                    <label className="control-label" htmlFor="standardHoursTimeZone">
                        Time zone
                    </label>
                    <div className="input-control">
                        <Select2Wrapper
                            value={timeZone}
                            onChange={(value) => {
                                if (value) onTimeZoneChange(value);
                            }}
                            options={TIMEZONE_OPTIONS}
                            placeholder="Select time zone"
                            isMulti={false}
                        />
                    </div>
                </div>
                <div className="admin-standard-hours-modal__days">
                    <div className="admin-standard-hours-modal__days-head">
                        <span>Working days</span>
                        <span>Hours</span>
                    </div>
                    {days.map((row) => (
                        <div key={row.day} className="admin-standard-hours-modal__day-row">
                            <div className="admin-standard-hours-modal__day-check">
                                <div className="mail-received-check-btn">
                                    <div className="blue checkbox-custom table-check">
                                        <input
                                            type="checkbox"
                                            id={`userStandardHoursDay-${row.day}`}
                                            className="list-child"
                                            checked={row.active}
                                            onChange={(event) => onDayChange(row.day, { active: event.target.checked })}
                                        />
                                        <label
                                            htmlFor={`userStandardHoursDay-${row.day}`}
                                            className="label-text"
                                        />
                                    </div>
                                </div>
                                <label
                                    htmlFor={`userStandardHoursDay-${row.day}`}
                                    className="admin-standard-hours-modal__day-label"
                                >
                                    {row.label}
                                </label>
                            </div>
                            <div className={`admin-standard-hours-modal__times ${!row.active ? 'admin-standard-hours-modal__times--inactive' : ''}`}>
                                <div className='form-group mb-0'>
                                    <div className="input-icon-add position-relative admin-standard-hours-modal__time-field">
                                        <CustomTimeSelector
                                            value={row.start}
                                            onChange={(value) => onDayChange(row.day, { start: value })}
                                            options={TIME_OPTIONS_15}
                                            placeholder="Select time"
                                        />
                                        <img src={timeIcon} alt="" className="input-icon-1" />
                                    </div>
                                </div>
                                <span className="admin-standard-hours-modal__times-sep">–</span>
                                <div className='form-group mb-0'>
                                    <div className="input-icon-add position-relative admin-standard-hours-modal__time-field">
                                        <CustomTimeSelector
                                            value={row.end}
                                            onChange={(value) => onDayChange(row.day, { end: value })}
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
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
);

export default UserStandardHoursFields;
