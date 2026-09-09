import { Outlet, useLocation } from 'react-router-dom';
import ToolbarBox from '@components/layout/ToolbarBox';
import Header from '@components/layout/header/Header';
import { useMailData } from '@context/MailDataContext';
import { useScreen } from '@context/ScreenContext';

const RightPanel = () => {
    const location = useLocation();

    // Check if current path is settings or calendar
const isSettingsOrCalendarOrContact =
    location.pathname.includes('/settings') ||
    location.pathname.includes('/calendar') ||
    location.pathname.includes('/contact');
    const { activeEmailMessageId } = useMailData();
    const { isDesktop } = useScreen();

    return (
        <>

            {/* On mobile/tablet, hide list header when a mail is open — but keep it on settings/calendar/contact */}
            {(isDesktop || !activeEmailMessageId || isSettingsOrCalendarOrContact) && <Header />}

            {!isSettingsOrCalendarOrContact && <ToolbarBox />}

            <div className={`mail-application-box ${isSettingsOrCalendarOrContact ? '' : 'd-flex'}`} id="mailApplicationBox">
                <Outlet />
            </div>
        </>
    );
}

export default RightPanel;