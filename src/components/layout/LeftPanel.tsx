import mailBoxLogoImage from '@images/mailspot-login-logo.svg';
import mailBoxLogo40 from '@images/mail-spot-40-logo.svg';
import composeIcon from '@images/Compose-icon.svg';
import navCollapseIcon from '@images/nav-collepse-icon.svg';
import navExpandIconHover from '@images/nav-collepse-icon-hover.svg';
import navCollapseIconHover from "@images/nav-collepse-icon-hover-2.svg";
import menuIcon from "@images/menu-icon.svg";
import { useState, useEffect, useMemo } from 'react';
import SidebarItem from '../../features/emails/SidebarItem';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMailData, useMailUI, useContacts, useCalendar } from '../../context/index';
import { getBoxes } from '@services/mailbox/mailboxService';
import { CustomFolderSection } from '../ui/sidebar/CustomFolderSection';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { resolveSidebarItem, verifyBoxName, buildCustomFolderTree } from '@utils/emailUtil';
import { deleteCustomBox } from '@services/customBox/customBoxService';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useSidebarFadeScrollbar } from '@hooks/useScrollFade';
import eventIcon from '@images/calendar-event-icon-white.svg';

type SidebarNavItem = { id: string; boxName: string; label: string };

const getActiveSidebarItem = (pathname: string, items: SidebarNavItem[]) => {
    const pathParts = pathname.split('/');
    const urlBoxName = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (!urlBoxName || !items.length) return null;

    if (urlBoxName === 'settings') {
        return items.find(item => item.id.includes('settings') || item.boxName === 'settings') ?? null;
    }

    if (urlBoxName === 'calendar') {
        return items.find(item => item.id.includes('calendar') || item.boxName === 'calendar') ?? null;
    }

    return items.find(item => item.boxName === urlBoxName) ?? null;
};

