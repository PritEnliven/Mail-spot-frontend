import { useAdminUI } from '@context/AdminUIContext';
import { lazy, Suspense } from 'react';

const AdminChangePassword = lazy(() => import('@components/ui/Modals/AdminChangePassword/AdminChangePassword'));
const AdminConfirmDelete = lazy(() => import('@components/ui/Modals/AdminConfirmDelete/AdminConfirmDelete'));
const AdminStandardHours = lazy(() => import('@components/ui/Modals/AdminStandardHours/AdminStandardHours'));

const BASE_Z_INDEX = 1050;
const Z_INDEX_STEP = 20;

function AdminModalRoot() {
    const { activeModals } = useAdminUI();

    if (activeModals.length === 0) return null;

    return (
        <>
            {activeModals.map((modal, index) => {
                const zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP;

                switch (modal.type) {
                    case 'changePassword':
                        return (
                            <Suspense fallback={null} key={modal.id}>
                                <AdminChangePassword
                                    modalId={modal.id}
                                    zIndex={zIndex}
                                    {...modal.props}
                                />
                            </Suspense>
                        );
                    case 'standardHours':
                        return (
                            <Suspense fallback={null} key={modal.id}>
                                <AdminStandardHours
                                    modalId={modal.id}
                                    zIndex={zIndex}
                                    {...modal.props}
                                />
                            </Suspense>
                        );
                    case 'deleteConfirmation':
                        return (
                            <Suspense fallback={null} key={modal.id}>
                                <AdminConfirmDelete
                                    modalId={modal.id}
                                    zIndex={zIndex}
                                    onConfirm={modal.props?.onConfirm}
                                />
                            </Suspense>
                        );
                    default:
                        return null;
                }
            })}
        </>
    );
}

export default AdminModalRoot;