// import InteractiveIcon from "@components/ui/InteractiveIcon";
// import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";
// import { useCalendar } from "@context/CalendarContext";
// import { useContacts } from "@context/ContactsContext";
// import { useScreen } from "@context/ScreenContext";
// import { useDebounce } from "@hooks/useDebounce";
// import btnCloseIconHover from "@images/btn-close-icon-hover.svg";
// import btnCloseIcon from "@images/btn-close-icon.svg";
// import dateIcon from "@images/date-icon-16.svg";
// import functionIconHover from "@images/function-icon-hover.svg";
// import functionIcon from "@images/function-icon.svg";
// import searchIcon from "@images/search-icon.svg";
// import type { Response } from "@models/Response";
// import { filterEvents, getAllSearchEventList, searchEvent } from "@services/calendar/calendarService";
// import { formatDate, TimeFormat } from "@utils/dateUtil";
// import { useEffect, useRef, useState } from "react";
// import Flatpickr from 'react-flatpickr';
// import { Controller } from 'react-hook-form';
// import { useCalendarFilterForm } from "../../../../hooks/useCalendarFilterForm";
// import Select2Wrapper from "../../form/Select2Wrapper";
// import CalendarEventRow from "../CalendarEventRow";
// import { showError } from "@components/ui/toast/toastNotification";
// import type { CalendarFilterFormValues } from "./calendarFilterForm.schema";

// function CalendarHeader() {
//     const { goPrev, goNext, goToday, calendarTitle, mainCalendarRef, searchText, setSearchText, searchResults, setSearchResults, noResult, setNoResult, isSearchResultDropdownOpen, setIsSearchResultDropdownOpen } = useCalendar();
//     const { control, handleSubmit, reset, getValues } = useCalendarFilterForm();
//     const { isDesktop } = useScreen();
//     const { contacts } = useContacts();
//     const [isCalendarFilterDropdownOpen, setIsCalendarFilterDropdownOpen] = useState(false);
//     const { setCalendarAllSearchedEvents, setIsCalendarAllSearchActive, isSidebarCalendarOpen, setIsSidebarCalendarOpen } = useCalendar();
//     const debouncedSearchText = useDebounce(searchText, 1000);

//     const startFromMonth = new Date().getMonth();
//     const mountMonthDropdown = useFlatpickrMonthDropdown(startFromMonth);

//     const toggleCalendarFilterDropdown = () => {
//         setIsCalendarFilterDropdownOpen(!isCalendarFilterDropdownOpen);
//     };

//     const searchDropdownRef = useRef<HTMLUListElement | null>(null);

//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//             const target = event.target as Element;
//             const headerComponent = target.closest('.mail-details-header');
//             const flatpickrCalendar = target.closest('.flatpickr-calendar');
//             const flatpickrInput = target.closest('.DateRangePickerStaticTop');

//             // Only close dropdowns if clicking outside the entire header component, flatpickr calendar, and flatpickr input
//             if (!headerComponent && !flatpickrCalendar && !flatpickrInput) {
//                 if (isCalendarFilterDropdownOpen) {
//                     setIsCalendarFilterDropdownOpen(false);
//                     setSearchResults([]);
//                 }
//                 if (isSearchResultDropdownOpen) {
//                     setIsSearchResultDropdownOpen(false);
//                 }
//             }
//         };

//         document.addEventListener("mousedown", handleClickOutside);
//         return () => {
//             document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, [isCalendarFilterDropdownOpen, isSearchResultDropdownOpen]);

//     useEffect(() => {
//         if (!debouncedSearchText.trim()) {
//             setSearchResults([]);
//             setNoResult(false);
//             return;
//         }

//         const controller = new AbortController();

//         const searchEmails = async () => {
//             try {
//                 const response: Response = await searchEvent(
//                     {
//                         searchText: debouncedSearchText,
//                     }
//                 );

//                 if (response?.statusCode === 200) {
//                     if (response.data.allEvents.length === 0) {
//                         setNoResult(true);
//                         setSearchResults([]);
//                     }
//                     else {
//                         setNoResult(false);
//                         setSearchResults(response.data.allEvents.slice(0, 5) || []);
//                     }
//                     setIsCalendarFilterDropdownOpen(false);
//                     setIsSearchResultDropdownOpen(true);
//                     setCalendarAllSearchedEvents(response.data.allEvents || []);
//                 }
//             } catch (err: any) {
//                 if (err.name !== "AbortError") {
//                     console.error("Search failed:", err);
//                 }
//             }
//         };

//         searchEmails();

//         return () => controller.abort();
//     }, [debouncedSearchText]);

