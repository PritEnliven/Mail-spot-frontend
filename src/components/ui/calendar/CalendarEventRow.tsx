import calendarIcon from "@images/calendar-icon.svg";
import type { CalendarEvent } from "@models/CalendarModels";
import { formatDate, TimeFormat } from "@utils/dateUtil";

interface CalendarEventRowProps {
    data: CalendarEvent;
}
const CalendarEventRow = ({ data }: CalendarEventRowProps) => {
    const event = data.events[0];

    const startTimeText = formatDate(event.startDate, TimeFormat.CALENDAR_SEARCH);

    const startDayText = formatDate(event.endDate, TimeFormat.DDMMYYYY);


    return (
        <li>
            <div className="dropdown-item icon">
                <div>
                    <img src={calendarIcon} alt="" className="top-search-calendar-img input-icon-1" />
                    <div className="subject-search">
                        <div className="subject">{event.title}</div>
                        <div className="right-attachment-time">
                            <div className="time date">{startTimeText}</div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between subject-search">
                        <div className="to-email p-0 le-2">hiren.c@mail.enlivendc.com</div>
                        <div className="right-attachment-time">
                            <div className="time">{startDayText}</div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default CalendarEventRow;