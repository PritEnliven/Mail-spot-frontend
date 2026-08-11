import AdminBottomNav from "@components/layout/adminLayout/AdminBottomNav";
import AdminLeftPanel from "@components/layout/adminLayout/AdminLeftPanel";
import AdminRightPanel from "@components/layout/adminLayout/AdminRightPanel";
import AdminModalRoot from "@components/ui/AdminModalRoot";
import { AdminProvider, useAdmin } from "@context/AdminDataContext";
import { useScreen } from "@context/ScreenContext";
import { pageStyles, usePageStylesheet } from "@hooks/usePageStyleSheet";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const AppContent = () => {
    usePageStylesheet([pageStyles.adminCss, pageStyles.headerCss, pageStyles.responsiveCss]);
    const { isSidebarOpen, isSidebarExpandedMobile, setIsSidebarExpandedMobile } = useAdmin();
    const { isMobile } = useScreen();

    const sidebarClass = isMobile
        ? (isSidebarExpandedMobile ? 'left-sidebar-main-collapsed-mobile' : 'left-sidebar-main-collapsed')
        : (isSidebarOpen ? '' : 'left-sidebar-main-collapsed');

    return (
        <main className={`d-flex admin-layout ${isMobile ? 'admin-layout--mobile' : ''}`}>
            <div className={`${sidebarClass} left-side-bar-main position-relative mainNav p-0`}>
                <AdminLeftPanel />
            </div>

            {isMobile && isSidebarExpandedMobile && (
                <div
                    className="sidebar-mobile-backdrop"
                    onClick={() => setIsSidebarExpandedMobile(false)}
                    aria-hidden="true"
                />
            )}

            <div className="right-side-bar-main">
                <AdminRightPanel />
            </div>

            {isMobile && <AdminBottomNav />}

            <AdminModalRoot />
        </main>
    );
};

const AppLayout = () => {
    return (
        <AdminProvider>
            <AppContent />
        </AdminProvider>
    );
};

export default AppLayout;