//     const onSubmit = async (data: CalendarFilterFormValues) => {
//         try {
//             let payload: any = {
//                 eventName: data.eventName || undefined,
//                 eventLocation: data.eventLocation || undefined,
//                 calendarFilterOrganizer: data.calendarFilterOrganizer,
//                 searchIn: data.searchIn === 'allCalendar' ? 'all' : 'thisMonth',
//                 eventDate: data.eventDate?.length === 2 ? `${formatDate(data.eventDate[0], TimeFormat.DD_MM_YYYY)} to ${formatDate(data.eventDate[1], TimeFormat.DD_MM_YYYY)}` : undefined,
//             };

//             //here any of one value should be fill if not filled up showError
//             if (!data.eventName && !data.eventLocation && !data.calendarFilterOrganizer && !data.searchIn) {
//                 showError('Please fill at least one field');
//                 return;
//             }

//             if (data.eventDate?.length === 2) {
//                 payload.eventDate = `${formatDate(data.eventDate[0], TimeFormat.DD_MM_YYYY)} to ${formatDate(data.eventDate[1], TimeFormat.DD_MM_YYYY)}`;
//             }

//             const response: Response = await filterEvents(payload);
//             if (response?.statusCode === 200) {
//                 if (response.data.allEvents.length === 0) {
//                     setNoResult(true);
//                     setSearchResults([]);
//                 }
//                 else {
//                     setNoResult(false);
//                     setSearchResults(response.data.allEvents.slice(0, 5) || []);
//                 }
//                 setIsCalendarFilterDropdownOpen(false);
//                 setIsSearchResultDropdownOpen(true);
//             }
//         } catch (error) {
//             console.error('Error filtering events:', error);
//         }
//     };

//     const allEventSearchHandler = async () => {
//         try {
//             const data = getValues();
//             let payload: any = {
//                 eventName: data.eventName || undefined,
//                 eventLocation: data.eventLocation || undefined,
//                 calendarFilterOrganizer: data.calendarFilterOrganizer,
//                 searchIn: data.searchIn === 'allCalendar' ? 'all' : 'thisMonth',
//                 eventDate: data.eventDate?.length === 2 ? `${formatDate(data.eventDate[0], TimeFormat.DD_MM_YYYY)} to ${formatDate(data.eventDate[1], TimeFormat.DD_MM_YYYY)}` : undefined,
//             };

//             if (!data.eventName && !data.eventLocation && !data.calendarFilterOrganizer && !data.searchIn) {
//                 showError('Please fill at least one field');
//                 return;
//             }

//             if (data.eventDate && Array.isArray(data.eventDate) && data.eventDate.length === 2) {
//                 payload.start = new Date(data.eventDate[0]).toISOString();
//                 payload.end = new Date(data.eventDate[1]).toISOString();
//             } else {
//                 // If no date range is provided, use current month's start and end dates
//                 const calendarApi = mainCalendarRef.current?.getApi();
//                 if (calendarApi) {
//                     const start = calendarApi.view.activeStart?.toISOString();
//                     const end = calendarApi.view.activeEnd?.toISOString();
//                     if (start && end) {
//                         payload.start = start;
//                         payload.end = end;
//                     }
//                 }
//             }

//             const response: Response = await getAllSearchEventList(payload);
//             if (response?.statusCode === 200) {
//                 setIsCalendarAllSearchActive(true);
//                 if (response.data.length === 0) {
//                     setNoResult(true);
//                     setCalendarAllSearchedEvents([]);
//                 }
//                 else {
//                     setNoResult(false);
//                     setCalendarAllSearchedEvents(response.data || []);
//                 }
//                 setIsCalendarFilterDropdownOpen(false);
//                 setIsSearchResultDropdownOpen(false);
//             }
//         } catch (error) {
//             console.error('Error filtering events:', error);
//         }
//     }

//     const onReset = () => {
//         reset();
//     };

//     const toggleSidebarCalendar = () => {
//         if (!isDesktop) {
//             setIsSidebarCalendarOpen(!isSidebarCalendarOpen);
//         } else {
//             setIsSidebarCalendarOpen(true);
//         }
//     };

