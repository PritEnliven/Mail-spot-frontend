import {
    createContext,
    useContext,
    useRef,
    useCallback,
    useState,
    type ReactNode,
} from 'react'
import FullCalendar from '@fullcalendar/react'
import { getAllEvents } from '@services/calendar/calendarService'
import type { ApiResponse } from '@models/Response';
import type { CalendarEvent, EventDetail } from '@models/CalendarModels';
import { formatCalendarEvents } from '@utils/calendarUtil';
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
    getAllEventList: () => Promise<void>,
    calendarAllSearchedEvents: CalendarEvent[],
    setCalendarAllSearchedEvents: (events: CalendarEvent[]) => void,
    isCalendarAllSearchActive: boolean,
    setIsCalendarAllSearchActive: (active: boolean) => void,
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
    const mainCalendarRef = useRef<FullCalendar | null>(null)
    const sidebarCalendarRef = useRef<FullCalendar | null>(null)
    const [calendarTitle, setCalendarTitle] = useState('');
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

    const getAllEventList = useCallback(async () => {
        const calendarApi = mainCalendarRef.current?.getApi()
        if (!calendarApi) return

        const start = calendarApi.view.activeStart?.toISOString()
        const end = calendarApi.view.activeEnd?.toISOString()

        if (!start || !end) return

        try {
            const response: ApiResponse<CalendarEvent[]> = await getAllEvents({ start, end })
            if (response.statusCode === 200) {
                const formattedEvents = formatCalendarEvents(response.data)
                setEvents(formattedEvents)

                const existingSources = calendarApi.getEventSources()
                existingSources.forEach(source => source.remove())

                calendarApi.addEventSource(formattedEvents)
            }
        } catch (error) {
            console.error('Failed to fetch events:', error)
        }
    }, []);

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
        mainCalendarRef.current?.getApi().prev()
        sidebarCalendarRef.current?.getApi().prev()
    }, [])

    const goNext = useCallback(() => {
        mainCalendarRef.current?.getApi().next()
        sidebarCalendarRef.current?.getApi().next()
    }, [])

    const goToday = useCallback(() => {
        mainCalendarRef.current?.getApi().today()
        sidebarCalendarRef.current?.getApi().today()
        mainCalendarRef.current?.getApi().changeView('dayGridMonth')
        setCalendarView('dayGridMonth')
        document.querySelector('.Calendar-main #sidebar-calendar .subcalendar-day-box')?.classList.remove('subcalendar-day-box');

        // Reset the last clicked date ref to avoid false double-click detection
        resetLastClickedDate()
    }, [resetLastClickedDate])

    const changeView = useCallback((view: CalendarView) => {
        mainCalendarRef.current?.getApi().changeView(view)
        setCalendarView(view)

        // Remove subcalendar-day-box class if view is not day view
        if (view !== 'timeGridDay') {
            document.querySelectorAll('.subcalendar-day-box').forEach(element => {
                element.classList.remove('subcalendar-day-box');
            });
        }
    }, [])

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
        selectedEvent,
        setSelectedEvent,
        isCalendarAllSearchActive,
        setIsCalendarAllSearchActive,
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
