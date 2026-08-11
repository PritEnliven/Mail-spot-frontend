import { Outlet, useLocation } from 'react-router-dom';
import ToolbarBox from '@components/layout/ToolbarBox';
import Header from '@components/layout/header/Header';
import { useMailData } from '@context/MailDataContext';
import { useScreen } from '@context/ScreenContext';

const RightPanel = () => {
    const location = useLocation();

    // Check if current path is settings or calendar
const isSettingsOrCalendar = location.pathname.includes('/settings') || location.pathname.includes('/calendar');
    const { activeEmailMessageId } = useMailData();
    const { isDesktop } = useScreen();

    return (
        <>

            {/* On mobile/tablet, hide list header whenever a mail is open (including load gaps between swipes) */}
            {(isDesktop || !activeEmailMessageId) && <Header />}

            {!isSettingsOrCalendar && <ToolbarBox />}

            <div className={`mail-application-box ${isSettingsOrCalendar ? '' : 'd-flex'}`} id="mailApplicationBox">
                <Outlet />
            </div>
        </>
    );
}

export default RightPanel;