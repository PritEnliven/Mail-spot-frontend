import AdminLeftPanel from "@components/layout/adminLayout/AdminLeftPanel";
import AdminRightPanel from "@components/layout/adminLayout/AdminRightPanel";
import AdminModalRoot from "@components/ui/AdminModalRoot";
import { AdminProvider, useAdmin } from "@context/AdminDataContext";
import { pageStyles, usePageStylesheet } from "@hooks/usePageStyleSheet";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Create a new component that will be wrapped by MailProviders
const AppContent = () => {
    usePageStylesheet([pageStyles.adminCss, pageStyles.headerCss]);
    const { isSidebarOpen } = useAdmin();
    return (
        <main className="d-flex admin-layout">
            {/* START: Left Side  */}
            <div className={`${isSidebarOpen ? '' : 'left-sidebar-main-collapsed'} left-side-bar-main position-relative mainNav p-0`}>
                <AdminLeftPanel />
            </div>
            {/* END: Left Side  */}

            {/* START: Right Side  */}
            <div className="right-side-bar-main">
                <AdminRightPanel />
            </div>
            {/* END: Right Side  */}

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