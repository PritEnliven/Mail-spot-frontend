import { lazy, Suspense, type ReactNode } from 'react';
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
        <>
            {activeModals.map((modal, index) => {
                const zIndex = BASE_Z_INDEX + index * Z_INDEX_STEP;
                let content: ReactNode = null;

                switch (modal.type) {
                    case 'compose':
                        content = (
                            <ComposeEmailModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'confirmDelete':
                        content = (
                            <ConfirmDelete
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'schedule':
                        content = (
                            <Schedule
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'calendarEvent':
                        content = (
                            <CalendarEventModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'eventInfo':
                        content = (
                            <EventInfoModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'recurrenceModal':
                        content = (
                            <EditRecurringModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'customRecurrence':
                        content = (
                            <CustomRecurrenceModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'createCustomFolder':
                        content = (
                            <CreateCustomFolderModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'changeImapSmtpPassword':
                        content = (
                            <ChangeImapSmtpPasswordModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'changePassword':
                        content = (
                            <ChangePassword
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'createSignature':
                        content = (
                            <SignatureModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'forwardIt':
                        content = (
                            <ForwardEmail
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'moveToFolder':
                        content = (
                            <MoveToFolderModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    case 'editRule':
                        content = (
                            <EditRuleModal
                                modalId={modal.id}
                                zIndex={zIndex}
                                {...modal.props}
                            />
                        );
                        break;

                    default:
                        content = null;
                }

                if (!content) return null;

                return (
                    <Suspense key={modal.id} fallback={null}>
                        {content}
                    </Suspense>
                );
            })}
        </>
    );
}

export default ModalRoot;
