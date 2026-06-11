import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import MailProviders from "../../context/MailProviders";
import ModalRoot from "@components/ui/ModalRoot";
import { useMailUI } from "@context/MailUIContext";
import { SettingsProvider } from "@context/SettingsContext";
import { useMailSocket } from "@hooks/useSocket";
import { usePageStylesheet, pageStyles } from "@hooks/usePageStyleSheet";
import AppLoader from "@components/layout/AppLoader";

const AppContent = () => {
    useMailSocket();
    const cssLoaded = usePageStylesheet([pageStyles.customCss, pageStyles.inboxCss, pageStyles.scheduleCss, pageStyles.headerCss, pageStyles.settingsCss, pageStyles.responsiveCss]);
    const { isSidebarOpen, isSidebarExpandedMobile } = useMailUI();

    if (!cssLoaded) {
        return <AppLoader />;
    }

    return (
        <main className="d-flex">
            {/* START: Left Side  */}
            <div className={`left-side-bar-main position-relative mainNav p-0 ${isSidebarOpen ? '' : 'left-sidebar-main-collapsed'} ${isSidebarExpandedMobile ? 'left-sidebar-main-collapsed-mobile' : ''} `}>
                <LeftPanel />
            </div>
            {/* END: Left Side  */}

            {/* START: Right Side  */}
            <div className={`right-side-bar-main ${isSidebarOpen ? '' : 'right-side-bar-main-expanded'}`}>
                <RightPanel />
            </div>
            {/* END: Right Side  */}

            <ModalRoot />
        </main>
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