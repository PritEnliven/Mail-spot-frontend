import CalendarAllEventList from '@components/ui/calendar/CalendarAllEventList'
import { useCalendar, type CalendarView } from '@context/CalendarContext'
import { useMailData } from '@context/MailDataContext'
import { useMailUI } from '@context/MailUIContext'
import type { DatesSetArg } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet'
import { getEventById } from '@services/calendar/calendarService'
import { focusDate, focusEvent, normalizeEventForModal } from '@utils/calendarUtil'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createMainCalendarConfig, createSidebarCalendarConfig } from '../../config/fullCalendar.config'


function CalendarPage() {
    const cssLoaded = usePageStylesheet([pageStyles.calendarCss, pageStyles.responsiveCss]);

    const { setBoxName } = useMailData()
    const {
        mainCalendarRef,
        sidebarCalendarRef,
        setCalendarTitle,
        calendarTitle,
        setCalendarView,
        getAllEventList,
        registerResetLastClickedDate,
        isCalendarAllSearchActive,
        setSelectedEvent,
        isSidebarCalendarOpen,
    } = useCalendar()
    const { openModal } = useMailUI()
    const titleRef = useRef<HTMLDivElement | null>(null);
    const popoverObserverRef = useRef<MutationObserver | null>(null)
    const lastClickedDateRef = useRef<string | null>(null)
    const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
    const [isCalendarReady, setIsCalendarReady] = useState(false)

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

        if (registerResetLastClickedDate) {
            registerResetLastClickedDate(() => {
                lastClickedDateRef.current = null
            })
        }
    }, [setBoxName, registerResetLastClickedDate])

    useEffect(() => {
        if (!cssLoaded || !isCalendarReady) return
        if (!mainCalendarRef.current) return

        setupMorePopoverObserver()

        const setupSidebarClickHandler = () => {
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

            return () => {
                sidebarCalendarEl.removeEventListener('click', handleClick);
            };
        };

        const timeoutId = setTimeout(setupSidebarClickHandler, 100);

        return () => {
            popoverObserverRef.current?.disconnect()
            popoverObserverRef.current = null
            clearTimeout(timeoutId)
        }
    }, [cssLoaded, isCalendarReady, mainCalendarRef, sidebarCalendarRef, setCalendarView])

    useEffect(() => {
        if (!cssLoaded || !isCalendarAllSearchActive) return
        setIsCalendarReady(true)
    }, [cssLoaded, isCalendarAllSearchActive])

    useEffect(() => {
        if (!cssLoaded || isCalendarReady) return
        const timeoutId = window.setTimeout(() => setIsCalendarReady(true), 1500)
        return () => window.clearTimeout(timeoutId)
    }, [cssLoaded, isCalendarReady])

    useEffect(() => {
        if (!isCalendarReady) return
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
    }, [sidebarCalendarRef, isCalendarReady])

    const handleSidebarPrev = () => {
        sidebarCalendarRef.current?.getApi().prev()
    }

    const handleSidebarNext = () => {
        sidebarCalendarRef.current?.getApi().next()
    }

    const handleDatesSet = useCallback((info: DatesSetArg) => {
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

        if (titleRef.current) {
            titleRef.current.textContent = title
        }
        setCalendarTitle(title)
        setCalendarView(info.view.type as CalendarView)

        const start = info.view.activeStart?.toISOString() || ''
        const end = info.view.activeEnd?.toISOString() || ''
        setCurrentDateRange({ start, end })
        getAllEventList(info.view.calendar)
        setIsCalendarReady(true)
    }, [getAllEventList, setCalendarTitle, setCalendarView])

    const handleSidebarDatesSet = useCallback((info: DatesSetArg) => {
        if (titleRef.current) {
            titleRef.current.textContent = info.view.title
        }
    }, [])

    const handleSelect = useCallback(() => {
        mainCalendarRef.current?.getApi().unselect()
    }, [mainCalendarRef])

    const handleEventClick = useCallback(async (info: any) => {
        focusEvent(info)
        const response = await getEventById(info.event.id)
        if (response.statusCode === 200) {
            response.data.event.id = info.event.id;
            const event = normalizeEventForModal(response.data.event)
            event.selectedEventDate = info.event.start;
            setSelectedEvent(event);
            openModal('eventInfo', { event })
        }
    }, [openModal, setSelectedEvent])

    const handleDateClick = useCallback((info: any) => {
        focusDate(info)
        openModal('calendarEvent', info)
    }, [openModal])

    const mainCalendarConfig = useMemo(() => createMainCalendarConfig({
        onDatesSet: handleDatesSet,
        onSelect: handleSelect,
        onEventClick: handleEventClick,
        onDateClick: handleDateClick,
    }), [handleDatesSet, handleSelect, handleEventClick, handleDateClick])

    const sidebarCalendarConfig = useMemo(
        () => createSidebarCalendarConfig(handleSidebarDatesSet),
        [handleSidebarDatesSet]
    )

    const showLoader = !cssLoaded || !isCalendarReady

    return (
        <div className="calendar-body-box d-flex position-relative" style={{ minHeight: 'calc(100vh - 54px)', width: '100%' }}>
            {showLoader && (
                <div
                    className="calendar-loading-overlay"
                    aria-label="Loading calendar"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        zIndex: 5,
                    }}
                >
                    <div
                        className="calendar-loading-spinner"
                        style={{
                            width: 40,
                            height: 40,
                            border: '3px solid #e0e0e0',
                            borderTop: '3px solid #0097ef',
                            borderRadius: '50%',
                            animation: 'spin 0.75s linear infinite',
                        }}
                    />
                </div>
            )}

            {cssLoaded && (
                <div className={`calendar-ready-wrap ${isCalendarReady ? 'is-visible' : ''}`}>
                    <div className={`left-side-calendar-box ${isSidebarCalendarOpen ? '' : 'd-none'}`}>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div id="sidebar-title" ref={titleRef}>
                                {calendarTitle}
                            </div>
                            {/* <div id="sidebar-nav" className="d-flex align-items-center">
                                <button
                                    className="fc-icon-chevron-left-left-box btn-new"
                                    onClick={handleSidebarPrev}
                                />
                                <button
                                    className="fc-icon-chevron-right-left-box btn-new"
                                    onClick={handleSidebarNext}
                                />
                            </div> */}
                        </div>

                        <div className="sidebar" id="sidebar-calendar">
                            <FullCalendar ref={sidebarCalendarRef} {...sidebarCalendarConfig} />
                        </div>
                    </div>

                    <div className="right-side-calendar-box" id="calendar">
                        {isCalendarAllSearchActive ?
                            <CalendarAllEventList startDate={currentDateRange.start} endDate={currentDateRange.end} />
                            : <FullCalendar
                                ref={mainCalendarRef}
                                {...mainCalendarConfig}
                            />}
                    </div>
                </div>
            )}
        </div>
    )
}

export default CalendarPage
