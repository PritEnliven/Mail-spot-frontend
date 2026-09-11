import composeIcon from '@images/Compose-icon.svg';
import eventIcon from '@images/calendar-event-icon-white.svg';
import plusIconWhite from '@images/plus-icon-white.svg';
import { useLocation } from 'react-router-dom';
import { useScreen } from '@context/ScreenContext';
import { useContacts, useMailUI } from '@context/index';
import { CONTACTS_LIST_REFRESH_EVENT } from '@features/contacts/useContacts';

const MobileComposeFab = () => {
    const location = useLocation();
    const { isMobile } = useScreen();
    const { openModal, isSidebarExpandedMobile, isFilterPanelOpen, activeEmailMessageId } = useMailUI();
    const { fetchContacts } = useContacts();

    const isCalendar = location.pathname.includes('/calendar');
    const isSettings = location.pathname.includes('/settings');
    const isContact = location.pathname.includes('/contact');
    // /mail/:boxName/:emailId means an email detail view is open
    const isEmailDetailOpen = !!activeEmailMessageId || /^\/mail\/[^/]+\/[^/]+/.test(location.pathname);

    if (isSettings || isSidebarExpandedMobile || isFilterPanelOpen) return null;

    // Mail + Calendar + Contacts: bottom FAB only at ≤575px; sidebar covers ≥575px
    if (!isMobile) return null;
    if (!isCalendar && !isContact && isEmailDetailOpen) return null;

    const handleClick = () => {
        if (isCalendar) {
            openModal('calendarEvent');
            return;
        }
        if (isContact) {
            openModal('contactForm', {
                isEdit: false,
                onSuccess: () => {
                    void fetchContacts();
                    window.dispatchEvent(new CustomEvent(CONTACTS_LIST_REFRESH_EVENT));
                },
            });
            return;
        }
        fetchContacts();
        openModal('compose');
    };

    const ariaLabel = isCalendar
        ? 'Create Event'
        : isContact
            ? 'Add contact'
            : 'Compose';
    const icon = isCalendar
        ? eventIcon
        : isContact
            ? plusIconWhite
            : composeIcon;

    return (
        <button
            type="button"
            id="mobileComposeFab"
            className="mobile-compose-fab"
            onClick={handleClick}
            aria-label={ariaLabel}
        >
            <img src={icon} alt="" />
        </button>
    );
};

export default MobileComposeFab;
