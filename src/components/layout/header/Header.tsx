import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import { useFlatpickrMonthDropdown } from "@components/ui/useFlatpickrMonthDropdown";
import { ATTACHMENT_SIZE_OPTIONS, attachmentSizeLabelToApiType } from "@constants/attachmentSizeOptions";
import { useCalendar, type CalendarView } from "@context/CalendarContext";
import { useScreen } from "@context/ScreenContext";
import { useProfile } from "@context/userContext";
import { AUTH_STORAGE_KEYS } from "@features/login/Login";
import { useDebounce } from "@hooks/useDebounce";
import { useFilterEmailForm } from "@hooks/useFilterEmailForm";
import backBtnIconHover from "@images/back-btn-icon-hover.svg";
import backBtnIcon from "@images/back-btn-icon.svg";
import btnCloseIconHover from "@images/btn-close-icon-hover.svg";
import btnCloseIcon from "@images/btn-close-icon.svg";
import changePasswordIconHover from "@images/change-password-icon-hover.svg";
import changePasswordIcon from "@images/change-password-icon.svg";
import changePasswordNewIconHover from "@images/change-password-new-icon-hover.svg";
import changePasswordNewIcon from "@images/change-password-new-icon.svg";
import closeIconHover from '@images/close-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import dateIcon from "@images/date-icon-16.svg";
import enlivenLogo from "@images/enliven-logo.svg";
import functionIconHover from "@images/function-icon-hover.svg";
import functionIcon from "@images/function-icon.svg";
import { default as logoutIcon, default as logoutIconHover } from "@images/logout-icon.svg";
import searchIconHover from "@images/search-icon-hover.svg";
import searchIcon from "@images/search-icon.svg";
import sidebaropenIcon from "@images/side-bar-open-icon.svg"
import sidebaropenHoverIcon from "@images/side-bar-open-hover-icon.svg"
import sidebarcloseIcon from "@images/side-bar-close-icon.svg"
import sidebarcloseHoverIcon from "@images/side-bar-close-hover-icon.svg"
import { filterEmailAndCreateRuleService, getSingleEmailService, searchAndFilterEmailService } from "@services/email/emailService";
import { getUserDetail } from "@services/user/userService";
import { logoutUser } from "@services/login/loginService";
import { getSocket, disconnectSocket } from "@services/socket/socket";
import { formatDate, TimeFormat } from "@utils/dateUtil";
import { verifyBoxName } from "@utils/emailUtil";
import { areFilterFormsEqual, buildSearchFilterPayload } from "@utils/filterUtil";
import { buildDisplaySearchQuery, resolveSearchFromQuery } from "@utils/searchQueryUtil";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from 'react-bootstrap';
import { Controller } from 'react-hook-form';
import { useNavigate } from "react-router-dom";
import { useContacts, useMailData, useMailUI } from '../../../context/index';
import { clearAccountSession } from "@context/AccountContext";
import type { CreateRuleFormValues } from "./createRuleForm/CreateRuleForm.schema";
import type { FilterEmailFormValues } from "./filterEmailForm.schema";
const Flatpickr = lazy(() => import('react-flatpickr'));
const SearchEmailRow = lazy(() => import("./SearchEmailRow"));
const CalendarHeader = lazy(() => import("@components/ui/calendar/calendarHeader/CalendarHeader"));
const CreateRuleForm = lazy(() => import("@components/layout/header/createRuleForm/CreateRuleForm"));
const AccountSwitcher = lazy(() => import("@components/ui/AccountSwitcher/AccountSwitcher"));