const LeftPanel = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { sidebarSectionScrollbarRef, handleRef, scrollRef, fadeTopRef, fadeBottomRef } = useSidebarFadeScrollbar();
    const { setIsCalendarAllSearchActive } = useCalendar();

    const [activeBoxId, setActiveBoxId] = useState<string>('box-li-0');
    const { boxName, setBoxName, setPagination, setBoxTitle, fetchEmails,
        sidebarState,
        sidebarItems,
        setSidebarItems,
        setEmailDetailSelected,
        setActiveEmailMessageId,
        setAllSearchResult,
        setSidebarStateFromAPI,
        clearMailSearch } = useMailData();
    const { setToolbarState, openModal, closeModal, activeModals, isMailListOpen, setIsMailListOpen, isSidebarOpen, setIsSidebarOpen, isSidebarExpandedMobile, setIsSidebarExpandedMobile } = useMailUI();
    const { fetchContacts } = useContacts();

    const customFolders = useMemo(() => {
        const items = sidebarItems.filter(item => item.category === 'customBoxes');
        return buildCustomFolderTree(items);
    }, [sidebarItems]);

    // Sync active sidebar item when URL changes (e.g. navigated from compose modal)
    useEffect(() => {
        if (sidebarItems.length === 0) return;

        const pathParts = location.pathname.split('/');
        const urlBoxName = pathParts[pathParts.length - 1];

        if (urlBoxName) {
            // Special handling for settings route
            if (urlBoxName === 'settings') {
                const settingsItem = sidebarItems.find(item =>
                    item.id.includes('settings') || item.boxName === 'settings'
                );
                if (settingsItem) {
                    setActiveBoxId(settingsItem.id);
                    setBoxTitle(settingsItem.label);
                    setBoxName(settingsItem.boxName);
                }
            } else {
                const matchedItem = sidebarItems.find(item => item.boxName === urlBoxName);
                if (matchedItem) {
                    setActiveBoxId(matchedItem.id);
                    setBoxTitle(matchedItem.label);
                    setBoxName(urlBoxName);
                }
            }
        }
    }, [location.pathname, sidebarItems]);

    //call an api 
    useEffect(() => {
        const loadBoxes = async () => {
            try {
                // wait for API and get updated sidebar state
                const updatedSidebar: any = await setSidebarStateFromAPI();

                if (!updatedSidebar?.boxes?.length) return;

                const { boxes, customBoxes, otherMenu, boxCounts } = updatedSidebar;

                // Map to sidebarItems
                const resolvedItems = [
                    ...boxes.map((box: any) => resolveSidebarItem(box, 'boxes', boxCounts)),
                    ...customBoxes.map((box: any) => resolveSidebarItem(box, 'customBoxes', boxCounts)),
                    ...otherMenu.map((box: any) => resolveSidebarItem(box, 'otherMenu', boxCounts)),
                ];
                setSidebarItems(resolvedItems);

                let activeItem = getActiveSidebarItem(location.pathname, resolvedItems);

                if (!activeItem) {
                    activeItem = resolvedItems.find(item =>
                        item.id.includes("inbox")
                    );
                }

                if (activeItem) {
                    setActiveBoxId(activeItem.id);
                    setBoxTitle(activeItem.label);
                }
            } catch (error) {
                console.error('Error loading boxes:', error);
            }
        };

        loadBoxes();
    }, []);

    useEffect(() => {
        if (!sidebarItems.length) return;

        const activeItem = getActiveSidebarItem(location.pathname, sidebarItems);
        if (activeItem) {
            setActiveBoxId(activeItem.id);
            setBoxTitle(activeItem.label);
        }
    }, [location.pathname, sidebarItems]);

    const openComposeModal = () => {
        fetchContacts();
        openModal('compose');
    };

    const isCalendar = verifyBoxName(boxName, 'calendar');

    const changeBox = (boxName: string, boxId: string, label: string) => {
        clearMailSearch();
        activeModals
            .filter(modal => modal.type !== 'compose')
            .forEach(modal => closeModal(modal.id));
        setBoxName(boxName);
        setActiveBoxId(boxId);
        setPagination(null);
        setActiveEmailMessageId(null);
        setEmailDetailSelected(null);
        setToolbarState({
            showBack: false,
            showSelectAll: true,
            showRefresh: true,
            showDelete: false,
            showMarkAsRead: false,
            showMarkAsUnread: false,
            showMove: false,
        });
        setBoxTitle(label);

        //reset search and filter
        setAllSearchResult(false);

        if (!isMailListOpen) {
            setIsMailListOpen(true);
        }

        // Get current boxName from pathname
        const pathParts = location.pathname.split('/');
        const currentBoxName = pathParts[pathParts.length - 1];

        // If already on the same box, force refresh by navigating with a timestamp
        if (currentBoxName === boxName) {
            if (boxName === 'calendar') {
                setIsCalendarAllSearchActive(false);
            }
            else if (boxName === 'settings') {

            }
            else {
                setPagination(null);
                fetchEmails(1, boxName, false);
            }
        } else {
            setActiveEmailMessageId(null);
            setEmailDetailSelected(null);
            setBoxName(boxName);
            navigate(`/mail/${boxName}`);
            // fetchEmails(1, boxName, false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    }

    const openCreateFolderModal = async () => {
        const response = await getBoxes();
        if (response.boxes && response.customBoxes) {
            openModal('createCustomFolder');
        }
    };

    const handleEditFolder = (boxId: string) => {
        const boxData = sidebarState.customBoxes.find((box: any) => box.value.value === boxId);
        let props = {
            folderName: boxData?.value.name,
            folderIconColor: boxData?.value.color,
            parentFolder: boxData?.value.parentBox || 'noFolderSelect',
            isEdit: true,
            editFolderId: boxData?.value._id
        }
        openModal('createCustomFolder', props);

    }

    const handleDeleteFolder = (folderId: string, folderName: string) => {
        console.log(folderId, folderName);
        openModal('confirmDelete', {
            onConfirm: () => deleteFolder(folderId, folderName)
        })
    }

    const deleteFolder = async (folderId: string, folderName: string) => {
        const response: any = await deleteCustomBox({ boxName: folderName, boxKey: folderId });

        if (response.statusCode === 200) {
            showSuccess(`Folder ${folderName} deleted successfully`);
            setSidebarStateFromAPI();
            return true;
        }
        showError(`Folder ${folderName} deleted failed`);
        return false;
    }

    const openCalendarModal = () => {
        openModal('calendarEvent');
    }


    // Mobile
    const toggleMobileSidebar = () => {
        setIsSidebarExpandedMobile(!isSidebarExpandedMobile);
    }

    return (
        <>
            <div className={`single-navbar-collapse-sec ${isSidebarExpandedMobile ? '' : 'single-navbar-collapse-sec-mobile'}`} id="draggable-section">
                <div className="nav-collepse-btn ">
                    <button
                        className="btn hover-link nav-collepse-button"
                        type="button"
                        onClick={toggleSidebar}
                    >
                        <InteractiveIcon
                            defaultIcon={navCollapseIcon}
                            hoverIcon={isSidebarOpen ? navCollapseIconHover : navExpandIconHover}
                            activeIcon=""
                            isActive={false}
                            alt=""
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip=""
                        />
                    </button>

                    {/* moblie */}
                    <button
                        className="btn hover-link nav-collepse-button-mobile"
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
                </div>
            </div>

            <div className="side-bae-part-1">
                {/* START:: Brand-box */}
                <div className="Brand-box d-flex align-items-center justify-content-center">
                    <a href="javascript:;" className="Brand-logo">
                        {isSidebarOpen ?
                            <img
                                src={mailBoxLogoImage}
                                alt="Mailspot Logo"
                                className="Brand-logo-full"
                                width={130}
                            />
                            :
                            <img
                                src={mailBoxLogo40}
                                alt="Mailspot Logo Small"
                                className="Brand-logo-collepse"
                            />
                        }
                    </a>
                </div>
                {/* END:: Brand-box */}

                {/* START:: Compose box */}
                <div className="compose-box" id="composeBoxSection">
                    {!isCalendar ?
                        (<a
                            onClick={openComposeModal}
                            id="composeEmailBtn"
                            className="compose-btn tooltips-ds"
                            {...(
                                isSidebarOpen
                                    ? {}
                                    : {
                                        "data-tooltip-id": "my-tooltip",
                                        "data-tooltip-content": "Compose",
                                        "data-tooltip-place": "top"
                                    })
                            }
                        >
                            <img
                                src={composeIcon}
                                alt="Compose"
                                className="me-2"

                            />
                            <span className="compose-btn-collepse">Compose</span>
                        </a>) : (
                            <a
                                onClick={openCalendarModal}
                                id="createEventBtn"
                                className="compose-btn event-btn"
                                {...(
                                    isSidebarOpen
                                        ? {}
                                        : {
                                            "data-tooltip-id": "my-tooltip",
                                            "data-tooltip-content": "Create Event",
                                            "data-tooltip-place": "top"
                                        })
                                }
                            >
                                <img
                                    src={eventIcon}
                                    alt="Compose"
                                    className="me-2"

                                />
                                <span className="compose-btn-collepse">Create Event</span>
                            </a>
                        )}
                </div>
                {/* END:: Compose box */}
            </div>

            <nav id="navbarList" className={`nav-custom-scroll-wrapper ${isSidebarOpen ? '' : 'nav-collepse expanded-nav'}`}>
                <div className="nav-custom-scroll-content" ref={scrollRef}>
                    <div ref={fadeTopRef} className="nav-custom-scroll-fade-top" style={{ opacity: 0 }} />
                    <ul id="sidebarMainMenu" className="left-side-manu-link-list">
                        {sidebarState.boxes.length > 0 && (
                            <SidebarItem
                                items={sidebarItems.filter(item => item.category === 'boxes')}
                                boxCounts={sidebarState.boxCounts}
                                activeBoxId={activeBoxId}
                                onChangeBox={changeBox}
                            />
                        )}
                    </ul>

                    <CustomFolderSection
                        folders={customFolders.map(item => ({
                            id: item.id,
                            name: item.label,
                            color: item.color,
                            icon: item.icon,
                            value: item.boxName,
                            depth: item.depth,
                        }))}
                        activeBoxId={activeBoxId}
                        onChangeBox={(boxName) => {
                            const item = sidebarItems.find(si => si.boxName === boxName);
                            if (item) {
                                changeBox(boxName, item.id, item.label);
                            }
                        }}
                        onEditFolder={(boxId) => {
                            handleEditFolder(boxId);
                        }}
                        onDeleteFolder={(boxId, folderName) => {
                            handleDeleteFolder(boxId, folderName);
                        }}
                        onCreateFolder={openCreateFolderModal}
                    />

                    {/* Other Menu Items */}
                    {sidebarState.otherMenu.length > 0 && (
                        <ul id="sidebarOtherMenu" className="left-side-manu-link-list left-side-manu-link-list-last-ul">
                            <SidebarItem
                                items={sidebarItems.filter(item => item.category === 'otherMenu')}
                                boxCounts={sidebarState.boxCounts}
                                activeBoxId={activeBoxId}
                                onChangeBox={changeBox}
                            />
                        </ul>
                    )}
                    <div ref={fadeBottomRef} className="nav-custom-scroll-fade-bottom" style={{ opacity: 0 }} />
                </div>
                <div className="nav-custom-scroll-scrollbar" ref={sidebarSectionScrollbarRef}>
                    <div className="nav-custom-scroll-handle" ref={handleRef}></div>
                </div>
            </nav>

        </>

    );
};

export default LeftPanel;