//     return (
//         <>
//             <div className="d-flex align-items-center">
//                 <div className="btn-group">
//                     <button id="btnToday" className="btn-new fc-today-button me-3" onClick={goToday}>
//                         Today
//                     </button>
//                     <div className="d-flex align-items-center me-3">
//                         <button id="btnPrev" className="fc-icon-chevron-left btn-new icon-hover-effect" onClick={goPrev} />
//                         <button id="btnNext" className="fc-icon-chevron-right btn-new icon-hover-effect" onClick={goNext} />
//                     </div>
//                     <div id="calendar-title" className="fc-toolbar-title" onClick={toggleSidebarCalendar}>
//                         {calendarTitle}
//                     </div>
//                 </div>
//             </div>
//             <div className="d-flex align-items-center justify-content-between w-100">
//                 <div className="top-search">
//                     <div className="top-search-container">
//                         <div className="input-icon-add">
//                             <div className="form-group input-big t-search-group inbox-more mb-0">
//                                 <img src={searchIcon} alt="" className="input-icon-1" />
//                                 <input
//                                     type="search"
//                                     className="form-control dropdown-toggle  navTopSearchDropdown-cm"
//                                     placeholder="Search..."
//                                     id="navTopSearchDropdown2"
//                                     value={searchText}
//                                     onChange={(e) => setSearchText(e.target.value)}
//                                     onFocus={() => setIsSearchResultDropdownOpen(true)}
//                                     autoComplete="off"
//                                     aria-expanded="false"
//                                 />
//                                 <ul
//                                     ref={searchDropdownRef}
//                                     className={`dropdown-menu dropdown-menu-end t-search-dropdown-menu more-list searchEmailDropdown-cm ${isSearchResultDropdownOpen ? 'show' : ''}`}
//                                     id="searchEmailDropdown2"
//                                     aria-labelledby="navTopSearchCalendarDropdown"
//                                     data-simplebar=""
//                                     data-simplebar-auto-hide="false"
//                                 >
//                                     {searchResults.length > 0 ? (
//                                         searchResults.map((event) => (
//                                             <CalendarEventRow
//                                                 key={`${event._id}-${event.startDate}`}
//                                                 data={event}
//                                             />
//                                         ))
//                                     ) : noResult ? (
//                                         <li className="no-result">
//                                             <div className="subject-search">
//                                                 <div className="subject text-center">
//                                                     No recent items match your search.
//                                                 </div>
//                                             </div>
//                                         </li>
//                                     ) : (
//                                         <li className="no-result">
//                                             <div className="subject-search">
//                                                 <div className="subject text-center">
//                                                     Type to search events...
//                                                 </div>
//                                             </div>
//                                         </li>
//                                     )}
//                                     {searchResults.length > 0 && (
//                                         <div className="all-search-result-show" onClick={() => allEventSearchHandler()}>
//                                             <div className="d-flex align-items-center justify-content-strat">
//                                                 <img src={searchIcon} className="me-2" alt="" width={18} height={18} />
//                                                 <div className="subject">All search results for 
//                                                     <span className="all-search-result" id="searchQuery">'{searchText}'</span>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </ul>
//                             </div>
//                         </div>
//                         {/* /.form-group */}
//                         <div className="top-filter inbox-more">
//                             <div className="top-filter__actions">
//                                 {searchText.length > 0 && (
//                                     <button
//                                         type="button"
//                                         className="btn-new hover-link clearSearchBtn-cm"
//                                         onClick={() => {
//                                             setSearchText("");
//                                             setSearchResults([]);
//                                             setNoResult(false);
//                                             setIsSearchResultDropdownOpen(false);
//                                         }}
//                                     >
//                                         <InteractiveIcon
//                                             defaultIcon={btnCloseIcon}
//                                             hoverIcon={btnCloseIconHover}
//                                             activeIcon=""
//                                             isActive={false}
//                                             alt=""
//                                             className="interactive-icon hover-image"
//                                             renderAs="img"
//                                             tooltip="Back"
//                                             customStyle={{
//                                                 width: '20px',
//                                                 height: '20px',
//                                             }}
//                                         />
//                                     </button>
//                                 )}
//                                 <button type="button" className="btn btnic btn-grey dropdown-toggle t-filter-btn hover-link search-d-Btn-cm"
//                                     onClick={toggleCalendarFilterDropdown}
//                                     aria-expanded={isCalendarFilterDropdownOpen}
//                                 >
//                                     <InteractiveIcon
//                                         defaultIcon={functionIcon}
//                                         hoverIcon={functionIconHover}
//                                         activeIcon=""
//                                         isActive={false}
//                                         alt=""
//                                         className="interactive-icon hover-image"
//                                         renderAs="img"
//                                         tooltip="Show search option"
//                                     />
//                                 </button>
//                             </div>
//                             <div
//                                 className={`dropdown-menu dropdown-menu-end t-filter-dropdown-menu more-list ${isCalendarFilterDropdownOpen ? 'show' : ''}`}
//                                 id="calendarFilterFormSection"
//                                 aria-labelledby="search-d-Btn"
//                             >
//                                 <form id="calendarFilterForm">
//                                     <div className="filter-body">
//                                         <div className="form-group form-row ">
//                                             <label className="control-label">Search in</label>
//                                             <div className="input-control">
//                                                 <Controller
//                                                     name="searchIn"
//                                                     control={control}
//                                                     render={({ field }) => (
//                                                         <Select2Wrapper
//                                                             value={field.value || "allCalendar"}
//                                                             onChange={field.onChange}
//                                                             options={[
//                                                                 { label: "All Calendar", value: "allCalendar" },
//                                                                 { label: "This Month", value: "thisMonth" }
//                                                             ]}
//                                                             isMulti={false}
//                                                             isModal={true}
//                                                         />
//                                                     )}
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="form-group form-row ">
//                                             <label className="control-label">Event name</label>
//                                             <div className="input-control">
//                                                 <Controller
//                                                     name="eventName"
//                                                     control={control}
//                                                     render={({ field }) => (
//                                                         <input
//                                                             type="text"
//                                                             className="form-control"
//                                                             {...field}
//                                                         />
//                                                     )}
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="form-group form-row select2-profile">
//                                             <label className="control-label">Participant/Organizer</label>
//                                             <div className="input-control">
//                                                 <Controller
//                                                     name="calendarFilterOrganizer"
//                                                     control={control}
//                                                     render={({ field }) => (
//                                                         < Select2Wrapper
//                                                             value={field.value || []}
//                                                             onChange={field.onChange}
//                                                             options={contacts}
//                                                             placeholder="Select or type to add"
//                                                             isMulti={true}
//                                                         />
//                                                     )}
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="form-group form-row ">
//                                             <label className="control-label">Event Location</label>
//                                             <div className="input-control">
//                                                 <Controller
//                                                     name="eventLocation"
//                                                     control={control}
//                                                     render={({ field }) => (
//                                                         <input
//                                                             type="text"
//                                                             className="form-control"
//                                                             {...field}
//                                                         />
//                                                     )}
//                                                 />
//                                             </div>
//                                         </div>
//                                         <div className="form-group">
//                                             <label className="control-label">Date</label>
//                                             <div className="input-icon-add">
//                                                 <img src={dateIcon} className="input-icon-1" alt="" />
//                                                 <Controller
//                                                     name="eventDate"
//                                                     control={control}
//                                                     render={({ field }) => (
//                                                         <Flatpickr
//                                                             value={field.value}
//                                                             onChange={(dates) => field.onChange(dates)}
//                                                             options={{
//                                                                 mode: 'range',
//                                                                 dateFormat: 'd-m-Y',
//                                                                 allowInput: true,
//                                                                 defaultDate: [new Date(), new Date()],
//                                                                 onReady: (_, __, instance) => mountMonthDropdown(instance)
//                                                             }}
//                                                             className="form-control DateRangePickerStaticTop"
//                                                             placeholder="Select date range"
//                                                         />
//                                                     )}
//                                                 />
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="filter-footer">
//                                         <button type="button" className="btn-new" onClick={onReset}>
//                                             Reset
//                                         </button>
//                                         <button
//                                             type="button"
//                                             className="btn-new btn-new-bg searchBtn-cm"
//                                             id="calendarFilterSearchBtn"
//                                             onClick={handleSubmit(onSubmit, (errors: any) => {
//                                                 console.log('SUBMIT BLOCKED BY ERRORS:', errors);
//                                             })}
//                                         >
//                                             Search
//                                         </button>
//                                     </div>
//                                 </form>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </>
//     )
// }

