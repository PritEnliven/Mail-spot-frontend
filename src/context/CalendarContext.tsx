import type { Calendar } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react';
import type { CalendarEvent, EventDetail } from '@models/CalendarModels';
import type { ApiResponse } from '@models/Response';
import { useAccount } from '@context/AccountContext';
import { getActiveAccountId } from '@services/apiService';
import { getAllEvents } from '@services/calendar/calendarService';
import { clearFocusDate, formatCalendarEvents } from '@utils/calendarUtil';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

interface CalendarContextType {
    mainCalendarRef: React.RefObject<FullCalendar | null>
    sidebarCalendarRef: React.RefObject<FullCalendar | null>

    goPrev: () => void
    goNext: () => void
    goToday: () => void
    changeView: (view: CalendarView) => void
    resetLastClickedDate: () => void
    registerResetLastClickedDate: (fn: () => void) => void
    calendarTitle: string
    setCalendarTitle: (title: string) => void
    calendarView: CalendarView
    setCalendarView: (view: CalendarView) => void
    selectedEvent: EventDetail | null
    setSelectedEvent: (event: EventDetail | null) => void

    // Event management
    events: CalendarEvent[]
    setEvents: (events: CalendarEvent[]) => void
    getAllEventList: (calendarApi?: Calendar) => Promise<void>,
    clearCalendarData: () => void,
    calendarAllSearchedEvents: CalendarEvent[],
    setCalendarAllSearchedEvents: (events: CalendarEvent[]) => void,
    isCalendarAllSearchActive: boolean,
    setIsCalendarAllSearchActive: (active: boolean) => void,
    exitCalendarAllSearch: () => void,
    resetSearchState: () => void,

    // Search state
    searchText: string,
    setSearchText: (text: string) => void,
    searchResults: CalendarEvent[],
    setSearchResults: (results: CalendarEvent[]) => void,
    noResult: boolean,
    setNoResult: (noResult: boolean) => void,
    isSearchResultDropdownOpen: boolean,
    setIsSearchResultDropdownOpen: (open: boolean) => void,
    isSidebarCalendarOpen: boolean,
    setIsSidebarCalendarOpen: (open: boolean) => void
}

