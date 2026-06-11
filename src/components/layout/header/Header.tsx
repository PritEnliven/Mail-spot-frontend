import searchIcon from "@images/search-icon.svg";
import srearchIconHover from "@images/search-icon-hover.svg";
import btnCloseIcon from "@images/btn-close-icon.svg";
import btnCloseIconHover from "@images/btn-close-icon-hover.svg";
import closeIcon from '@images/close-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import functionIcon from "@images/function-icon.svg";
import functionIconHover from "@images/function-icon-hover.svg";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import logoutIcon from "@images/logout-icon.svg";
import logoutIconHover from "@images/logout-icon.svg";
import changePasswordIcon from "@images/change-password-icon.svg";
import changePasswordIconHover from "@images/change-password-icon-hover.svg";
import changePasswordNewIcon from "@images/change-password-new-icon.svg";
import changePasswordNewIconHover from "@images/change-password-new-icon-hover.svg";
import enlivenLogo from "@images/enliven-logo.svg";
import dateIcon from "@images/date-icon-16.svg";
import backBtnIcon from "@images/back-btn-icon.svg";
import backBtnIconHover from "@images/back-btn-icon-hover.svg";
import navCollapseIconHover from "@images/nav-collepse-icon-hover-2.svg";
import menuIcon from "@images/menu-icon.svg";
import { useContacts, useMailData, useMailUI } from '../../../context/index';
import { lazy, Suspense, useState, useEffect, useRef } from "react";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import { Controller } from 'react-hook-form';
import { useFilterEmailForm } from "@hooks/useFilterEmailForm";
const Flatpickr = lazy(() => import('react-flatpickr'));
import { useNavigate } from "react-router-dom";
import { getSingleEmailService, searchAndFilterEmailService, filterEmailAndCreateRuleService } from "@services/email/emailService";
import type { FilterEmailFormValues } from "./filterEmailForm.schema";
import { useDebounce } from "@hooks/useDebounce";
const SearchEmailRow = lazy(() => import("./SearchEmailRow"));
const CalendarHeader = lazy(() => import("@components/ui/calendar/calendarHeader/CalendarHeader"));
import { useCalendar, type CalendarView } from "@context/CalendarContext";
import { getUserDetail } from "@services/user/userService";
import { useProfile } from "@context/userContext";
import { useMailSelection } from "@context/MailSelectionContext";
const CreateRuleForm = lazy(() => import("@components/layout/header/createRuleForm/CreateRuleForm"));
import type { CreateRuleFormValues } from "./createRuleForm/CreateRuleForm.schema";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";
import { Dropdown } from 'react-bootstrap';
import { verifyBoxName } from "@utils/emailUtil";
import { ATTACHMENT_SIZE_OPTIONS, attachmentSizeLabelToApiType } from "@constants/attachmentSizeOptions";
import { buildSearchFilterPayload, getAppliedFilterCount } from "@utils/filterUtil";
import { buildSearchQueryFromFilters, parseFilterQueryToFormValues } from "@utils/searchQueryUtil";
import { useScreen } from "@context/ScreenContext";