// export default CalendarHeader;


import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";
import { useCalendar, type CalendarView } from "@context/CalendarContext";
import { useContacts } from "@context/ContactsContext";
import { useScreen } from "@context/ScreenContext";
import { useMailUI } from "@context/MailUIContext";
import { useDebounce } from "@hooks/useDebounce";
import btnCloseIconHover from "@images/btn-close-icon-hover.svg";
import btnCloseIcon from "@images/btn-close-icon.svg";
import dateIcon from "@images/date-icon-16.svg";
import functionIconHover from "@images/function-icon-hover.svg";
import functionIcon from "@images/function-icon.svg";
import searchIcon from "@images/search-icon.svg";
import searchIconHover from "@images/search-icon-hover.svg";
import backBtnIcon from "@images/back-btn-icon.svg";
import backBtnIconHover from "@images/back-btn-icon-hover.svg";
import sidebarcloseIcon from "@images/side-bar-close-icon.svg";
import sidebarcloseHoverIcon from "@images/side-bar-close-hover-icon.svg";
import sidebaropenIcon from "@images/side-bar-open-icon.svg";
import sidebaropenHoverIcon from "@images/side-bar-open-hover-icon.svg";
import type { Response } from "@models/Response";
import { filterEvents, getAllSearchEventList, searchEvent } from "@services/calendar/calendarService";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { useEffect, useRef, useState } from "react";
import Flatpickr from 'react-flatpickr';
import { Controller } from 'react-hook-form';
import { useCalendarFilterForm } from "../../../../hooks/useCalendarFilterForm";
import Select2Wrapper from "../../form/Select2Wrapper";
import CalendarEventRow from "../CalendarEventRow";
import { showError } from "@components/ui/toast/toastNotification";
import type { CalendarFilterFormValues } from "./calendarFilterForm.schema";

