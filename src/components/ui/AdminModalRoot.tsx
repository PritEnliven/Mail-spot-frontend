
import { useAdminUI } from '@context/AdminUIContext';
import { lazy, Suspense } from 'react';
const AdminChangePassword = lazy(() => import('@components/ui/Modals/AdminChangePassword/AdminChangePassword'));

const BASE_Z_INDEX = 1050;
const Z_INDEX_STEP = 20;

function AdminModalRoot() {
    const { activeModals } = useAdminUI();
    
    // Debug logs    
    if (activeModals.length === 0) return null;

    return (
        <>
            {activeModals.map((modal, index) => {
                const zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP;

                switch (modal.type) {
                    case 'changePassword':
                        return (
                            <Suspense fallback={null}>
                                <AdminChangePassword
                                    modalId={modal.id}
                                    zIndex={zIndex}
                                    {...modal.props}
                                />
                            </Suspense>
                        )
                    default:
                        return null;
                }
            })}
        </>
    );
}

export default AdminModalRoot;