import InteractiveIcon from "@components/ui/InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import trashIconDeleteBox from "@images/trash-icon-delete-box-red.svg";
import { useAdminUI } from "@context/AdminUIContext";
import SubmitButton from "@components/ui/form/SubmitButton";
import BaseModal from "@components/ui/BaseModal";

interface AdminConfirmDeleteProps {
    modalId: string;
    zIndex: number;
    onConfirm: () => Promise<void> | void;
}

function AdminConfirmDelete({ modalId, zIndex, onConfirm }: AdminConfirmDeleteProps) {
    const { closeModal } = useAdminUI();

    const handleConfirm = async () => {
        try {
            await onConfirm();
            closeModal(modalId);
        } catch (error) {
            console.error('Error in confirmation:', error);
            throw error;
        }
    };

    const onClose = () => closeModal(modalId);

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            className=""
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div className="modal-delete-box modal-center-draggable">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header drag-handle">
                            <button className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
                                <InteractiveIcon
                                    defaultIcon={arrowPointingOutIcon}
                                    hoverIcon={arrowPointingOutIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Move"
                                />
                            </button>
                            <h5 className="modal-title modal-title-center">Confirm to Delete</h5>
                            <button
                                type="button"
                                className="btn-close hover-link btn icon-hover-effect"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <InteractiveIcon
                                    defaultIcon={closeIcon}
                                    hoverIcon={closeIconHover}
                                    activeIcon=""
                                    isActive={false}
                                    alt=""
                                    className="interactive-icon hover-image"
                                    renderAs="img"
                                    tooltip="Close"
                                />
                            </button>
                        </div>
                        <div className="modal-body" data-simplebar data-simplebar-auto-hide="false">
                            <p className="text-center mb-4 d-flex align-items-center">
                                <img src={trashIconDeleteBox} alt="" className="me-2" />
                                Are you sure you want to delete this user?
                            </p>
                            <div className="d-flex align-items-center justify-content-between">
                                <button className="btn-new me-3" type="button" onClick={onClose}>No</button>
                                <SubmitButton
                                    className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                                    onClick={handleConfirm}
                                >
                                    Yes
                                </SubmitButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default AdminConfirmDelete;
