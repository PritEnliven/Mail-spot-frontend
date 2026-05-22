import AdminHeader from "@components/layout/AdminHeader/AdminHeader";
import { useAdmin } from "@context/AdminDataContext";
import { Outlet } from "react-router-dom";

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