const Header = () => {
    const navigate = useNavigate();
    const { profileName, setProfileName, profileEmail, setProfileEmail, profileInitial, setProfileInitial } = useProfile();
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const debouncedSearchText = useDebounce(searchText, 1000);
    // const { openModal, closeModal, activeModals, setToolbarState, setIsMailListOpen, isSidebarExpandedMobile, setIsSidebarExpandedMobile, setActiveBoxId, isSidebarOpen  } = useMailUI();
    const {
        openModal,
        closeModal,
        activeModals,
        setToolbarState,
        setIsMailListOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarExpandedMobile,
        setIsSidebarExpandedMobile,
        setActiveBoxId,
        setIsFilterPanelOpen
    } = useMailUI();
    const { setAllSearchResult, setEmails, setPagination,
        setSearchTerm, setFilterForm, setTotalEmailBadge,
        setBoxTitle, filterForm, boxName, boxTitle, searchTerm, allSearchResult,
        setEmailDetailSelected, setActiveEmailMessageId,
        headerSearchResults: searchResults, setHeaderSearchResults: setSearchResults,
        clearMailSearch, mailSearchResetKey } = useMailData();
    const { contacts, fetchContacts } = useContacts();
    const { calendarView, setCalendarView, changeView } = useCalendar();
    const [noResult, setNoResult] = useState(false);
    const [isSearchResultDropdownOpen, setIsSearchResultDropdownOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isResponsiveSearch, setIsResponsiveSearch] = useState(false);
    const { isDesktop, isMobile } = useScreen();
    const prevDebouncedSearchRef = useRef(debouncedSearchText);
    const allowSearchDropdownRef = useRef(true);

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        setIsFilterPanelOpen(isFilterDropdownOpen || isCreateRuleModalOpen);
    }, [isFilterDropdownOpen, isCreateRuleModalOpen]);

    useEffect(() => () => setIsFilterPanelOpen(false), []);

    const handleLogout = async () => {
        try {
            const socket = await getSocket();
            await logoutUser(socket.id ?? null);
        } catch {
            // proceed with logout even if API fails
        } finally {
            disconnectSocket();
            AUTH_STORAGE_KEYS.forEach((key) => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            clearAccountSession();
            navigate('/login');
        }
    }

    const {
        control,
        handleSubmit,
        getValues,
        reset,
    } = useFilterEmailForm();

    const isExecutingFullSearchRef = useRef(false);
    const syncFilterFormFromQuery = useCallback((query: string) => {
        const trimmed = query.trim();

        if (!trimmed) {
            if (filterForm) {
                setFilterForm(null);
            }
            reset({
                from: [],
                to: [],
                subject: '',
                attachmentSize: undefined,
                dateRange: [],
            });
            return;
        }

        const { filterForm: resolvedFilter, searchTerm: resolvedSearchTerm } = resolveSearchFromQuery(
            trimmed,
            filterForm,
        );

        if (resolvedSearchTerm !== searchTerm) {
            setSearchTerm(resolvedSearchTerm);
        }

        if (!areFilterFormsEqual(filterForm, resolvedFilter)) {
            setFilterForm(resolvedFilter);
            reset({
                from: resolvedFilter?.from ?? [],
                to: resolvedFilter?.to ?? [],
                subject: resolvedFilter?.subject ?? '',
                attachmentSize: resolvedFilter?.attachmentSize,
                dateRange: resolvedFilter?.dateRange ?? [],
            });
        }
    }, [filterForm, reset, searchTerm, setFilterForm, setSearchTerm]);

    // SEARCH EFFECT (debounced) — only restore mailbox when user clears a non-empty search string
    useEffect(() => {
        const trimmedSearchText = searchText.trim();
        const previousSearch = prevDebouncedSearchRef.current.trim();
        const currentSearch = debouncedSearchText.trim();
        prevDebouncedSearchRef.current = debouncedSearchText;

        if (isExecutingFullSearchRef.current) {
            return;
        }

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

        const { filterForm: resolvedFilter, searchTerm: resolvedSearchTerm } = resolveSearchFromQuery(
            currentSearch,
            filterForm,
        );

        const controller = new AbortController();

        const searchEmails = async () => {
            try {
                if (resolvedSearchTerm !== searchTerm) {
                    setSearchTerm(resolvedSearchTerm);
                }

                const response = await searchAndFilterEmailService(
                    buildSearchFilterPayload({
                        searchText: resolvedSearchTerm,
                        filterForm: resolvedFilter,
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
        // }, [debouncedSearchText, searchText, allSearchResult, boxTitle, clearMailSearch, filterForm, setSearchTerm]);
    }, [debouncedSearchText]);


    const toggleSidebarHandler = () => {
        if (isMobile) {
            setIsSidebarExpandedMobile(!isSidebarExpandedMobile);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    // On mobile the results list is hidden whenever a detail view is open, so searching
    // while reading an email would otherwise leave both panels collapsed.
    const revealSearchResultsView = () => {
        setIsResponsiveSearch(false);
        if (isDesktop) return;

        setIsMailListOpen(true);
        setEmailDetailSelected(null);
        setActiveEmailMessageId(null);
        setToolbarState({
            showBack: false,
            showSelectAll: true,
            showRefresh: true,
            showDelete: false,
            showMarkAsRead: false,
            showMarkAsUnread: false,
            showMove: false,
        });
    };

    const onSubmit = async (data: FilterEmailFormValues) => {
        const { searchTerm: existingSearchTerm } = resolveSearchFromQuery(searchText, filterForm);

        setAllSearchResult(true);
        setSearchTerm(existingSearchTerm);
        setFilterForm(data);

        const displayQuery = buildDisplaySearchQuery(data, existingSearchTerm);

        allowSearchDropdownRef.current = false;
        setIsSearchResultDropdownOpen(false);
        setSearchText(displayQuery);
        prevDebouncedSearchRef.current = displayQuery;

        const payload = buildSearchFilterPayload({
            filterForm: data,
            searchText: existingSearchTerm,
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
                setBoxTitle("Search Results");
                revealSearchResultsView();
            }
        } catch (err) {
            console.error('Filter failed:', err);
        }
    };

    const handleOnSubmitForCreateRule = async (data: CreateRuleFormValues) => {
        const currentFormValues = getValues();
        const hasForwardRecipients = data.forwardEmails.length > 0;
        const actions: CreateRuleFormValues = {
            ...data,
            // Only send forwardIt when there is at least one recipient
            forwardIt: data.forwardIt && hasForwardRecipients,
            forwardEmails: hasForwardRecipients ? data.forwardEmails : [],
        };
        const payload: any = {
            ...currentFormValues,
            createRule: true,
            actions,
        }

        let dateRangeStr: string | undefined = undefined;
        if (payload.dateRange && Array.isArray(payload.dateRange)) {
            // Local calendar dates only — toISOString() shifts back one day in IST
            const dates = (payload.dateRange as unknown[])
                .filter((d): d is Date => d instanceof Date)
                .map((d: Date) => formatDate(d, TimeFormat.YYYYMMDD) as string)
                .filter(Boolean);

            if (dates.length === 1) {
                dateRangeStr = dates[0];
            }
            else if (dates.length > 1) {
                dateRangeStr = `${dates[0]} to ${dates[1]}`;
            }
        }

        payload.dateRange = dateRangeStr;

        if (payload.attachmentSize) {
            payload.attachmentSizeType = attachmentSizeLabelToApiType(payload.attachmentSize);
            delete payload.attachmentSize;
        }

        const response = await filterEmailAndCreateRuleService(payload);

        // Close on success even when no emails matched the filter (emailList can be [])
        if (Array.isArray(response?.emailList)) {
            showSuccess('Rule created successfully');
            setIsCreateRuleModalOpen(false);
            reset();
            setIsFilterDropdownOpen(false);
        } else {
            showError(response?.message || 'Failed to create filter rule');
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

    const executeSearchFromQuery = async () => {
        const trimmed = searchText.trim();

        if (!trimmed) {
            void clearMailSearch();
            return;
        }

        const { filterForm: resolvedFilter, searchTerm: resolvedSearchTerm } = resolveSearchFromQuery(trimmed, filterForm);

        setAllSearchResult(true);
        syncFilterFormFromQuery(trimmed);
        setSearchText(trimmed);
        prevDebouncedSearchRef.current = trimmed;
        allowSearchDropdownRef.current = false;

        setIsSearchResultDropdownOpen(false);
        setIsFilterDropdownOpen(false);

        if (boxName.toLocaleLowerCase().includes('schedule')) {
            navigate('/mail/INBOX');
        }

        try {
            const response = await searchAndFilterEmailService(
                buildSearchFilterPayload({
                    searchText: resolvedSearchTerm,
                    filterForm: resolvedFilter,
                    limit: 25,
                    direction: 'next',
                    vPage: 1,
                })
            );

            if (response?.statusCode === 200) {
                setEmails(response.data.emailList);
                setPagination(response.data.pagination);
                setSearchResults([]);
                setNoResult(false);
                setTotalEmailBadge(response.data.pagination.totalEmails);
                setBoxTitle("Search Results");
                revealSearchResultsView();
                // setBoxTitle(
                //     resolvedFilter && getAppliedFilterCount(resolvedFilter) > 0
                //         ? 'Filtered Results'
                //         : 'Search Results'
                // );
            }
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    const showAllSearchResult = async () => {
        await executeSearchFromQuery();
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
            setActiveEmailMessageId(messageId);
            setActiveBoxId('');

            const isRead = !!data.emailList.isSeen;
            setToolbarState({
                showBack: !isDesktop,
                showSelectAll: isDesktop,
                showRefresh: false,
                showDelete: true,
                showMarkAsRead: !isDesktop && !isRead,
                showMarkAsUnread: !isDesktop && isRead,
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

        syncFilterFormFromQuery(searchText);
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
            const displayQuery = buildDisplaySearchQuery(filterForm, searchTerm);
            setSearchText(displayQuery);
            prevDebouncedSearchRef.current = displayQuery;
        }
        else {
            setSearchText("");
            reset({
                from: [],
                to: [],
                subject: '',
                attachmentSize: undefined,
                dateRange: [],
            });
        }
    }, [mailSearchResetKey]);

    const resetSearch = () => {
        allowSearchDropdownRef.current = false;
        prevDebouncedSearchRef.current = '';
        reset({
            from: [],
            to: [],
            subject: '',
            attachmentSize: undefined,
            dateRange: [],
        });
        void clearMailSearch();
    }

    const closeProfileModalMobile = () => {
        setIsProfileOpen(false);
    }



    const isCalendar = verifyBoxName(boxName, "calendar");
    const isSettings = verifyBoxName(boxName, "settings");

    const mountFilterMonthDropdown = useFlatpickrMonthDropdown(0);
    const mountFilterMonthDropdownRef = useRef(mountFilterMonthDropdown);
    mountFilterMonthDropdownRef.current = mountFilterMonthDropdown;

    // Keep options referentially stable so selecting the first range date
    // does not remount Flatpickr and close the calendar prematurely.
    const filterDateFlatpickrOptions = useMemo(() => ({
        mode: 'range' as const,
        dateFormat: 'd-m-Y',
        allowInput: true,
        // Stay open after the first date so the user can pick an end date.
        // Close when the range is complete (second date, or same date clicked again).
        // Outside click still closes via Flatpickr's default blur behavior.
        closeOnSelect: false,
        onReady: (_dates: Date[], _str: string, instance: any) => {
            mountFilterMonthDropdownRef.current(instance);
        },
    }), []);

    return (
        <div className={`mail-details-header ${isCalendar ? 'is-calendar-header' : ''} ${isCalendar && !isDesktop ? 'calendar-mobile-header-wrap' : ''}`}>
            {isCalendar ? (
                <Suspense fallback={null}>
                    <CalendarHeader />
                </Suspense>
            ) : (
                <>
                    <div className="d-flex align-items-center">
                        {/*Moblie  Sidebar Menu Toggle Button */}
                        {!isDesktop && (
                            <button
                                className="btn hover-link me-2"
                                style={{ width: "24px", height: "24px" }}
                                type="button"
                                onClick={toggleSidebarHandler}
                            >
                                <InteractiveIcon
                                    defaultIcon={
                                        (isMobile ? isSidebarExpandedMobile : !isSidebarOpen)
                                            ? sidebarcloseIcon
                                            : sidebaropenIcon
                                    }
                                    hoverIcon={
                                        (isMobile ? isSidebarExpandedMobile : !isSidebarOpen)
                                            ? sidebarcloseHoverIcon
                                            : sidebaropenHoverIcon
                                    }
                                    activeIcon=""
                                    isActive={false}
                                    alt="Toggle Sidebar"
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Toggle Menu"
                                />
                            </button>
                        )}

                        {/* LEFT: Dynamic header section */}
                        <div className="d-flex align-items-center two-sc-in" id="dynamicHeaderSection">
                            <h2 className="box-title" id="boxTitle" title={boxTitle}>{boxTitle}</h2>
                            {!isSettings && totalEmailBadge > 0 && readUnreadFilter !== 'read' && (
                                <span className="badge" id="boxBadge">{totalEmailBadge}</span>
                            )}
                        </div>
                    </div>

                    {!isSettings && !isCalendar && (
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
                                                        syncFilterFormFromQuery(value);
                                                        if (value.trim()) {
                                                            allowSearchDropdownRef.current = true;
                                                            setIsSearchResultDropdownOpen(true);
                                                        }
                                                    }}
                                                    onFocus={() => setIsSearchResultDropdownOpen(true)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            void executeSearchFromQuery();
                                                        }
                                                    }}
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
                                                    className="btn btnic btn-grey dropdown-toggle t-filter-btn hover-link search-d-Btn-cm"
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
                                                                                onChange={(dates, _dateStr, instance) => {
                                                                                    field.onChange(dates);
                                                                                    // Close once the user finishes a range, or confirms a
                                                                                    // single day by clicking the same date again.
                                                                                    if (dates.length === 2) {
                                                                                        instance.close();
                                                                                    }
                                                                                }}
                                                                                options={filterDateFlatpickrOptions}
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
                {!isCalendar && (
                    <button type="button" className="btn hover-link input-icon-1 mobile-search-btn icon-hover-effect ms-3 me-2" onClick={() => setIsResponsiveSearch(!isResponsiveSearch)} >
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
                )}
                {isCalendar && isDesktop && (
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

                <Dropdown
                    className="mail-profile-dropdown"
                    show={isProfileOpen}
                    onToggle={(nextShow) => {

                        if (isMobile && !nextShow) {
                            return;
                        }
                        setIsProfileOpen(nextShow);
                    }}
                >
                    <Dropdown.Toggle className="btn btn-secondary dropdown-toggle d-flex align-items-center">
                        <div className={`d-block${isCalendar ? ' calendar-header-profile-text' : ''}`} id="profileBox">
                            <span className="mail-profile-name d-block text-end" id="profileName"> {profileName}</span>
                            <span className="mail-profile-id d-block text-end" id="profileEmail"> {profileEmail}</span>
                        </div>
                        <span className="mail-profile-label" id="profileInitial">
                            {profileInitial}
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="dropdown-menu dropdown-menu-lg-end mail-profile-box p-0">
                        <button
                            type="button"
                            className="mail-profile-close-btn-mobile btn icon-hover-effect"
                            onClick={closeProfileModalMobile}
                        >
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
                            <Suspense fallback={null}>
                                <AccountSwitcher onAccountSwitch={() => setIsProfileOpen(false)} />
                            </Suspense>
                            <ul className="profile-link-list">
                                <li className="profile-link-items">
                                    <a href="#" className="profile-link hover-link" onClick={openChangeImapSmtpPasswordModal}>
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
                                    <a href="#" className="profile-link hover-link" onClick={openChangePasswordModal}>
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
                                    <a href="#" className="profile-link hover-link" onClick={handleLogout}>
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
                                    <a href="#" className="ms-2">
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