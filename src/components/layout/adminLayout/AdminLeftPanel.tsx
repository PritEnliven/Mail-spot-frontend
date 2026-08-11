import AdminSidebarItems from '@components/ui/admin/AdminSidebarItem';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { useAdmin } from '@context/AdminDataContext';
import { useScreen } from '@context/ScreenContext';
import mailBoxLogo40 from '@images/mail-spot-40-logo.svg';
import mailBoxLogoImage from '@images/mailspot-login-logo.svg';
import navCollapseIconHover from "@images/nav-collepse-icon-hover-2.svg";
import navExpandIconHover from '@images/nav-collepse-icon-hover.svg';
import navCollapseIcon from '@images/nav-collepse-icon.svg';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminLeftPanel = () => {
    const {
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarExpandedMobile,
        setIsSidebarExpandedMobile,
        adminSidebarItems,
        setAdminBoxTitle,
        setSettingPayLoad,
    } = useAdmin();
    const { isMobile } = useScreen();
    const [activeBoxId, setActiveBoxId] = useState<string>('userManagement');
    const navigate = useNavigate();
    const location = useLocation();

    const getActiveBoxId = () => {
        if (location.pathname.includes('/admin/settings')) return 'settings';
        return 'userManagement';
    };

    useEffect(() => {
        setActiveBoxId(getActiveBoxId());
    }, [location.pathname]);

    const changeBox = (boxId: string, label: string) => {
        if (boxId === 'settings') {
            setSettingPayLoad({
                userId: null,
                role: 'admin',
                isAdmin: true,
            });
            navigate('/admin/settings');
        } else {
            navigate(`/admin/dashboard`);
        }
        setActiveBoxId(boxId);
        setAdminBoxTitle(label);
        if (isMobile) {
            setIsSidebarExpandedMobile(false);
        }
    };

    const toggleSidebar = () => {
        if (isMobile) {
            setIsSidebarExpandedMobile(!isSidebarExpandedMobile);
            return;
        }
        setIsSidebarOpen(!isSidebarOpen);
    };

    const showExpandedBrand = isMobile ? isSidebarExpandedMobile : isSidebarOpen;
    const navCollapsedClass = isMobile
        ? (isSidebarExpandedMobile ? '' : 'nav-collepse expanded-nav')
        : (isSidebarOpen ? '' : 'nav-collepse expanded-nav');

    return (
        <>
            {!isMobile && (
                <div className="single-navbar-collapse-sec " id="draggable-section">
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
                    </div>
                </div>
            )}

            <div className="side-bae-part-1">
                <div className="Brand-box d-flex align-items-center justify-content-center">
                    <a href="#" className="Brand-logo">
                        {showExpandedBrand ? (
                            <img
                                src={mailBoxLogoImage}
                                alt="Mailspot Logo"
                                className="Brand-logo-full"
                                width={130}
                            />
                        ) : (
                            <img
                                src={mailBoxLogo40}
                                alt="Mailspot Logo Small"
                                className="Brand-logo-collepse"
                            />
                        )}
                    </a>
                </div>
            </div>

            <nav id="navbarList" className={`nav-custom-scroll-wrapper ${navCollapsedClass}`}>
                <div className="nav-custom-scroll-content">
                    <ul id="sidebarMainMenu" className="left-side-manu-link-list">
                        {adminSidebarItems.length > 0 && (
                            <AdminSidebarItems
                                items={adminSidebarItems}
                                activeBoxId={activeBoxId}
                                onChangeBox={changeBox}
                            />
                        )}
                    </ul>
                </div>
            </nav>
        </>
    );
};

export default AdminLeftPanel;
