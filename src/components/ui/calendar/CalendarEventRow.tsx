import calendarIcon from "@images/calendar-icon.svg";
import { useCalendar } from "@context/CalendarContext";
import { useMailUI } from "@context/MailUIContext";
import type { CalendarEvent } from "@models/CalendarModels";
import { getEventById } from "@services/calendar/calendarService";
import { formatSearchEventDateTime, normalizeEventForModal } from "@utils/calendarUtil";

interface CalendarEventRowProps {
    data: CalendarEvent;
}

const CalendarEventRow = ({ data }: CalendarEventRowProps) => {
    const { openModal } = useMailUI();
    const { setSelectedEvent, setIsSearchResultDropdownOpen } = useCalendar();

    // Support both flat events and `{ date, events[] }` API groups
    const event = (data as any).events?.[0] ?? data;
    const eventDate = (data as any).date || event.date;
    const eventId = event._id || event.id;
    const startTimeText = formatSearchEventDateTime({
        ...event,
        date: eventDate,
    });

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!eventId) return;

        setIsSearchResultDropdownOpen(false);

        const response = await getEventById(eventId);
        if (response.statusCode === 200 && response.data?.event) {
            response.data.event.id = eventId;
            const normalized = normalizeEventForModal(response.data.event);
            normalized.selectedEventDate = eventDate || normalized.startDate;
            setSelectedEvent(normalized);
            openModal('eventInfo', { event: normalized });
        }
    };

    return (
        <li>
            <div
                className="dropdown-item icon"
                role="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        void handleClick(e as unknown as React.MouseEvent);
                    }
                }}
                style={{ cursor: 'pointer' }}
            >
                <div>
                    <img src={calendarIcon} alt="" className="top-search-calendar-img input-icon-1" />
                    <div className="subject-search">
                        <div className="subject">{event.title}</div>
                        <div className="right-attachment-time">
                            <div className="time date">{startTimeText}</div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default CalendarEventRow;
