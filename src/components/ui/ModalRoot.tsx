import { lazy, Suspense } from 'react';
import { useMailUI } from '../../context/index';
const ComposeEmailModal = lazy(() => import('@features/compose/ComposeEmailModal'));
const ConfirmDelete = lazy(() => import('./Modals/ConfirmDelete'));
const Schedule = lazy(() => import('@components/ui/Modals/schedule/Schedule'));
const CalendarEventModal = lazy(() => import('@components/ui/Modals/CalendarEventModal/CalendarEventModal'));
const EventInfoModal = lazy(() => import('@components/ui/Modals/EventInfoModal'));
const EditRecurringModal = lazy(() => import('@components/ui/Modals/EditRecurringModal/EditRecurringModal'));
const CustomRecurrenceModal = lazy(() => import('@components/ui/Modals/CustomRecurrenceModal/CustomRecurrenceModal'));
const CreateCustomFolderModal = lazy(() => import('./Modals/CreateCustomFolder/CreateCustomFolderModal'));
const ChangeImapSmtpPasswordModal = lazy(() => import('@components/ui/Modals/PasswordChangeImapSmtp/changeImapSmtpPasswordModal'));
const SignatureModal = lazy(() => import('./Modals/SignatureModal/SignatureModal'));
const ChangePassword = lazy(() => import('@components/ui/Modals/ChangePassword/ChangePassword'));
const ForwardEmail = lazy(() => import('./Modals/forwardEmailModal/ForwardEmail'));
const MoveToFolderModal = lazy(() => import('./Modals/MoveToFolder/MoveToFolderModal'));
const EditRuleModal = lazy(() => import('./Modals/EditRuleModal/EditRuleModal'));

const BASE_Z_INDEX = 1050;
const Z_INDEX_STEP = 20;

function ModalRoot() {
    const { activeModals } = useMailUI();
    if (activeModals.length === 0) return null;

    return (
        <Suspense fallback={null}>
            {activeModals.map((modal, index) => {
                const zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP;

                switch (modal.type) {
                    case 'compose':
                        return (
                            <Suspense key={modal.id} fallback={null}>
                                <ComposeEmailModal
                                    key={modal.id}
                                    modalId={modal.id}
                                    zIndex={zIndex}
                                    {...modal.props}
                                />
                            </Suspense>
                        );

                    case 'confirmDelete':
                        return (
                            <ConfirmDelete
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );

                    case 'schedule':
                        return (
                            <Suspense key={modal.id} fallback={null}>
                                <Schedule
                                    key={modal.id}
                                    modalId={modal.id}
                                    zIndex={zIndex}
                                    {...modal.props}
                                />
                            </Suspense>
                        );

                    case 'calendarEvent':
                        return (
                            <CalendarEventModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );

                    case 'eventInfo':
                        return (
                            <EventInfoModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'recurrenceModal':
                        return (
                            <EditRecurringModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'customRecurrence':
                        return (
                            <CustomRecurrenceModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'createCustomFolder':
                        return (
                            <CreateCustomFolderModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'changeImapSmtpPassword':
                        return (
                            <ChangeImapSmtpPasswordModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'changePassword':
                        return (
                            <ChangePassword
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />

                        )

                    case 'createSignature':
                        return (
                            <SignatureModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )
                    case 'forwardIt':
                        return (
                            <ForwardEmail
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'moveToFolder':
                        return (
                            <MoveToFolderModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    case 'editRule':
                        return (
                            <EditRuleModal
                                key={modal.id}
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        )

                    default:
                        return null;
                }
            })}
        </Suspense>
    );
}

export default ModalRoot;