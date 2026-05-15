import { useCalendar } from "@context/CalendarContext";
import { useCalendarFilterForm } from "../../../../hooks/useCalendarFilterForm";
import { Controller } from 'react-hook-form';
import Flatpickr from 'react-flatpickr';
import searchIcon from "@images/search-icon.svg";
import btnCloseIcon from "@images/btn-close-icon.svg";
import btnCloseIconHover from "@images/btn-close-icon-hover.svg";
import functionIcon from "@images/function-icon.svg";
import functionIconHover from "@images/function-icon-hover.svg";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import dateIcon from "@images/date-icon-16.svg";
import Select2Wrapper from "../../form/Select2Wrapper";
import { filterEvents, getAllSearchEventList, searchEvent } from "@services/calendar/calendarService";
import type { CalendarFilterFormValues } from "./calendarFilterForm.schema";
import { useEffect, useState } from "react";
import { useContacts } from "@context/ContactsContext";
import CalendarEventRow from "../CalendarEventRow";
import { useDebounce } from "@hooks/useDebounce";
import type { Response } from "@models/Response";
import { useRef } from "react";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { showError } from "@components/ui/toast/toastNotification";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";
import { useScreen } from "@context/ScreenContext";

function CalendarHeader() {
    const { goPrev, goNext, goToday, calendarTitle, mainCalendarRef, searchText, setSearchText, searchResults, setSearchResults, noResult, setNoResult, isSearchResultDropdownOpen, setIsSearchResultDropdownOpen, resetSearchState } = useCalendar();
    const { control, handleSubmit, reset, getValues, setValue } = useCalendarFilterForm();
    const { isDesktop } = useScreen();
    const { contacts } = useContacts();
    const [isCalendarFilterDropdownOpen, setIsCalendarFilterDropdownOpen] = useState(false);
    const { setCalendarAllSearchedEvents, setIsCalendarAllSearchActive, isSidebarCalendarOpen, setIsSidebarCalendarOpen } = useCalendar();
    const debouncedSearchText = useDebounce(searchText, 1000);

    const startFromMonth = new Date().getMonth();
    const mountMonthDropdown = useFlatpickrMonthDropdown(startFromMonth);

    const toggleCalendarFilterDropdown = () => {
        setIsCalendarFilterDropdownOpen(!isCalendarFilterDropdownOpen);
    };

    const searchDropdownRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            const headerComponent = target.closest('.mail-details-header');
            const flatpickrCalendar = target.closest('.flatpickr-calendar');
            const flatpickrInput = target.closest('.DateRangePickerStaticTop');

            // Only close dropdowns if clicking outside the entire header component, flatpickr calendar, and flatpickr input
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
        if (!debouncedSearchText.trim()) {
            setSearchResults([]);
            setNoResult(false);
            return;
        }

        const controller = new AbortController();

        const searchEmails = async () => {
            try {
                const response: Response = await searchEvent(
                    {
                        searchText: debouncedSearchText,
                    }
                );

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
                    setCalendarAllSearchedEvents(response.data.allEvents || []);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("Search failed:", err);
                }
            }
        };

        searchEmails();

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

            //here any of one value should be fill if not filled up showError
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
                // If no date range is provided, use current month's start and end dates
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
        }else{
            setIsSidebarCalendarOpen(true);
        }
    };

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
                <div className="top-search">
                    <div className="top-search-container">
                        <div className="input-icon-add">
                            <div className="form-group input-big t-search-group inbox-more mb-0">
                                <img src={searchIcon} alt="" className="input-icon-1" />
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
                            {searchText.length > 0 && (
                                <button
                                    type="button"
                                    className="btn-new hover-link clearSearchBtn-cm"
                                    onClick={() => {
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
            </div>
        </>
    )
}

export default CalendarHeader;