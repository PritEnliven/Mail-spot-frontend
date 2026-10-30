import InteractiveIcon from '@components/ui/InteractiveIcon';
import { useAdmin } from '@context/AdminDataContext';
import userManagementIconHover from '@images/add-pesion-icon-active.svg';
import userManagementIcon from '@images/add-pesion-icon.svg';
import clockIconHover from '@images/clock-icon-active.svg';
import clockIcon from '@images/clock-icon.svg';
import outsideMailIconHover from '@images/mail-icon-active.svg';
import outsideMailIcon from '@images/mail-icon.svg';
import settingsIconHover from '@images/setting-icon-active.svg';
import settingsIcon from '@images/setting-icon.svg';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAdminBoxTitle, setSettingPayLoad, setIsSidebarExpandedMobile, settingPayLoad } = useAdmin();

    const isEditingUser = Boolean(settingPayLoad?.userId && !settingPayLoad?.isAdmin);
    const isOutside = location.pathname.includes('/admin/outside-mail');
    const isOutOfHours = location.pathname.includes('/admin/out-of-hours-mail');
    const isSettings = location.pathname.includes('/admin/settings') && !isEditingUser;
    const isUsers = !isSettings && !isOutside && !isOutOfHours;

    const goUsers = () => {
        setIsSidebarExpandedMobile(false);
        setAdminBoxTitle('User Management');
        navigate('/admin/dashboard');
    };

    const goOutside = () => {
        setIsSidebarExpandedMobile(false);
        setSettingPayLoad({
            userId: null,
            role: 'admin',
            isAdmin: true,
        });
        setAdminBoxTitle('Outside Domain Emails');
        navigate('/admin/outside-mail');
    };

    const goOutOfHours = () => {
        setIsSidebarExpandedMobile(false);
        setSettingPayLoad({
            userId: null,
            role: 'admin',
            isAdmin: true,
        });
        setAdminBoxTitle('Out of Hours Emails');
        navigate('/admin/out-of-hours-mail');
    };

    const goSettings = () => {
        setIsSidebarExpandedMobile(false);
        setSettingPayLoad({
            userId: null,
            role: 'admin',
            isAdmin: true,
        });
        setAdminBoxTitle('Settings');
        navigate('/admin/settings');
    };

    return (
        <nav className="admin-bottom-nav" aria-label="Admin mobile navigation">
            <button
                type="button"
                className={`admin-bottom-nav__item ${isUsers ? 'active' : ''}`}
                onClick={goUsers}
            >
                <InteractiveIcon
                    defaultIcon={userManagementIcon}
                    activeIcon={userManagementIconHover}
                    isActive={isUsers}
                    alt="Users"
                    className="interactive-icon hover-image"
                    renderAs="img"
                />
                <span>Users</span>
            </button>
            <button
                type="button"
                className={`admin-bottom-nav__item ${isOutside ? 'active' : ''}`}
                onClick={goOutside}
            >
                <InteractiveIcon
                    defaultIcon={outsideMailIcon}
                    activeIcon={outsideMailIconHover}
                    isActive={isOutside}
                    alt="Outside mail"
                    className="interactive-icon hover-image"
                    renderAs="img"
                />
                <span>Outside</span>
            </button>
            <button
                type="button"
                className={`admin-bottom-nav__item ${isOutOfHours ? 'active' : ''}`}
                onClick={goOutOfHours}
            >
                <InteractiveIcon
                    defaultIcon={clockIcon}
                    activeIcon={clockIconHover}
                    isActive={isOutOfHours}
                    alt="Out of hours mail"
                    className="interactive-icon hover-image"
                    renderAs="img"
                />
                <span>Hours</span>
            </button>
            <button
                type="button"
                className={`admin-bottom-nav__item ${isSettings ? 'active' : ''}`}
                onClick={goSettings}
            >
                <InteractiveIcon
                    defaultIcon={settingsIcon}
                    activeIcon={settingsIconHover}
                    isActive={isSettings}
                    alt="Settings"
                    className="interactive-icon hover-image"
                    renderAs="img"
                />
                <span>Settings</span>
            </button>
        </nav>
    );
};

export default AdminBottomNav;
