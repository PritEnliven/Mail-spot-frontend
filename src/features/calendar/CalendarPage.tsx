import CalendarAllEventList from '@components/ui/calendar/CalendarAllEventList'
import { useCalendar, type CalendarView } from '@context/CalendarContext'
import { useMailData } from '@context/MailDataContext'
import { useMailUI } from '@context/MailUIContext'
import type { DatesSetArg } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet'
import { getEventById } from '@services/calendar/calendarService'
import { focusDate, focusEvent, normalizeEventForModal } from '@utils/calendarUtil'
import { useEffect, useRef, useState } from 'react'
import { createMainCalendarConfig, createSidebarCalendarConfig } from '../../config/fullCalendar.config'


function CalendarPage() {
    usePageStylesheet([pageStyles.calendarCss, pageStyles.responsiveCss]);

    const { setBoxName } = useMailData()
    const { mainCalendarRef, sidebarCalendarRef, setCalendarTitle, setCalendarView, getAllEventList, registerResetLastClickedDate, isCalendarAllSearchActive } = useCalendar()
    const { openModal } = useMailUI()
    const { setSelectedEvent, isSidebarCalendarOpen } = useCalendar();
    const titleRef = useRef<HTMLDivElement | null>(null);
    const popoverObserverRef = useRef<MutationObserver | null>(null)
    const lastClickedDateRef = useRef<string | null>(null)
    const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

    const setupMorePopoverObserver = () => {
        if (popoverObserverRef.current) return;

        popoverObserverRef.current = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && (node as HTMLElement).classList.contains('fc-more-popover')) {
                        const popover = node as HTMLElement;

                        popover.style.visibility = 'hidden';

                        requestAnimationFrame(() => {
                            const popRect = popover.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            const viewportWidth = window.innerWidth;

                            let currentTop = window.scrollY + popRect.top;
                            let currentLeft = window.scrollX + popRect.left;

                            let newTop = currentTop;
                            let newLeft = currentLeft;

                            if (popRect.bottom > viewportHeight) {
                                newTop -= (popRect.bottom - viewportHeight + 10);
                            }

                            if (popRect.right > viewportWidth) {
                                newLeft -= (popRect.right - viewportWidth + 10);
                            }

                            if (newLeft < 0) newLeft = 10;

                            popover.style.position = 'fixed';
                            popover.style.top = `${newTop - window.scrollY}px`;
                            popover.style.left = `${newLeft - window.scrollX}px`;
                            popover.style.visibility = 'visible';
                        });
                    }
                }
            }
        });

        popoverObserverRef.current.observe(document.body, {
            childList: true,
            subtree: true,
        });
    };

    useEffect(() => {
        setBoxName('calendar')

        // Register the reset function for the context
        if (registerResetLastClickedDate) {
            registerResetLastClickedDate(() => {
                lastClickedDateRef.current = null
            })
        }
    }, [setBoxName, registerResetLastClickedDate])

    useEffect(() => {
        if (!mainCalendarRef.current) return

        setupMorePopoverObserver()

        // Setup sidebar calendar click handler
        const setupSidebarClickHandler = () => {
            // Use querySelector to find the sidebar calendar element
            const sidebarCalendarEl = document.querySelector('#sidebar-calendar .fc-daygrid')
            if (!sidebarCalendarEl) return

            const handleClick = function (ev: Event) {
                let target = ev.target as HTMLElement;
                while (target && !target.classList.contains('fc-daygrid-day')) {
                    target = target.parentElement as HTMLElement;
                }
                if (target) {
                    const dateStr = target.getAttribute('data-date');
                    if (dateStr && mainCalendarRef.current) {
                        const calendar = mainCalendarRef.current.getApi();

                        // If the same date was clicked twice
                        if (lastClickedDateRef.current === dateStr) {
                            calendar.changeView('timeGridDay', dateStr);
                            setCalendarView('timeGridDay');
                            const dayTopLink = target.querySelector('.fc-daygrid-day-top a');
                            if (dayTopLink) {
                                dayTopLink.classList.add('subcalendar-day-box');
                            }
                        } else {
                            document.querySelectorAll('.fc-daygrid-day').forEach(day => {
                                const dayTopLink = day.querySelector('.fc-daygrid-day-top a');
                                if (dayTopLink) {
                                    dayTopLink.classList.remove('subcalendar-day-box');
                                }
                            });

                            // Add highlight to clicked date
                            const dayTopLink = target.querySelector('.fc-daygrid-day-top a');
                            if (dayTopLink) {
                                dayTopLink.classList.add('subcalendar-day-box');
                            }

                            lastClickedDateRef.current = dateStr;
                            calendar.gotoDate(dateStr);
                        }
                    }
                }
            };

            sidebarCalendarEl.addEventListener('click', handleClick);

            // Cleanup function
            return () => {
                sidebarCalendarEl.removeEventListener('click', handleClick);
            };
        };

        // Wait for sidebar calendar to be rendered
        const timeoutId = setTimeout(setupSidebarClickHandler, 100);

        return () => {
            popoverObserverRef.current?.disconnect()
            popoverObserverRef.current = null
            clearTimeout(timeoutId)
        }
    }, [mainCalendarRef, sidebarCalendarRef])

    useEffect(() => {
        getAllEventList()
    }, [getAllEventList])

    // Setup Today button functionality
    useEffect(() => {
        const todayBtn = document.getElementById('btnToday')
        if (todayBtn && sidebarCalendarRef.current) {
            const handleTodayClick = () => {
                sidebarCalendarRef.current?.getApi().today()
            }

            todayBtn.addEventListener('click', handleTodayClick)

            return () => {
                todayBtn.removeEventListener('click', handleTodayClick)
            }
        }
    }, [sidebarCalendarRef])

    const handleSidebarPrev = () => {
        sidebarCalendarRef.current?.getApi().prev()
    }

    const handleSidebarNext = () => {
        sidebarCalendarRef.current?.getApi().next()
    }

    /* ===========================
       CALENDAR CALLBACKS
    =========================== */
    const handleDatesSet = (info: DatesSetArg) => {
        let title = info.view.title

        if (title.includes('–')) {
            const [first, second] = title.split(' – ')
            const [firstMonth] = first.split(' ')
            const [secondMonth, year] = second.split(' ')

            if (year && firstMonth !== secondMonth) {
                title = `${firstMonth.slice(0, 3)} – ${secondMonth.slice(
                    0,
                    3
                )} ${year}`
            }
        }

        // Update both the local title ref and the context title
        if (titleRef.current) {
            titleRef.current.textContent = title
        }
        setCalendarTitle(title)

        // Update the calendar view state when view changes
        setCalendarView(info.view.type as CalendarView)

        // Update current date range for CalendarAllEventList
        const start = info.view.activeStart?.toISOString() || ''
        const end = info.view.activeEnd?.toISOString() || ''
        setCurrentDateRange({ start, end })

        // Fetch events for the new date range
        getAllEventList()
    }

    const handleSelect = () => {
        mainCalendarRef.current?.getApi().unselect()
    }

    const handleEventClick = async (info: any) => {
        focusEvent(info)
        const response = await getEventById(info.event.id)
        if (response.statusCode === 200) {
            response.data.event.id = info.event.id;
            const event = normalizeEventForModal(response.data.event)
            event.selectedEventDate = info.event.start;
            setSelectedEvent(event);
            openModal('eventInfo', { event })
        }
    }

    const handleDateClick = (info: any) => {
        focusDate(info)
        openModal('calendarEvent', info)
    }

    const mainCalendarConfig = createMainCalendarConfig({
        onDatesSet: handleDatesSet,
        onSelect: handleSelect,
        onEventClick: handleEventClick,
        onDateClick: handleDateClick,
    })

    const sidebarCalendarConfig = createSidebarCalendarConfig(handleDatesSet)

    return (
        <div className="calendar-body-box d-flex">
            {/* LEFT SIDEBAR */}
            <div className={`left-side-calendar-box ${isSidebarCalendarOpen ? '' : 'd-none'}`}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div id="sidebar-title" ref={titleRef}>
                        Month Year
                    </div>
                    <div id="sidebar-nav" className="d-flex align-items-center">
                        <button
                            className="fc-icon-chevron-left-left-box btn-new"
                            onClick={handleSidebarPrev}
                        />
                        <button
                            className="fc-icon-chevron-right-left-box btn-new"
                            onClick={handleSidebarNext}
                        />
                    </div>
                </div>

                <div className="sidebar" id="sidebar-calendar">
                    <FullCalendar ref={sidebarCalendarRef} {...sidebarCalendarConfig} />
                </div>
            </div>

            {/* MAIN CALENDAR */}
            <div className="right-side-calendar-box" id="calendar">
                {isCalendarAllSearchActive ?
                    <CalendarAllEventList startDate={currentDateRange.start} endDate={currentDateRange.end} />
                    : <FullCalendar
                        ref={mainCalendarRef}
                        {...mainCalendarConfig}
                    />}
            </div>
        </div>
    )
}

export default CalendarPage
