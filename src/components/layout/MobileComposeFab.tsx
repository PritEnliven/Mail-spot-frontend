import composeIcon from '@images/Compose-icon.svg';
import eventIcon from '@images/calendar-event-icon-white.svg';
import { useLocation } from 'react-router-dom';
import { useScreen } from '@context/ScreenContext';
import { useContacts, useMailUI } from '@context/index';

const MobileComposeFab = () => {
    const location = useLocation();
    const { isDesktop, isMobile } = useScreen();
    const { openModal, isSidebarExpandedMobile, isFilterPanelOpen, activeEmailMessageId } = useMailUI();
    const { fetchContacts } = useContacts();

    const isCalendar = location.pathname.includes('/calendar');
    const isSettings = location.pathname.includes('/settings');
    // /mail/:boxName/:emailId means an email detail view is open
    const isEmailDetailOpen = !!activeEmailMessageId || /^\/mail\/[^/]+\/[^/]+/.test(location.pathname);

    if (isSettings || isSidebarExpandedMobile || isFilterPanelOpen) return null;

    // Mail: bottom FAB only below 575px; sidebar compose covers ≥575px
    if (!isCalendar) {
        if (!isMobile || isEmailDetailOpen) return null;
    } else if (isDesktop) {
        // Calendar: keep previous non-desktop FAB behavior
        return null;
    }

    const handleClick = () => {
        if (isCalendar) {
            openModal('calendarEvent');
            return;
        }
        fetchContacts();
        openModal('compose');
    };

    return (
        <button
            type="button"
            id="mobileComposeFab"
            className="mobile-compose-fab"
            onClick={handleClick}
            aria-label={isCalendar ? 'Create Event' : 'Compose'}
        >
            <img src={isCalendar ? eventIcon : composeIcon} alt="" />
        </button>
    );
};

export default MobileComposeFab;