export const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export const useCalendar = () => {
    const ctx = useContext(CalendarContext)
    if (!ctx) {
        throw new Error('useCalendar must be used inside CalendarProvider')
    }
    return ctx
}

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const { activeAccountId } = useAccount()
    const mainCalendarRef = useRef<FullCalendar | null>(null)
    const sidebarCalendarRef = useRef<FullCalendar | null>(null)
    const requestIdRef = useRef(0)
    const [calendarTitle, setCalendarTitle] = useState(() =>
        new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    );
    const [calendarView, setCalendarView] = useState<CalendarView>('dayGridMonth');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
    const [calendarAllSearchedEvents, setCalendarAllSearchedEvents] = useState<CalendarEvent[]>([]);
    const [isCalendarAllSearchActive, setIsCalendarAllSearchActive] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [searchResults, setSearchResults] = useState<CalendarEvent[]>([])
    const [noResult, setNoResult] = useState(false)
    const [isSearchResultDropdownOpen, setIsSearchResultDropdownOpen] = useState(false)
    const [isSidebarCalendarOpen, setIsSidebarCalendarOpen] = useState(true)

    const resetSearchState = useCallback(() => {
        setSearchText('')
        setSearchResults([])
        setNoResult(false)
        setIsSearchResultDropdownOpen(false)
    }, [])

    const clearCalendarEventSources = useCallback(() => {
        const api = mainCalendarRef.current?.getApi()
        if (!api) return
        api.getEventSources().forEach((source) => source.remove())
    }, [])

    const clearCalendarData = useCallback(() => {
        requestIdRef.current += 1
        setEvents([])
        setSelectedEvent(null)
        setCalendarAllSearchedEvents([])
        setIsCalendarAllSearchActive(false)
        resetSearchState()
        clearCalendarEventSources()
    }, [resetSearchState, clearCalendarEventSources])

    const exitCalendarAllSearch = useCallback(() => {
        setIsCalendarAllSearchActive(false)
        setCalendarAllSearchedEvents([])
        resetSearchState()
        // Restore calendar layout after it becomes visible again
        requestAnimationFrame(() => {
            mainCalendarRef.current?.getApi()?.updateSize()
        })
    }, [resetSearchState])

    const getAllEventList = useCallback(async (calendarApi?: Calendar) => {
        const api = calendarApi ?? mainCalendarRef.current?.getApi()
        if (!api) return

        const start = api.view.activeStart?.toISOString()
        const end = api.view.activeEnd?.toISOString()

        if (!start || !end) return

        const requestId = ++requestIdRef.current
        const accountIdAtStart = getActiveAccountId()

        try {
            const response: ApiResponse<CalendarEvent[]> = await getAllEvents({ start, end })
            if (requestId !== requestIdRef.current) return
            if (accountIdAtStart !== getActiveAccountId()) return

            if (response.statusCode === 200) {
                const formattedEvents = formatCalendarEvents(response.data)
                setEvents(formattedEvents)

                const existingSources = api.getEventSources()
                existingSources.forEach(source => source.remove())

                api.addEventSource(formattedEvents)
            } else {
                setEvents([])
                api.getEventSources().forEach((source) => source.remove())
            }
        } catch (error) {
            if (requestId !== requestIdRef.current) return
            console.error('Failed to fetch events:', error)
            setEvents([])
            api.getEventSources().forEach((source) => source.remove())
        }
    }, []);

    // Drop previous account events as soon as the active mailbox changes.
    useEffect(() => {
        clearCalendarData()
        void getAllEventList()
    }, [activeAccountId, clearCalendarData, getAllEventList])

    let resetLastClickedDateFn: (() => void) | null = null

    const registerResetLastClickedDate = useCallback((fn: () => void) => {
        resetLastClickedDateFn = fn
    }, [])

    const resetLastClickedDate = useCallback(() => {
        if (resetLastClickedDateFn) {
            resetLastClickedDateFn()
        }
    }, [])

    const goPrev = useCallback(() => {
        if (isCalendarAllSearchActive) {
            exitCalendarAllSearch()
        }

        const mainApi = mainCalendarRef.current?.getApi()
        const sidebarApi = sidebarCalendarRef.current?.getApi()
        if (!mainApi) return

        clearFocusDate()

        // Day view title shows month only, so navigate by month (same day-of-month)
        if (calendarView === 'timeGridDay') {
            const current = mainApi.getDate()
            const year = current.getFullYear()
            const month = current.getMonth() - 1
            const day = current.getDate()
            const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate()
            const target = new Date(year, month, Math.min(day, lastDayOfTargetMonth))
            mainApi.gotoDate(target)
            sidebarApi?.gotoDate(target)
            return
        }

        mainApi.prev()
        // Sync sidebar to main's date instead of independent prev() (day vs month mismatch)
        sidebarApi?.gotoDate(mainApi.getDate())
    }, [calendarView, isCalendarAllSearchActive, exitCalendarAllSearch])

    const goNext = useCallback(() => {
        if (isCalendarAllSearchActive) {
            exitCalendarAllSearch()
        }

        const mainApi = mainCalendarRef.current?.getApi()
        const sidebarApi = sidebarCalendarRef.current?.getApi()
        if (!mainApi) return

        clearFocusDate()

        if (calendarView === 'timeGridDay') {
            const current = mainApi.getDate()
            const year = current.getFullYear()
            const month = current.getMonth() + 1
            const day = current.getDate()
            const lastDayOfTargetMonth = new Date(year, month + 1, 0).getDate()
            const target = new Date(year, month, Math.min(day, lastDayOfTargetMonth))
            mainApi.gotoDate(target)
            sidebarApi?.gotoDate(target)
            return
        }

        mainApi.next()
        sidebarApi?.gotoDate(mainApi.getDate())
    }, [calendarView, isCalendarAllSearchActive, exitCalendarAllSearch])

    const goToday = useCallback(() => {
        if (isCalendarAllSearchActive) {
            exitCalendarAllSearch()
        }

        mainCalendarRef.current?.getApi().today()
        sidebarCalendarRef.current?.getApi().today()
        mainCalendarRef.current?.getApi().changeView('dayGridMonth')
        setCalendarView('dayGridMonth')
        document.querySelector('.Calendar-main #sidebar-calendar .subcalendar-day-box')?.classList.remove('subcalendar-day-box');

        // Reset the last clicked date ref to avoid false double-click detection
        resetLastClickedDate()
    }, [resetLastClickedDate, isCalendarAllSearchActive, exitCalendarAllSearch])

    const changeView = useCallback((view: CalendarView) => {
        if (isCalendarAllSearchActive) {
            exitCalendarAllSearch()
        }

        mainCalendarRef.current?.getApi().changeView(view)
        setCalendarView(view)

        // Remove subcalendar-day-box class if view is not day view
        if (view !== 'timeGridDay') {
            document.querySelectorAll('.subcalendar-day-box').forEach(element => {
                element.classList.remove('subcalendar-day-box');
            });
        }
    }, [isCalendarAllSearchActive, exitCalendarAllSearch])

    const value: CalendarContextType = {
        mainCalendarRef,
        sidebarCalendarRef,
        goPrev,
        goNext,
        goToday,
        changeView,
        resetLastClickedDate,
        registerResetLastClickedDate,
        calendarTitle,
        setCalendarTitle,
        calendarView,
        setCalendarView,
        events,
        setEvents,
        getAllEventList,
        clearCalendarData,
        selectedEvent,
        setSelectedEvent,
        isCalendarAllSearchActive,
        setIsCalendarAllSearchActive,
        exitCalendarAllSearch,
        calendarAllSearchedEvents,
        setCalendarAllSearchedEvents,
        resetSearchState,
        // Search state
        searchText,
        setSearchText,
        searchResults,
        setSearchResults,
        noResult,
        setNoResult,
        isSearchResultDropdownOpen,
        setIsSearchResultDropdownOpen,
        isSidebarCalendarOpen,
        setIsSidebarCalendarOpen
    }

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    )
}
