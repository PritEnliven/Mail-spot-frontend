import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useAdmin } from "@context/AdminDataContext";
import { useScreen } from "@context/ScreenContext";
import enlivenLogo from "@images/enliven-logo.svg";
import { default as logoutIcon, default as logoutIconHover } from "@images/logout-icon.svg";
import sidebarcloseIcon from "@images/side-bar-close-icon.svg";
import sidebarcloseHoverIcon from "@images/side-bar-close-hover-icon.svg";
import sidebaropenIcon from "@images/side-bar-open-icon.svg";
import sidebaropenHoverIcon from "@images/side-bar-open-hover-icon.svg";
import { useNavigate } from "react-router-dom";

const ADMIN_AUTH_STORAGE_KEYS = ["adminToken", "adminUsername", "adminId"] as const;

interface adminHeaderProps {
    title: string;
}

const AdminHeader = ({ title }: adminHeaderProps) => {
    const navigate = useNavigate();
    const { isDesktop, isMobile } = useScreen();
    const {
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarExpandedMobile,
        setIsSidebarExpandedMobile,
    } = useAdmin();

    const logout = () => {
        ADMIN_AUTH_STORAGE_KEYS.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        navigate('/admin/login');
    };

    // Same as MailSpot user Header: ≤992 shows the 3-line toggle.
    // ≤575 overlays the drawer; 576–992 collapses the rail via isSidebarOpen.
    const toggleSidebarHandler = () => {
        if (isMobile) {
            setIsSidebarExpandedMobile(!isSidebarExpandedMobile);
        } else {
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    const isSidebarShown = isMobile ? isSidebarExpandedMobile : !isSidebarOpen;

    return (
        <div className={`mail-details-header d-flex align-items-center justify-content-between ${isMobile ? 'admin-mobile-header' : ''}`}>
            <div className="d-flex align-items-center">
                {!isDesktop && (
                    <button
                        type="button"
                        className="btn hover-link admin-mobile-menu-btn me-2"
                        style={{ width: '24px', height: '24px' }}
                        onClick={toggleSidebarHandler}
                        aria-label="Toggle menu"
                    >
                        <InteractiveIcon
                            defaultIcon={isSidebarShown ? sidebarcloseIcon : sidebaropenIcon}
                            hoverIcon={isSidebarShown ? sidebarcloseHoverIcon : sidebaropenHoverIcon}
                            activeIcon=""
                            isActive={false}
                            alt="Toggle Sidebar"
                            className="interactive-icon hover-image"
                            renderAs="img"
                            tooltip="Toggle Menu"
                        />
                    </button>
                )}
                <h2 className="box-title">{title}</h2>
            </div>
            <div className="dropdown mail-profile-dropdown admin-header-profile">
                <button
                    className="btn btn-secondary dropdown-toggle d-flex align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    <div className="d-block">
                        <span className="mail-profile-name d-block text-end m-0">
                            MailSpot-Admin
                        </span>
                    </div>
                    <span className="mail-profile-label d-none">M</span>
                    <span className="mail-profile-label">M</span>
                </button>
                <ul
                    className="dropdown-menu dropdown-menu-lg-end mail-profile-box p-0"
                >
                    <div className="profile-sec-new-box">
                        <div className="profile-sec-people">
                            <div className="profile-sec-people-sub">
                                <div className="profile-sec-image mb-3">M</div>
                                <span className="mail-profile-name d-block text-center">
                                    MailSpot-Admin
                                </span>
                            </div>
                        </div>
                        <ul className="profile-link-list">
                            <li className="profile-link-items">
                                <a className="profile-link" onClick={logout}>
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
                </ul>
            </div>
        </div>
    );
};

export default AdminHeader;