const CALENDAR_VIEW_OPTIONS = [
    { label: "Month", value: "dayGridMonth" },
    { label: "Week", value: "timeGridWeek" },
    { label: "Day", value: "timeGridDay" },
];

function CalendarHeader() {
    const { goPrev, goNext, goToday, calendarTitle, calendarView, changeView, mainCalendarRef, searchText, setSearchText, searchResults, setSearchResults, noResult, setNoResult, isSearchResultDropdownOpen, setIsSearchResultDropdownOpen } = useCalendar();
    const { control, handleSubmit, reset, getValues } = useCalendarFilterForm();
    const { isDesktop, isMobile } = useScreen();
    const { isSidebarExpandedMobile, setIsSidebarExpandedMobile } = useMailUI();
    const { contacts } = useContacts();
    const [isCalendarFilterDropdownOpen, setIsCalendarFilterDropdownOpen] = useState(false);
    const [isResponsiveSearch, setIsResponsiveSearch] = useState(false);
    const { setCalendarAllSearchedEvents, setIsCalendarAllSearchActive, isSidebarCalendarOpen, setIsSidebarCalendarOpen } = useCalendar();
    const debouncedSearchText = useDebounce(searchText, 1000);
    const allowSearchDropdownRef = useRef(true);


     const {
            isSidebarOpen,
            setIsSidebarOpen,
           
    } = useMailUI();

    const startFromMonth = new Date().getMonth();
    const mountMonthDropdown = useFlatpickrMonthDropdown(startFromMonth);

    const toggleCalendarFilterDropdown = () => {
        setIsCalendarFilterDropdownOpen(!isCalendarFilterDropdownOpen);
    };
    const toggleSidebarHandler = () => {
        if (isMobile) {
            setIsSidebarExpandedMobile(!isSidebarExpandedMobile);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const searchDropdownRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            const headerComponent = target.closest('.mail-details-header');
            const flatpickrCalendar = target.closest('.flatpickr-calendar');
            const flatpickrInput = target.closest('.DateRangePickerStaticTop');

            if (!headerComponent && !flatpickrCalendar && !flatpickrInput) {
                if (isCalendarFilterDropdownOpen) {
                    setIsCalendarFilterDropdownOpen(false);
                    setSearchResults([]);
                }
                if (isSearchResultDropdownOpen) {
                    setIsSearchResultDropdownOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isCalendarFilterDropdownOpen, isSearchResultDropdownOpen]);

    useEffect(() => {
        const trimmedSearchText = searchText.trim();
        const currentSearch = debouncedSearchText.trim();

        if (!trimmedSearchText && currentSearch) {
            return;
        }

        if (!currentSearch) {
            setSearchResults([]);
            setNoResult(false);
            setIsSearchResultDropdownOpen(false);
            return;
        }

        const controller = new AbortController();

        const searchEvents = async () => {
            try {
                const response: Response = await searchEvent({ searchText: currentSearch });
                if (response?.statusCode === 200) {
                    if (allowSearchDropdownRef.current) {
                        setIsSearchResultDropdownOpen(true);
                    }
                    if (response.data.allEvents.length === 0) {
                        setNoResult(true);
                        setSearchResults([]);
                    } else {
                        setNoResult(false);
                        setSearchResults(response.data.allEvents.slice(0, 5) || []);
                    }
                    setCalendarAllSearchedEvents(response.data.allEvents || []);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("Search failed:", err);
                }
            }
        };

        searchEvents();
        return () => controller.abort();
    }, [debouncedSearchText]);

    const onSubmit = async (data: CalendarFilterFormValues) => {
        try {
            let payload: any = {
                eventName: data.eventName || undefined,
                eventLocation: data.eventLocation || undefined,
                calendarFilterOrganizer: data.calendarFilterOrganizer,
                searchIn: data.searchIn === 'allCalendar' ? 'all' : 'thisMonth',
                eventDate: data.eventDate?.length === 2 ? `${formatDate(data.eventDate[0], TimeFormat.DD_MM_YYYY)} to ${formatDate(data.eventDate[1], TimeFormat.DD_MM_YYYY)}` : undefined,
            };

            if (!data.eventName && !data.eventLocation && !data.calendarFilterOrganizer && !data.searchIn) {
                showError('Please fill at least one field');
                return;
            }

            if (data.eventDate?.length === 2) {
                payload.eventDate = `${formatDate(data.eventDate[0], TimeFormat.DD_MM_YYYY)} to ${formatDate(data.eventDate[1], TimeFormat.DD_MM_YYYY)}`;
            }

            const response: Response = await filterEvents(payload);
            if (response?.statusCode === 200) {
                if (response.data.allEvents.length === 0) {
                    setNoResult(true);
                    setSearchResults([]);
                }
                else {
                    setNoResult(false);
                    setSearchResults(response.data.allEvents.slice(0, 5) || []);
                }
                setIsCalendarFilterDropdownOpen(false);
                setIsSearchResultDropdownOpen(true);
            }
        } catch (error) {
            console.error('Error filtering events:', error);
        }
    };

    const allEventSearchHandler = async () => {
        try {
            const data = getValues();
            let payload: any = {
                eventName: data.eventName || undefined,
                eventLocation: data.eventLocation || undefined,
                calendarFilterOrganizer: data.calendarFilterOrganizer,
                searchIn: data.searchIn === 'allCalendar' ? 'all' : 'thisMonth',
                eventDate: data.eventDate?.length === 2 ? `${formatDate(data.eventDate[0], TimeFormat.DD_MM_YYYY)} to ${formatDate(data.eventDate[1], TimeFormat.DD_MM_YYYY)}` : undefined,
            };

            if (!data.eventName && !data.eventLocation && !data.calendarFilterOrganizer && !data.searchIn) {
                showError('Please fill at least one field');
                return;
            }

            if (data.eventDate && Array.isArray(data.eventDate) && data.eventDate.length === 2) {
                payload.start = new Date(data.eventDate[0]).toISOString();
                payload.end = new Date(data.eventDate[1]).toISOString();
            } else {
                const calendarApi = mainCalendarRef.current?.getApi();
                if (calendarApi) {
                    const start = calendarApi.view.activeStart?.toISOString();
                    const end = calendarApi.view.activeEnd?.toISOString();
                    if (start && end) {
                        payload.start = start;
                        payload.end = end;
                    }
                }
            }

            const response: Response = await getAllSearchEventList(payload);
            if (response?.statusCode === 200) {
                setIsCalendarAllSearchActive(true);
                if (response.data.length === 0) {
                    setNoResult(true);
                    setCalendarAllSearchedEvents([]);
                }
                else {
                    setNoResult(false);
                    setCalendarAllSearchedEvents(response.data || []);
                }
                setIsCalendarFilterDropdownOpen(false);
                setIsSearchResultDropdownOpen(false);
            }
        } catch (error) {
            console.error('Error filtering events:', error);
        }
    }

    const onReset = () => {
        reset();
    };

    const toggleSidebarCalendar = () => {
        if (!isDesktop) {
            setIsSidebarCalendarOpen(!isSidebarCalendarOpen);
        } else {
            setIsSidebarCalendarOpen(true);
        }
    };

    const searchPanel = (
        <div className={`top-search ${isResponsiveSearch ? 'show-search' : ''}`} id="topSearch">
            <div className="top-search-container">
                <div className="input-icon-add">
                    <div className="form-group input-big t-search-group inbox-more mb-0">
                        <img src={searchIcon} alt="" className="input-icon-1 search-icon" />
                        {/* Mobile-back-btn-only */}
                        <button type="button" className="btn hover-link input-icon-1 monile-back-btn" onClick={() => setIsResponsiveSearch(false)}>
                            <InteractiveIcon
                                defaultIcon={backBtnIcon}
                                hoverIcon={backBtnIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Back"
                                customStyle={{
                                    width: '20px',
                                    height: '20px',
                                }}
                            />
                        </button>
                        <input
                            type="search"
                            className="form-control dropdown-toggle  navTopSearchDropdown-cm"
                            placeholder="Search..."
                            id="navTopSearchDropdown2"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onFocus={() => setIsSearchResultDropdownOpen(true)}
                            autoComplete="off"
                            aria-expanded="false"
                        />
                        <ul
                            ref={searchDropdownRef}
                            className={`dropdown-menu dropdown-menu-end t-search-dropdown-menu more-list searchEmailDropdown-cm ${isSearchResultDropdownOpen ? 'show' : ''}`}
                            id="searchEmailDropdown2"
                            aria-labelledby="navTopSearchCalendarDropdown"
                            data-simplebar=""
                            data-simplebar-auto-hide="false"
                        >
                            {searchResults.length > 0 ? (
                                searchResults.map((event) => (
                                    <CalendarEventRow
                                        key={`${event._id}-${event.startDate}`}
                                        data={event}
                                    />
                                ))
                            ) : noResult ? (
                                <li className="no-result">
                                    <div className="subject-search">
                                        <div className="subject text-center">
                                            No recent items match your search.
                                        </div>
                                    </div>
                                </li>
                            ) : (
                                <li className="no-result">
                                    <div className="subject-search">
                                        <div className="subject text-center">
                                            Type to search events...
                                        </div>
                                    </div>
                                </li>
                            )}
                            {searchResults.length > 0 && (
                                <div className="all-search-result-show" onClick={() => allEventSearchHandler()}>
                                    <div className="d-flex align-items-center justify-content-strat">
                                        <img src={searchIcon} className="me-2" alt="" width={18} height={18} />
                                        <div className="subject">All search results for
                                            <span className="all-search-result" id="searchQuery">'{searchText}'</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
                {/* /.form-group */}
                <div className="top-filter inbox-more">
                    <div className="top-filter__actions">
                        {searchText.length > 0 && (
                            <button
                                type="button"
                                className="btn-new hover-link clearSearchBtn-cm"
                                onClick={() => {
                                    allowSearchDropdownRef.current = false;
                                    setSearchText("");
                                    setSearchResults([]);
                                    setNoResult(false);
                                    setIsSearchResultDropdownOpen(false);
                                }}
                            >
                                <InteractiveIcon
                                    defaultIcon={btnCloseIcon}
                                    hoverIcon={btnCloseIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Back"
                                    customStyle={{
                                        width: '20px',
                                        height: '20px',
                                    }}
                                />
                            </button>
                        )}
                        <button type="button" className="btn btnic btn-grey dropdown-toggle t-filter-btn hover-link search-d-Btn-cm"
                            onClick={toggleCalendarFilterDropdown}
                            aria-expanded={isCalendarFilterDropdownOpen}
                        >
                            <InteractiveIcon
                                defaultIcon={functionIcon}
                                hoverIcon={functionIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip="Show search option"
                            />
                        </button>
                    </div>
                    <div
                        className={`dropdown-menu dropdown-menu-end t-filter-dropdown-menu more-list ${isCalendarFilterDropdownOpen ? 'show' : ''}`}
                        id="calendarFilterFormSection"
                        aria-labelledby="search-d-Btn"
                    >
                        <form id="calendarFilterForm">
                            <div className="filter-body">
                                <div className="form-group form-row ">
                                    <label className="control-label">Search in</label>
                                    <div className="input-control">
                                        <Controller
                                            name="searchIn"
                                            control={control}
                                            render={({ field }) => (
                                                <Select2Wrapper
                                                    value={field.value || "allCalendar"}
                                                    onChange={field.onChange}
                                                    options={[
                                                        { label: "All Calendar", value: "allCalendar" },
                                                        { label: "This Month", value: "thisMonth" }
                                                    ]}
                                                    isMulti={false}
                                                    isModal={true}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="form-group form-row ">
                                    <label className="control-label">Event name</label>
                                    <div className="input-control">
                                        <Controller
                                            name="eventName"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="form-group form-row select2-profile">
                                    <label className="control-label">Participant/Organizer</label>
                                    <div className="input-control">
                                        <Controller
                                            name="calendarFilterOrganizer"
                                            control={control}
                                            render={({ field }) => (
                                                < Select2Wrapper
                                                    value={field.value || []}
                                                    onChange={field.onChange}
                                                    options={contacts}
                                                    placeholder="Select or type to add"
                                                    isMulti={true}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="form-group form-row ">
                                    <label className="control-label">Event Location</label>
                                    <div className="input-control">
                                        <Controller
                                            name="eventLocation"
                                            control={control}
                                            render={({ field }) => (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    {...field}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="control-label">Date</label>
                                    <div className="input-icon-add">
                                        <img src={dateIcon} className="input-icon-1" alt="" />
                                        <Controller
                                            name="eventDate"
                                            control={control}
                                            render={({ field }) => (
                                                <Flatpickr
                                                    value={field.value}
                                                    onChange={(dates) => field.onChange(dates)}
                                                    options={{
                                                        mode: 'range',
                                                        dateFormat: 'd-m-Y',
                                                        allowInput: true,
                                                        defaultDate: [new Date(), new Date()],
                                                        disableMobile: true,
                                                        onReady: (_, __, instance) => mountMonthDropdown(instance)
                                                    }}
                                                    className="form-control DateRangePickerStaticTop"
                                                    placeholder="Select date range"
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="filter-footer">
                                <button type="button" className="btn-new" onClick={onReset}>
                                    Reset
                                </button>
                                <button
                                    type="button"
                                    className="btn-new btn-new-bg searchBtn-cm"
                                    id="calendarFilterSearchBtn"
                                    onClick={handleSubmit(onSubmit, (errors: any) => {
                                        console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                    })}
                                >
                                    Search
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );

    const searchToggleBtn = (
        <button
            type="button"
            className="btn hover-link input-icon-1 mobile-search-btn icon-hover-effect"
            onClick={() => setIsResponsiveSearch(!isResponsiveSearch)}
        >
            <InteractiveIcon
                defaultIcon={searchIcon}
                hoverIcon={searchIconHover}
                activeIcon=""
                isActive={false}
                alt=""
                className="interactive-icon hover-image"
                renderAs="img"
                tooltip="Search"
                customStyle={{
                    width: '20px',
                    height: '20px',
                }}
            />
        </button>
    );

    const sidebarToggleBtn = (
        <button
            className="btn hover-link calendar-mobile-header__menu-btn"
            style={{ minWidth: "24px", height: "24px" }}
            type="button"
            onClick={toggleSidebarHandler}
        >
            <InteractiveIcon
                defaultIcon={isSidebarExpandedMobile ? sidebarcloseIcon : sidebaropenIcon}
                hoverIcon={isSidebarExpandedMobile ? sidebarcloseHoverIcon : sidebaropenHoverIcon}
                activeIcon=""
                isActive={false}
                alt="Toggle Sidebar"
                className="interactive-icon hover-image"
                renderAs="img"
                tooltip="Toggle Menu"
            />
        </button>
    );

    const viewDropdown = (
        <div className="form-group recurrence-div mb-0 calendar-mobile-header__view" id="calendarViewDropdownSectionMobile">
            <Select2Wrapper
                value={calendarView}
                onChange={(value) => {
                    changeView(value as CalendarView);
                }}
                options={CALENDAR_VIEW_OPTIONS}
                typeable={false}
                placeholder="Select one"
                isMulti={false}
            />
        </div>
    );

    if (!isDesktop) {
        return (
            <>
                <div className="calendar-mobile-header">
                    <div className="calendar-mobile-header__top">
                       <div className="d-flex">
                         {sidebarToggleBtn}
                        <div
                            id="calendar-title"
                            className="fc-toolbar-title calendar-mobile-header__title"
                            onClick={toggleSidebarCalendar}
                        >
                            {calendarTitle}
                        </div>
                       </div>
                        <div className="calendar-mobile-header__top-actions">
                            {searchToggleBtn}
                            <div className="calendar-mobile-header__profile-spacer" aria-hidden="true" />
                        </div>
                    </div>

                    <div className="calendar-mobile-header__controls">
                        <button id="btnToday" className="btn-new fc-today-button" onClick={goToday}>
                            Today
                        </button>
                        <div className="calendar-mobile-header__nav">
                            <button id="btnPrev" className="fc-icon-chevron-left btn-new icon-hover-effect" onClick={goPrev} />
                            <button id="btnNext" className="fc-icon-chevron-right btn-new icon-hover-effect" onClick={goNext} />
                        </div>
                        {viewDropdown}
                    </div>

                    {/* {calendarView === "dayGridMonth" && (
                        <div className="calendar-mobile-header__weekdays" aria-hidden="true">
                            {WEEKDAY_LABELS.map((day, index) => (
                                <span key={`${day}-${index}`}>{day}</span>
                            ))}
                        </div>
                    )} */}
                </div>
                {searchPanel}
            </>
        );
    }

    return (
        <>
            <div className="d-flex align-items-center">
                <div className="btn-group">
                    <button id="btnToday" className="btn-new fc-today-button me-3" onClick={goToday}>
                        Today
                    </button>
                    <div className="d-flex align-items-center me-3">
                        <button id="btnPrev" className="fc-icon-chevron-left btn-new icon-hover-effect" onClick={goPrev} />
                        <button id="btnNext" className="fc-icon-chevron-right btn-new icon-hover-effect" onClick={goNext} />
                    </div>
                    <div id="calendar-title" className="fc-toolbar-title" onClick={toggleSidebarCalendar}>
                        {calendarTitle}
                    </div>
                </div>
            </div>
            <div className="d-flex align-items-center justify-content-between w-100">
                {searchPanel}
            </div>
        </>
    )
}

export default CalendarHeader;