const Header = () => {
    const navigate = useNavigate();
    const { profileName, setProfileName, profileEmail, setProfileEmail, profileInitial, setProfileInitial } = useProfile();
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebounce(searchText, 1000);
    const { openModal, closeModal, activeModals, setToolbarState, setIsMailListOpen, isSidebarExpandedMobile, setIsSidebarExpandedMobile, setActiveBoxId } = useMailUI();
    const { setAllSearchResult, setEmails, setPagination,
        setSearchTerm, setFilterForm, setTotalEmailBadge,
        setBoxTitle, filterForm, boxName, boxTitle, searchTerm, allSearchResult,
        setEmailDetailSelected, setActiveEmailMessageId,
        headerSearchResults: searchResults, setHeaderSearchResults: setSearchResults,
        clearMailSearch, mailSearchResetKey } = useMailData();
    const { contacts, fetchContacts } = useContacts();
    const { calendarView, setCalendarView, changeView } = useCalendar();
    const [noResult, setNoResult] = useState(false);
    const { setSelectedEmails } = useMailSelection();
    const [isSearchResultDropdownOpen, setIsSearchResultDropdownOpen] = useState(false);
    const { isDesktop } = useScreen();
    const prevDebouncedSearchRef = useRef(debouncedSearchText);
    const allowSearchDropdownRef = useRef(true);

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const {
        control,
        handleSubmit,
        getValues,
        reset,
    } = useFilterEmailForm();

    // SEARCH EFFECT (debounced) — only restore mailbox when user clears a non-empty search string
    useEffect(() => {
        const trimmedSearchText = searchText.trim();
        const previousSearch = prevDebouncedSearchRef.current.trim();
        const currentSearch = debouncedSearchText.trim();
        prevDebouncedSearchRef.current = debouncedSearchText;

        // Ignore stale debounced value while input is already cleared (e.g. first click on remove icon)
        if (!trimmedSearchText && currentSearch) {
            return;
        }

        if (!currentSearch) {
            // Debounce can lag behind — don't clear if user already started a new query
            if (trimmedSearchText) {
                return;
            }

            setSearchResults([]);
            setNoResult(false);

            if (previousSearch) {
                if (filterForm) {
                    void clearMailSearch({ preserveFilter: true });
                } else if (allSearchResult || searchTerm || boxTitle === 'Search Results') {
                    void clearMailSearch();
                }
            }
            return;
        }

        if (filterForm && getAppliedFilterCount(filterForm) > 0) {
            return;
        }

        const controller = new AbortController();

        const searchEmails = async () => {
            try {
                setSearchTerm(debouncedSearchText);
                const response = await searchAndFilterEmailService(
                    buildSearchFilterPayload({
                        searchText: debouncedSearchText,
                        filterForm,
                        limit: 5,
                    })
                );

                if (response?.statusCode === 200) {
                    if (allowSearchDropdownRef.current) {
                        setIsSearchResultDropdownOpen(true);
                    }
                    if (response.data.emailList.length === 0) {
                        setNoResult(true);
                        setSearchResults([]);
                    }
                    else {
                        setNoResult(false);
                        setSearchResults(response.data.emailList || []);
                    }
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("Search failed:", err);
                }
            }
        };

        searchEmails();

        return () => controller.abort();
    }, [debouncedSearchText, searchText, searchTerm, allSearchResult, boxTitle, clearMailSearch, filterForm, setSearchTerm]);

    const toggleMobileSidebar = () => {
        setIsSidebarExpandedMobile(!isSidebarExpandedMobile);
    }

    const onSubmit = async (data: FilterEmailFormValues) => {
        setAllSearchResult(true);
        setSearchTerm('');
        setFilterForm(data);

        const displayQuery = buildSearchQueryFromFilters(data);
        setSearchText(displayQuery);
        prevDebouncedSearchRef.current = displayQuery;

        const payload = buildSearchFilterPayload({
            filterForm: data,
            limit: 25,
            direction: 'next',
            vPage: 1,
        });

        try {
            const response = await searchAndFilterEmailService(payload);
            if (response?.statusCode === 200) {
                setIsFilterDropdownOpen(false);
                setIsSearchResultDropdownOpen(false);
                setSearchResults([]);
                setNoResult(false);

                setEmails(response.data.emailList);
                setPagination(response.data.pagination);
                setTotalEmailBadge(response.data.pagination.totalEmails);
                setBoxTitle("Filtered Results");
            }
        } catch (err) {
            console.error('Filter failed:', err);
        }
    };

    const handleOnSubmitForCreateRule = async (data: CreateRuleFormValues) => {
        const currentFormValues = getValues();
        const payload: any = {
            ...currentFormValues,
            createRule: true,
            actions: data
        }

        let dateRangeStr: string | undefined = undefined;
        if (payload.dateRange && Array.isArray(payload.dateRange)) {
            const dates = payload.dateRange
                .filter((d: any) => d instanceof Date)
                .map((d: Date) => d.toISOString().split('T')[0]);

            if (dates.length === 1) {
                dateRangeStr = dates[0];
            } else if (dates.length > 1) {
                dateRangeStr = `${dates[0]} to ${dates[1]}`;
            }
        }

        payload.dateRange = dateRangeStr;

        if (payload.attachmentSize) {
            payload.attachmentSizeType = attachmentSizeLabelToApiType(payload.attachmentSize);
            delete payload.attachmentSize;
        }

        const response = await filterEmailAndCreateRuleService(payload);
        if (response?.emailList?.length > 0) {
            showSuccess('Rule created successfully');
            setIsCreateRuleModalOpen(false);
            reset();
            setIsFilterDropdownOpen(false);
        }
    };

    const handleCreateRuleModal = () => {
        const currentFormValues = getValues(); // This gets all form values from react-hook-form

        if (!currentFormValues || Object.keys(currentFormValues).length === 0) {
            showError('Please set at least one filter condition before creating a rule');
            return;
        }

        const isAnyFilterFilled = Object.values(currentFormValues).some(value => {
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            // Check if value is a string and not empty
            if (typeof value === 'string') {
                return value.trim() !== '';
            }
            // For boolean values, check if they are true
            if (typeof value === 'boolean') {
                return value === true;
            }
            return false;
        });

        if (!isAnyFilterFilled) {
            showError('Please set at least one filter condition before creating a rule');
            return;
        }
        setIsFilterDropdownOpen(false);
        setIsSearchResultDropdownOpen(false);
        setIsCreateRuleModalOpen(true);
    };

    const handleCreateRuleModalReset = () => {
        setIsCreateRuleModalOpen(false);
        setIsFilterDropdownOpen(true);
    };

    const showAllSearchResult = async () => {
        setAllSearchResult(true);
        const hasActiveFilters = filterForm && getAppliedFilterCount(filterForm) > 0;
        setSearchTerm(hasActiveFilters ? '' : searchText);

        if (boxName.toLocaleLowerCase().includes('schedule')) {
            navigate('/mail/INBOX');
        }

        const response = await searchAndFilterEmailService(
            buildSearchFilterPayload({
                searchText,
                filterForm,
                limit: 25,
                direction: 'next',
                vPage: 1,
            })
        );
        if (response.statusCode === 200) {
            setEmails(response.data.emailList);
            setPagination(response.data.pagination);
            setIsSearchResultDropdownOpen(false);
            setNoResult(false);
            setTotalEmailBadge(response.data.pagination.totalEmails);
            setBoxTitle(filterForm ? 'Filtered Results' : 'Search Results');
        }
    };

    const openEmailDetailHandler = async (
        currentActiveBox: string,
        uid: number,
        messageId: string,
        isSearch: boolean,
        mongoId?: string
    ) => {
        try {
            if (isSearch) {
                allowSearchDropdownRef.current = false;
                setIsSearchResultDropdownOpen(false);
                await showAllSearchResult();
            }

            const payload = {
                current_active_box: currentActiveBox,
                uid,
                messageId,
                isSearch,
                ...(mongoId ? { id: mongoId } : {}),
            };

            let data = await getSingleEmailService(payload);

            if (data.isScheduled) {
                data.emailList.isSchedule = true;
            }
            if (isSearch) {
                data.emailList.isSearchEmail = true;
                setSearchTerm(searchText);
            }

            if (!isDesktop) {
                setIsMailListOpen(false);
            }

            setEmailDetailSelected(data.emailList);
            setSelectedEmails(new Set([messageId]));
            setActiveEmailMessageId(messageId);
            setActiveBoxId('');

            const isRead = data.emailList.isSeen;
            setToolbarState({
                showBack: !isDesktop,
                showSelectAll: isDesktop,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !isRead,
                showMarkAsUnread: isRead,
                showMove: true,
            });
            setIsSearchResultDropdownOpen(false);
        } catch (error) {
            console.error('Failed to fetch email detail', error);
        }
    };

    const handleReset = () => {
        reset({
            from: [],
            to: [],
            subject: '',
            attachmentSize: undefined,
            dateRange: [],
        });
        setIsFilterDropdownOpen(false);
        setIsSearchResultDropdownOpen(false);
        void clearMailSearch();
    };

    const openChangeImapSmtpPasswordModal = async () => {
        const response = await getUserDetail(profileEmail);
        if (response?.statusCode === 200) {
            const userData = {
                imapPassword: response.data.imapPassword,
                imapServer: response.data.imapHost,
                imapPort: response.data.imapPort,
                imapSecurityType: response.data.imapSecureType,
                smtpPassword: response.data.smtpPassword,
                smtpServer: response.data.smtpHost,
                smtpPort: response.data.smtpPort,
                smtpSecurityType: response.data.smtpSecureType,
                smtpHost: response.data.smtpHost
            }
            //check if changePassword modal is open then close it
            const changePasswordModal = activeModals.find((modal) => modal.type === 'changePassword');
            if (changePasswordModal) {
                closeModal(changePasswordModal.id);
            }
            openModal('changeImapSmtpPassword', userData)
        }
    }

    const openChangePasswordModal = () => {
        openModal('changePassword')
    }

    const { totalEmailBadge, readUnreadFilter } = useMailData();

    const toggleFilterDropdown = () => {
        if (isFilterDropdownOpen) {
            setIsFilterDropdownOpen(false);
            return;
        }

        const parsed = parseFilterQueryToFormValues(searchText);
        reset({
            from: parsed.from ?? [],
            to: parsed.to ?? [],
            subject: parsed.subject ?? '',
            attachmentSize: parsed.attachmentSize,
            dateRange: parsed.dateRange ?? [],
        });
        setIsFilterDropdownOpen(true);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            const headerComponent = target.closest('.mail-details-header');
            const flatpickrCalendar = target.closest('.flatpickr-calendar');

            const filterDropdown = document.getElementById('filterEmailFormSection');
            const isInsideFilterDropdown = !!filterDropdown && filterDropdown.contains(target);

            const searchDropdown = document.getElementById('searchEmailDropdown1');
            const isInsideSearchDropdown = !!searchDropdown && searchDropdown.contains(target);

            if (flatpickrCalendar) return;

            if (isFilterDropdownOpen && !isInsideFilterDropdown) {
                setIsFilterDropdownOpen(false);
                setAllSearchResult(false);
            }

            if (isSearchResultDropdownOpen && !isInsideSearchDropdown && !headerComponent) {
                setIsSearchResultDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isFilterDropdownOpen, isSearchResultDropdownOpen]);

    useEffect(() => {
        // Load profile data from localStorage on component mount
        const storedName = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');

        if (storedName) {
            setProfileName(storedName);
            const initial = storedName.charAt(0).toUpperCase();
            setProfileInitial(initial);
        }
        if (storedEmail) {
            setProfileEmail(storedEmail);
        }

    }, []);

    // Clear header search UI when search is reset (e.g. switching mailbox tabs).
    useEffect(() => {
        if (mailSearchResetKey === 0) return;

        setSearchResults([]);
        setIsSearchResultDropdownOpen(false);
        setNoResult(false);
        if (filterForm) {
            const displayQuery = buildSearchQueryFromFilters(filterForm);
            setSearchText(displayQuery);
            prevDebouncedSearchRef.current = displayQuery;
        } else {
            setSearchText("");
            reset({
                from: [],
                to: [],
                subject: '',
                attachmentSize: undefined,
                dateRange: [],
            });
        }
    }, [mailSearchResetKey, filterForm]);

    const resetSearch = () => {
        allowSearchDropdownRef.current = false;
        prevDebouncedSearchRef.current = '';
        if (filterForm) {
            void clearMailSearch({ preserveFilter: true });
        } else {
            void clearMailSearch();
        }
    }

    const closeProfileModalMobile = () => {

    }

    const isCalendar = verifyBoxName(boxName, "calendar");
    const isSettings = verifyBoxName(boxName, "settings");

    const mountFilterMonthDropdown = useFlatpickrMonthDropdown(0);
    const [isResponsiveSearch, setIsResponsiveSearch] = useState(false);
    const appliedFilterCount = getAppliedFilterCount(filterForm);

    return (
        <div className={`mail-details-header `}>
            {isCalendar ? (
                <Suspense fallback={null}>
                    <CalendarHeader />
                </Suspense>
            ) : (
                <>
                    <div className="d-flex align-items-center">
                        {/* moblie */}
                        <button
                            className="btn hover-link nav-collepse-button-mobile me-2"
                            type="button" onClick={toggleMobileSidebar}
                        >
                            <InteractiveIcon
                                defaultIcon={isSidebarExpandedMobile ? navCollapseIconHover : menuIcon}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip=""
                            />
                        </button>
                        {/* LEFT: Dynamic header section */}
                        <div className="d-flex align-items-center two-sc-in" id="dynamicHeaderSection">
                            <h2 className="box-title" id="boxTitle">{boxTitle}</h2>
                            {!isSettings && totalEmailBadge > 0 && readUnreadFilter !== 'read' && (
                                <span className="badge" id="boxBadge">{totalEmailBadge}</span>
                            )}
                        </div>
                    </div>

                    {!isSettings && (
                        <>
                            {/* CENTER: Search Bar */}
                            <div className="two-sc-in d-flex align-items-center justify-content-center flex-grow-1">
                                <div className={`top-search ${isResponsiveSearch ? 'show-search' : ''}`} id="topSearch">
                                    <div className="top-search-container">
                                        <div className="input-icon-add">
                                            <div className="form-group input-big t-search-group inbox-more mb-0">
                                                <img src={searchIcon} alt="Search" className="input-icon-1 search-icon" />
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
                                                    className="form-control dropdown-toggle navTopSearchDropdown-cm top-search-form-control"
                                                    placeholder="Search..."
                                                    id="navTopSearchDropdown1"
                                                    autoComplete="off"
                                                    aria-expanded="false"
                                                    value={searchText}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setSearchText(value);
                                                        if (value.trim()) {
                                                            allowSearchDropdownRef.current = true;
                                                            setIsSearchResultDropdownOpen(true);
                                                        }
                                                    }}
                                                    onFocus={() => setIsSearchResultDropdownOpen(true)}
                                                />

                                                <div
                                                    className={`dropdown-menu dropdown-menu-end t-search-dropdown-menu more-list white-scroll-bar searchEmailDropdown-cm t-search-dropdown-menu-home-action ${isSearchResultDropdownOpen ? 'show' : ''}`}
                                                    id="searchEmailDropdown1"
                                                    aria-labelledby="navTopSearchDropdown1"
                                                    data-simplebar
                                                    data-simplebar-auto-hide="false"
                                                >
                                                    <ul>
                                                        {searchResults.length > 0 ? (
                                                            searchResults.map((email) => (
                                                                <Suspense key={email.uid} fallback={null}>
                                                                    <SearchEmailRow
                                                                        key={email.uid}
                                                                        email={email}
                                                                        searchTerm={searchText}
                                                                        onEmailClick={(email, isSearch = true) =>
                                                                            openEmailDetailHandler(boxName, email.uid, email.messageId, isSearch, (email as { _id?: string })._id)
                                                                        }
                                                                    />
                                                                </Suspense>
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
                                                                        Type to search emails...
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )}
                                                    </ul>
                                                    {searchResults.length > 0 && (
                                                        <div className="all-search-result-show" onClick={showAllSearchResult}>
                                                            <div className="d-flex align-items-center justify-content-strat">
                                                                <img src={searchIcon} className="me-2" alt="" width={18} height={18} />
                                                                <div className="subject">All search results for <span className="all-search-result" id="searchQuery">'{searchText}'</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Search filters */}
                                        <div className="top-filter inbox-more">
                                            <div className="top-filter__actions">
                                                {searchText.length > 0 && (
                                                    <button type="button" className="btn-new hover-link clearSearchBtn-cm" onClick={() => resetSearch()}>
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

                                                <button type="button"
                                                    className={`btn btnic btn-grey dropdown-toggle t-filter-btn hover-link search-d-Btn-cm${appliedFilterCount > 0 ? ' t-filter-btn--with-badge' : ''}`}
                                                    onClick={toggleFilterDropdown}
                                                    aria-expanded={isFilterDropdownOpen}
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
                                                    {appliedFilterCount > 0 && (
                                                        <span className="filter-applied-badge" aria-label={`${appliedFilterCount} filters applied`}>
                                                            {appliedFilterCount}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Filter dropdown */}
                                            <div id="filterEmailFormSection" className={`dropdown-menu dropdown-menu-end t-filter-dropdown-menu more-list ${isFilterDropdownOpen ? 'show' : ''}`}>
                                                <form id="filterEmailForm">
                                                    <div className="filter-body">
                                                        <div className="form-group form-row select2-profile">
                                                            <label className="control-label">From</label>
                                                            <Controller
                                                                name="from"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select2Wrapper
                                                                        value={field.value || []}
                                                                        onChange={field.onChange}
                                                                        options={contacts}
                                                                        placeholder="Select or type to add"
                                                                        isMulti={true}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="form-group form-row select2-profile">
                                                            <label className="control-label">To</label>
                                                            <Controller
                                                                name="to"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <Select2Wrapper
                                                                        value={field.value || []}
                                                                        onChange={field.onChange}
                                                                        options={contacts}
                                                                        placeholder="Select or type to add"
                                                                        isMulti={true}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="form-group form-row">
                                                            <label className="control-label">Subject</label>
                                                            <Controller
                                                                name="subject"
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <input
                                                                        type="text"
                                                                        id="filterSubject"
                                                                        className="form-control"
                                                                        {...field}
                                                                    />
                                                                )}
                                                            />
                                                        </div>

                                                        <div className="form-group form-row">
                                                            <label className="control-label">Attachment Size</label>
                                                            <div className="input-control">
                                                                <Controller
                                                                    name="attachmentSize"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Select2Wrapper
                                                                            value={field.value || null}
                                                                            onChange={field.onChange}
                                                                            options={[
                                                                                { label: "Select one", value: "" },
                                                                                ...ATTACHMENT_SIZE_OPTIONS.map((opt) => ({
                                                                                    label: opt.label,
                                                                                    value: opt.value,
                                                                                })),
                                                                            ]}
                                                                            placeholder="Select one"
                                                                            isMulti={false}
                                                                        />
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="form-group">
                                                            <label className="control-label">Date</label>
                                                            <div className="input-icon-add">
                                                                <img src={dateIcon} alt="" className="input-icon-1" />
                                                                <Controller
                                                                    name="dateRange"
                                                                    control={control}
                                                                    render={({ field }) => (
                                                                        <Suspense fallback={<input className="form-control" placeholder="Loading date picker..." readOnly />}>
                                                                            <Flatpickr
                                                                                value={field.value as Date[] | undefined}
                                                                                onChange={(dates) => field.onChange(dates)}
                                                                                options={{
                                                                                    mode: 'range',
                                                                                    dateFormat: 'd-m-Y',
                                                                                    allowInput: true,
                                                                                    defaultDate: [new Date(), new Date()],
                                                                                    onReady: (_, __, instance) => mountFilterMonthDropdown(instance)
                                                                                }}
                                                                                className="form-control DateRangePickerStaticTop"
                                                                                placeholder="Select date range"
                                                                            />
                                                                        </Suspense>
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="filter-footer">
                                                        <button type="button" className="btn-new " onClick={handleReset}>Reset</button>
                                                        <div className="d-flex align-items-center">
                                                            <button type="button" className="btn-new search-create-filter me-2"
                                                                id="createRuleBtn" onClick={handleCreateRuleModal}>Create Filter</button>
                                                            <button type="button" className="btn-new btn-new-bg searchBtn-cm" onClick={handleSubmit((data) => onSubmit(data),
                                                                (errors) => {
                                                                    console.log('Form validation errors:', errors)
                                                                })}>Search</button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>

                                            {/*Create Rule Form */}
                                            <Suspense fallback={null}>
                                                <CreateRuleForm isModalOpen={isCreateRuleModalOpen} onReset={handleCreateRuleModalReset} submitForm={(data) => handleOnSubmitForCreateRule(data)} />
                                            </Suspense>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </>
            )}

            {/* RIGHT: Profile & Calendar */}
            <div className="d-flex align-items-center two-sc-in justify-content-end">
                {/* Mobile-serch-btn */}
                <button type="button" className="btn hover-link input-icon-1 mobile-search-btn icon-hover-effect ms-3 me-2" onClick={() => setIsResponsiveSearch(!isResponsiveSearch)} >
                    <InteractiveIcon
                        defaultIcon={searchIcon}
                        hoverIcon={srearchIconHover}
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
                {isCalendar && (
                    <div className="form-group recurrence-div mb-0 me-3" id="calendarViewDropdownSection">
                        <Select2Wrapper
                            value={calendarView}
                            onChange={(value) => {
                                const view = value as CalendarView;
                                setCalendarView(view);
                                changeView(view);
                            }}
                            options={[
                                { label: "Month", value: "dayGridMonth" },
                                { label: "Week", value: "timeGridWeek" },
                                { label: "Day", value: "timeGridDay" }
                            ]}
                            typeable={false}
                            placeholder="Select one"
                            isMulti={false}
                        />
                    </div>
                )}

                <Dropdown className="mail-profile-dropdown">
                    <Dropdown.Toggle className="btn btn-secondary dropdown-toggle d-flex align-items-center">
                        <div className="d-block" id="profileBox">
                            <span className="mail-profile-name d-block text-end" id="profileName"> {profileName}</span>
                            <span className="mail-profile-id d-block text-end" id="profileEmail"> {profileEmail}</span>
                        </div>
                        <span className="mail-profile-label" id="profileInitial">
                            {profileInitial}
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-menu dropdown-menu-lg-end mail-profile-box p-0">
                        <button className="mail-profile-close-btn-mobile btn icon-hover-effect" onClick={closeProfileModalMobile}>
                            <InteractiveIcon
                                defaultIcon={closeIcon}
                                hoverIcon={closeIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image"
                                renderAs="img"
                                tooltip=""
                            />
                        </button>
                        <div className="profile-sec-new-box">
                            <div className="profile-sec-people">
                                <div className="profile-sec-people-sub">
                                    <div className="profile-sec-image mb-3" id="profileInitial1">
                                        {profileInitial}
                                    </div>
                                    <span className="profile-sec-people-sub-mail-profile-name d-block text-center"
                                        id="profileName1"> {profileName}</span>
                                    <span className="profile-sec-people-sub-mail-profile-id d-block copy-text text-center"
                                        id="profileEmail1"> {profileEmail}</span>
                                </div>
                            </div>
                            <ul className="profile-link-list">
                                <li className="profile-link-items">
                                    <a href="javascript:;" className="profile-link hover-link" onClick={openChangeImapSmtpPasswordModal}>
                                        <InteractiveIcon
                                            defaultIcon={changePasswordNewIcon}
                                            hoverIcon={changePasswordNewIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip=""
                                        />Change IMAP/SMTP Configuration</a>
                                </li>
                                <li className="profile-link-items">
                                    <a href="javascript:;" className="profile-link hover-link" onClick={openChangePasswordModal}>
                                        <InteractiveIcon
                                            defaultIcon={changePasswordIcon}
                                            hoverIcon={changePasswordIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip=""
                                        />Change password</a>
                                </li>
                                <li className="profile-link-items">
                                    <a href="javascript:;" className="profile-link hover-link" onClick={handleLogout}>
                                        <InteractiveIcon
                                            defaultIcon={logoutIcon}
                                            hoverIcon={logoutIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt=""
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip=""
                                        />Logout</a>
                                </li>
                            </ul>
                            <div className="profile-footer d-flex align-items-center justify-content-between">
                                <span className="mailspot-version-number">V 1.0</span>
                                <span className="powered-sec">
                                    Powered by
                                    <a href="javascript:;" className="ms-2">
                                        <img src={enlivenLogo} alt="" />
                                    </a>
                                </span>
                            </div>
                        </div>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </div>
    );
};

export default Header;
