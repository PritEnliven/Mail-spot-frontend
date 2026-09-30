import InteractiveIcon from '@components/ui/InteractiveIcon';
import FolderActionsDropdown from '@components/ui/sidebar/FolderActionsDropdown';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useCalendar } from '@context/CalendarContext';
import { useMailUI } from '@context/MailUIContext';
import { useScreen } from '@context/ScreenContext';
import type { UserCalendar } from '@models/CalendarModels';
import { deleteCalendar } from '@services/calendar/calendarsService';
import chevronDownIcon from '@images/chevron-down-icon.svg';
import chevronDownIconHover from '@images/chevron-down-icon-hover.svg';
import chevronRightIcon from '@images/chevron-right-icon.svg';
import chevronRightIconHover from '@images/chevron-right-icon-hover.svg';
import plusIconWhite from '@images/plus-icon-white.svg';
import { useState } from 'react';

function CalendarList() {
    const {
        calendars,
        selectedCalendarIds,
        toggleCalendarVisibility,
        fetchCalendars,
        getAllEventList,
    } = useCalendar();
    const { openModal } = useMailUI();
    const { isMobilebig } = useScreen();
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(isMobilebig);

    const openCreateModal = () => {
        setOpenDropdownId(null);
        openModal('calendarForm');
    };

    const openEditModal = (calendar: UserCalendar) => {
        setOpenDropdownId(null);
        openModal('calendarForm', {
            isEdit: true,
            calendarId: calendar._id,
            name: calendar.name,
            color: calendar.color,
            isDefault: calendar.isDefault,
        });
    };

    const handleDelete = async (calendar: UserCalendar) => {
        const response = await deleteCalendar({ calendarId: calendar._id });
        if (response.statusCode === 200) {
            showSuccess(response.data?.message || 'Calendar deleted successfully');
            await fetchCalendars();
            await getAllEventList();
        } else {
            showError(response.message || 'Failed to delete calendar');
        }
    };

    const confirmDelete = (calendar: UserCalendar) => {
        setOpenDropdownId(null);
        openModal('confirmDelete', {
            title: 'Delete calendar',
            message: 'Events on this calendar will be moved to My Calendar. This cannot be undone.',
            onConfirm: () => handleDelete(calendar),
        });
    };

    return (
        <div className="calendar-list-section">
            <div className="calendar-list-heading-main">
                <button
                    type="button"
                    className="calendar-list-heading"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    aria-expanded={!isCollapsed}
                >
                    <span className={`calendar-list-arrow ${isCollapsed ? 'collapsed' : ''}`}>
                        {isCollapsed ? (
                            <InteractiveIcon
                                defaultIcon={chevronRightIcon}
                                hoverIcon={chevronRightIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip=""
                            />
                        ) : (
                            <InteractiveIcon
                                defaultIcon={chevronDownIcon}
                                hoverIcon={chevronDownIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip=""
                            />
                        )}
                    </span>
                    <span className="calendar-list-heading-text">My calendars</span>
                </button>
                <span
                    className="calendar-list-add-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCreateModal();
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Create new calendar"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            openCreateModal();
                        }
                    }}
                >
                    <InteractiveIcon
                        defaultIcon={plusIconWhite}
                        hoverIcon={plusIconWhite}
                        activeIcon=""
                        isActive={false}
                        alt=""
                        className="interactive-icon hover-image"
                        renderAs="img"
                        tooltip="Create new calendar"
                    />
                </span>
            </div>

            <div className={`calendar-list-body collapse ${!isCollapsed ? 'show' : ''}`}>
                <ul className="calendar-list">
                    {calendars.map((calendar) => {
                        const checkboxId = `calendar-visible-${calendar._id}`;
                        const isChecked = selectedCalendarIds.includes(calendar._id);

                        return (
                            <li key={calendar._id} className="calendar-list-row">
                                <span
                                    className="indicator-bage"
                                    style={{ backgroundColor: calendar.color }}
                                />
                                <div className="mail-received-check-btn">
                                    <div className="checkbox-custom table-check">
                                        <input
                                            className="list-child"
                                            type="checkbox"
                                            id={checkboxId}
                                            checked={isChecked}
                                            onChange={() => toggleCalendarVisibility(calendar._id)}
                                        />
                                        <label htmlFor={checkboxId} className="label-text" />
                                    </div>
                                </div>
                                <label htmlFor={checkboxId} className="calendar-list-name">
                                    {calendar.name}
                                </label>
                                <div className="calendar-list-actions">
                                    <FolderActionsDropdown
                                        isOpen={openDropdownId === calendar._id}
                                        onToggle={(nextOpen) => setOpenDropdownId(nextOpen ? calendar._id : null)}
                                        onEdit={() => openEditModal(calendar)}
                                        onDelete={() => confirmDelete(calendar)}
                                        showDelete={!calendar.isDefault}
                                        drop="down"
                                        align="end"
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default CalendarList;
