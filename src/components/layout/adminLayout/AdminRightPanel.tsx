import AdminHeader from "@components/layout/AdminHeader/AdminHeader";
import { Outlet } from "react-router-dom";
import { useAdmin } from "@context/AdminDataContext";

const AdminRightPanel = () => {
    const { adminBoxTitle } = useAdmin();
    return (
        <>
            <AdminHeader title={adminBoxTitle} />
            <Outlet />
        </>
    );
}

export default AdminRightPanel;