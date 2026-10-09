import InteractiveIcon from '@components/ui/InteractiveIcon';
import FolderActionsDropdown from '@components/ui/sidebar/FolderActionsDropdown';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useCalendar } from '@context/CalendarContext';
import { useMailUI } from '@context/MailUIContext';
import { useScreen } from '@context/ScreenContext';
import type { UserCalendar } from '@models/CalendarModels';
import { deleteCalendar, revokeCalendarShare } from '@services/calendar/calendarsService';
import {
    canLeaveShare,
    canManageShares,
    isOwnedCalendar,
    permissionLabel,
} from '@utils/calendarPermissionUtil';
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

    const openShareModal = (calendar: UserCalendar) => {
        setOpenDropdownId(null);
        openModal('shareCalendar', {
            calendarId: calendar._id,
            name: calendar.name,
            color: calendar.color,
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
            message: 'Events on this calendar will be moved to My Calendar. .',
            onConfirm: () => handleDelete(calendar),
        });
    };

    const handleLeave = async (calendar: UserCalendar) => {
        if (!calendar.shareId) return;
        const response = await revokeCalendarShare({ shareId: calendar.shareId });
        if (response.statusCode === 200) {
            showSuccess(response.data?.message || 'Left shared calendar');
            await fetchCalendars();
            await getAllEventList();
            return;
        }
        showError(response.message || 'Failed to leave shared calendar');
    };

    const confirmLeave = (calendar: UserCalendar) => {
        setOpenDropdownId(null);
        openModal('confirmDelete', {
            title: 'Leave shared calendar',
            message: `Leave “${calendar.name}”? You will no longer see its events.`,
            onConfirm: () => handleLeave(calendar),
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
                        const owned = isOwnedCalendar(calendar);
                        const showShare = canManageShares(calendar);
                        const showLeave = canLeaveShare(calendar);

                        return (
                            <li key={calendar._id} className="calendar-list-row">
                                <span
                                    className="indicator-bage"
                                    style={{ backgroundColor: calendar.color, outline: "2px solid white" }}
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
                                <div className="calendar-list-name-wrap">
                                    <label htmlFor={checkboxId} className="calendar-list-name">
                                        {calendar.name}
                                    </label>
                                    {calendar.isShared && (
                                        <div className="calendar-list-shared-meta">
                                            <span className="calendar-list-shared-badge">Shared</span>
                                            {calendar.ownerEmail && (
                                                <span className="calendar-list-shared-owner" title={calendar.ownerEmail}>
                                                    {calendar.ownerEmail}
                                                </span>
                                            )}
                                            {calendar.permission && (
                                                <span>{permissionLabel(calendar.permission)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="calendar-list-actions">
                                    <FolderActionsDropdown
                                        isOpen={openDropdownId === calendar._id}
                                        onToggle={(nextOpen) => setOpenDropdownId(nextOpen ? calendar._id : null)}
                                        showEdit={owned}
                                        onEdit={() => openEditModal(calendar)}
                                        showDelete={owned && !calendar.isDefault}
                                        onDelete={() => confirmDelete(calendar)}
                                        showShare={showShare}
                                        onShare={() => openShareModal(calendar)}
                                        showLeave={showLeave}
                                        onLeave={() => confirmLeave(calendar)}
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
