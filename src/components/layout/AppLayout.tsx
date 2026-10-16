import { lazy, Suspense } from 'react';
// Eagerly load AI-chat styles so .ask-ai-btn (used in Header) is available
// before the lazy AiChatPanel component is first rendered.
import '@styles/ai-chat.css';
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import MobileComposeFab from "./MobileComposeFab";
import MailProviders from "../../context/MailProviders";
import ModalRoot from "@components/ui/ModalRoot";
import { useMailUI } from "@context/MailUIContext";
import { SettingsProvider } from "@context/SettingsContext";
import { useLinkedAccountRevoked, useLinkedAccountSignedOut, useMailSocket, useOutboundSendSocket } from "@hooks/useSocket";
import { useCalendarSocket } from "@hooks/useCalendarSocket";
import { usePageStylesheet, pageStyles } from "@hooks/usePageStyleSheet";
import AppLoader from "@components/layout/AppLoader";
import { useGlobalShortcuts } from "@hooks/useGlobalShortcuts";
import { useScreen } from "@context/ScreenContext";
import { useAccount } from "@context/AccountContext";
import { useSyncActiveAccountProfile } from "@hooks/useSyncActiveAccountProfile";

const AiChatPanel = lazy(() => import('@components/ui/AiChat/AiChatPanel'));

const AppContent = () => {
    useMailSocket();
    useOutboundSendSocket();
    useLinkedAccountRevoked();
    useLinkedAccountSignedOut();
    useCalendarSocket();
    useGlobalShortcuts();
    useSyncActiveAccountProfile();

    const cssLoaded = usePageStylesheet([pageStyles.customCss, pageStyles.inboxCss, pageStyles.scheduleCss, pageStyles.headerCss, pageStyles.settingsCss, pageStyles.responsiveCss]);
    const { isSidebarOpen, isSidebarExpandedMobile, setIsSidebarExpandedMobile } = useMailUI();
    const { isMobile } = useScreen();
    const { isSwitchingAccount } = useAccount();

    if (!cssLoaded) {
        return <AppLoader />;
    }

    return (
        <>
            {isSwitchingAccount && <AppLoader />}
            <main className="d-flex">
            {/* START: Left Side  */}
            <div className={`left-side-bar-main position-relative mainNav p-0 ${isMobile
                    ? (isSidebarExpandedMobile ? 'left-sidebar-main-collapsed-mobile' : '')
                    : (isSidebarOpen ? '' : 'left-sidebar-main-collapsed')
                }`}>
                <LeftPanel />
            </div>
            {/* END: Left Side  */}

            {/* Mobile Backdrop */}
            {isMobile && isSidebarExpandedMobile && (
                <div
                    className="mobile-sidebar-backdrop"
                    onClick={() => setIsSidebarExpandedMobile(false)}
                />
            )}

            {/* START: Right Side  */}
            <div className={`right-side-bar-main ${isSidebarOpen ? '' : 'right-side-bar-main-expanded'}`}>
                <RightPanel />
            </div>
            {/* END: Right Side  */}

            <MobileComposeFab />

            <ModalRoot />

            {/* AI "Find in mail" slide-over panel */}
            <Suspense fallback={null}>
                <AiChatPanel />
            </Suspense>
        </main>
        </>
    );
};

const AppLayout = () => {
    return (
        <>
            <SettingsProvider>
                <MailProviders>
                    <AppContent />
                </MailProviders>
            </SettingsProvider>
        </>
    )
}

export default AppLayout;