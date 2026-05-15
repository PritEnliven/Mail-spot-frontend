
import { useAdminUI } from '@context/AdminUIContext';
import AdminChangePassword from '@components/ui/Modals/AdminChangePassword/AdminChangePassword';

const BASE_Z_INDEX = 1050;
const Z_INDEX_STEP = 20;

function AdminModalRoot() {
    const { activeModals } = useAdminUI();
    
    // Debug logs
    console.log('AdminModalRoot - activeModals:', activeModals);
    
    if (activeModals.length === 0) return null;

    return (
        <>
            {activeModals.map((modal, index) => {
                const zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP;

                switch (modal.type) {
                    case 'changePassword':
                        return (
                            <AdminChangePassword
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )
                    default:
                        return null;
                }
            })}
        </>
    );
}

export default AdminModalRoot;