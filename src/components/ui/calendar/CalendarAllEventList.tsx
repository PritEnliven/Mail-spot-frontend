import { useCalendar } from "@context/CalendarContext";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import backBtnIcon from "@images/back-btn-icon.svg";
import backBtnIconHover from "@images/back-btn-icon-hover.svg";
import { useMailUI } from "@context/MailUIContext";
import { getEventById } from "@services/calendar/calendarService";
import { normalizeEventForModal } from "@utils/calendarUtil";
import { formatDate, TimeFormat, formatTime12HrFrom24HrString } from "@utils/dateUtil";

interface CalendarEvent {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    fullDay: boolean;
    eventColor: string;
    location?: string | null;
    description?: string | null;
}

interface GroupedEvents {
    [date: string]: CalendarEvent[];
}

interface CalendarAllEventListProps {
    startDate?: string;
    endDate?: string;
}

const CalendarAllEventList = ({ startDate, endDate }: CalendarAllEventListProps) => {

    // TODO: Use startDate and endDate for filtering or displaying date range information
    console.log('CalendarAllEventList date range:', { startDate, endDate });

    const { calendarAllSearchedEvents, setIsCalendarAllSearchActive, setCalendarAllSearchedEvents, setSelectedEvent, getAllEventList, resetSearchState } = useCalendar();
    const { openModal } = useMailUI();

    const formatDateInfo = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekday = weekdays[date.getDay()];
        return { day, weekday };
    };

    const formatTime = (event: CalendarEvent) => {
        if (event.fullDay) {
            return { timeText: 'All day', statusText: 'All day' };
        }
        if (event.startTime && event.endTime) {
            return { timeText: `${formatTime12HrFrom24HrString(event.startTime)} - ${formatTime12HrFrom24HrString(event.endTime)}`, statusText: 'Timed' };
        }
        return { timeText: 'All day', statusText: 'All day' };
    };

    const isToday = (dateStr: string) => {
        const today = new Date();
        const date = new Date(dateStr);
        return today.toDateString() === date.toDateString();
    };

    const groupedData: GroupedEvents = (calendarAllSearchedEvents as unknown as GroupedEvents) || {};
    const sortedDates = Object.keys(groupedData).sort();

    const openEventInfoModal = async (id: string) => {
        const response = await getEventById(id)
        if (response.statusCode === 200) {
            console.log(response);
            response.data.event.id = id;
            const event = normalizeEventForModal(response.data.event)
            event.selectedEventDate = event.startDate;
            setSelectedEvent(event);
            openModal('eventInfo', { event })
        }
    }

    const handleBack = async () => {
        setCalendarAllSearchedEvents([]);
        setIsCalendarAllSearchActive(false);
        resetSearchState();
        // Wait a tick for the calendar to render before calling getAllEventList
        setTimeout(async () => {
            await getAllEventList();
        }, 0);
    };

    return (
        <>
            <div className="calendar-search-results-toolbar d-flex align-items-center">
                <a href="javascript:;" className="icon-hover-effect hover-link calendar-back-btn me-2" onClick={handleBack}>
                    <InteractiveIcon
                        defaultIcon={backBtnIcon}
                        hoverIcon={backBtnIconHover}
                        activeIcon=""
                        isActive={false}
                        alt=""
                        className="interactive-icon hover-image"
                        renderAs="img"
                        tooltip="Back"
                    />
                </a>
                <h2 className="box-title m-0" id="calendar-all-events-title" >All Events</h2>
            </div>
            <div className="calendar-search-results-box">
                <div className="calendar-table">
                    <table className="table">
                        <tbody>
                            {sortedDates.map((dateKey) => {
                                const events = groupedData[dateKey];
                                const { day } = formatDateInfo(dateKey);
                                const formattedDate = formatDate(dateKey, TimeFormat.CALENDAR_EVENT_LISTDATE);
                                const todayClass = isToday(dateKey) ? 'today' : '';

                                return (
                                    <tr key={dateKey}>
                                        <td>
                                            <div className="search-results-event-box d-flex align-items-start w-100">
                                                <div className="search-results-event-date d-flex align-items-center">
                                                    <span className={`event-date ${todayClass}`}>{day}</span>
                                                    <span className="event-time d-block">{formattedDate}</span>
                                                </div>
                                                <div className="w-100">
                                                    {events.map((event) => {
                                                        const { timeText, statusText } = formatTime(event);
                                                        return (
                                                            <a
                                                                key={event._id}
                                                                href="javascript:;"
                                                                className="d-block w-100"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#eventInfoModal"
                                                                onClick={() => openEventInfoModal(event._id)}
                                                            >
                                                                <div className="search-results-event-active d-flex align-items-center w-100">
                                                                    <div className="event-status d-flex align-items-center">
                                                                        <span
                                                                            className="indicator-bage"
                                                                            style={{ backgroundColor: event.eventColor }}
                                                                        ></span>
                                                                        <span className="event-status-text">{timeText}</span>
                                                                    </div>
                                                                    <div className="event-details">{event.title}</div>
                                                                </div>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default CalendarAllEventList;