import type { CalendarApi } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react';
import type { CalendarEvent, EventDetail, UserCalendar } from '@models/CalendarModels';
import type { ApiResponse } from '@models/Response';
import { useAccount } from '@context/AccountContext';
import { getActiveAccountId } from '@services/apiService';
import { getAllEvents } from '@services/calendar/calendarService';
import { getCalendars } from '@services/calendar/calendarsService';
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

export interface FetchCalendarsOptions {
    resetSelection?: boolean;
    ensureSelectedIds?: string[];
}

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
    getAllEventList: (calendarApi?: CalendarApi) => Promise<void>,
    clearCalendarData: () => void,
    calendarAllSearchedEvents: CalendarEvent[] | Record<string, any[]>,
    setCalendarAllSearchedEvents: (events: CalendarEvent[] | Record<string, any[]>) => void,
    isCalendarAllSearchActive: boolean,
    setIsCalendarAllSearchActive: (active: boolean) => void,
    exitCalendarAllSearch: () => void,
    resetSearchState: () => void,

    // User calendars
    calendars: UserCalendar[],
    selectedCalendarIds: string[],
    calendarsLoaded: boolean,
    fetchCalendars: (options?: FetchCalendarsOptions) => Promise<UserCalendar[]>,
    toggleCalendarVisibility: (calendarId: string) => void,
    setCalendarVisible: (calendarId: string, visible: boolean) => void,

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

const sortCalendars = (list: UserCalendar[]): UserCalendar[] => {
    return [...list].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1
        if (!a.isDefault && b.isDefault) return 1
        return a.name.localeCompare(b.name)
    })
}

const sameIdSet = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false
    const setB = new Set(b)
    return a.every((id) => setB.has(id))
}

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
    const { activeAccountId } = useAccount()
    const mainCalendarRef = useRef<FullCalendar | null>(null)
    const sidebarCalendarRef = useRef<FullCalendar | null>(null)
    const requestIdRef = useRef(0)
    const calendarsRequestIdRef = useRef(0)
    const selectedCalendarIdsRef = useRef<string[]>([])
    const calendarsLoadedRef = useRef(false)
    const [calendarTitle, setCalendarTitle] = useState(() =>
        new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    );
    const [calendarView, setCalendarView] = useState<CalendarView>('dayGridMonth');
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
    const [calendarAllSearchedEvents, setCalendarAllSearchedEvents] = useState<CalendarEvent[] | Record<string, any[]>>([]);
    const [isCalendarAllSearchActive, setIsCalendarAllSearchActive] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [searchResults, setSearchResults] = useState<CalendarEvent[]>([])
    const [noResult, setNoResult] = useState(false)
    const [isSearchResultDropdownOpen, setIsSearchResultDropdownOpen] = useState(false)
    const [isSidebarCalendarOpen, setIsSidebarCalendarOpen] = useState(true)
    const [calendars, setCalendars] = useState<UserCalendar[]>([])
    const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([])
    const [calendarsLoaded, setCalendarsLoaded] = useState(false)

    selectedCalendarIdsRef.current = selectedCalendarIds
    calendarsLoadedRef.current = calendarsLoaded

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
        calendarsRequestIdRef.current += 1
        setEvents([])
        setSelectedEvent(null)
        setCalendarAllSearchedEvents([])
        setIsCalendarAllSearchActive(false)
        setCalendars([])
        setSelectedCalendarIds([])
        selectedCalendarIdsRef.current = []
        setCalendarsLoaded(false)
        calendarsLoadedRef.current = false
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

    const getAllEventList = useCallback(async (calendarApi?: CalendarApi) => {
        if (!calendarsLoadedRef.current) return

        const api = calendarApi ?? mainCalendarRef.current?.getApi()
        if (!api) return

        const start = api.view.activeStart?.toISOString()
        const end = api.view.activeEnd?.toISOString()

        if (!start || !end) return

        const requestId = ++requestIdRef.current
        const accountIdAtStart = getActiveAccountId()
        const calendarIds = selectedCalendarIdsRef.current

        try {
            const response: ApiResponse<CalendarEvent[]> = await getAllEvents({ start, end, calendarIds })
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

    const fetchCalendars = useCallback(async (options?: FetchCalendarsOptions): Promise<UserCalendar[]> => {
        if (!localStorage.getItem('token')) return []

        const requestId = ++calendarsRequestIdRef.current
        const accountIdAtStart = getActiveAccountId()

        try {
            const response = await getCalendars()
            if (requestId !== calendarsRequestIdRef.current) return []
            // Skip stale mailbox results, but keep the bootstrap response
            // (header is often still null when the first reload request starts).
            if (accountIdAtStart && accountIdAtStart !== getActiveAccountId()) return []

            if (response.statusCode === 200) {
                const list = sortCalendars(response.data?.calendars || [])
                const allIds = list.map((calendar) => calendar._id)
                setCalendars(list)
                setSelectedCalendarIds((prev) => {
                    let next: string[]
                    if (options?.resetSelection || prev.length === 0) {
                        next = allIds
                    } else {
                        const kept = prev.filter((id) => allIds.includes(id))
                        const extra = (options?.ensureSelectedIds || []).filter((id) => allIds.includes(id))
                        next = [...new Set([...kept, ...extra])]
                    }
                    if (sameIdSet(prev, next)) return prev
                    selectedCalendarIdsRef.current = next
                    return next
                })
                calendarsLoadedRef.current = true
                setCalendarsLoaded(true)
                return list
            }

            return []
        } catch (error) {
            if (requestId !== calendarsRequestIdRef.current) return []
            console.error('Failed to fetch calendars:', error)
            return []
        }
    }, [])

    const toggleCalendarVisibility = useCallback((calendarId: string) => {
        setSelectedCalendarIds((prev) => {
            const next = prev.includes(calendarId)
                ? prev.filter((id) => id !== calendarId)
                : [...prev, calendarId]
            selectedCalendarIdsRef.current = next
            return next
        })
    }, [])

    const setCalendarVisible = useCallback((calendarId: string, visible: boolean) => {
        setSelectedCalendarIds((prev) => {
            const isSelected = prev.includes(calendarId)
            if (visible === isSelected) return prev
            const next = visible ? [...prev, calendarId] : prev.filter((id) => id !== calendarId)
            selectedCalendarIdsRef.current = next
            return next
        })
    }, [])

    // Drop previous account calendars/events as soon as the active mailbox changes.
    useEffect(() => {
        clearCalendarData()
        if (activeAccountId && localStorage.getItem('token')) {
            void fetchCalendars({ resetSelection: true })
        }
    }, [activeAccountId, clearCalendarData, fetchCalendars])

    // Refetch grid events when visibility changes (including first load after calendars arrive).
    useEffect(() => {
        if (!calendarsLoaded) return
        void getAllEventList()
    }, [selectedCalendarIds, calendarsLoaded, getAllEventList])

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
        calendars,
        selectedCalendarIds,
        calendarsLoaded,
        fetchCalendars,
        toggleCalendarVisibility,
        setCalendarVisible,
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
