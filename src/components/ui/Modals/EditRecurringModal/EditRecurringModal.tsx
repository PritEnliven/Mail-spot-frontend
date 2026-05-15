import InteractiveIcon from "@components/ui/InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import BaseModal from "@components/ui/BaseModal";
import { useMailUI } from "@context/MailUIContext";
import { Controller, useForm } from "react-hook-form";

interface EditRecurringModalProps {
    modalId: string;
    zIndex: number;
    onConfirm?: (editType: 'thisEvent' | 'thisAndFollowingEvent' | 'allEvent') => void;
}

interface EditRecurringFormValues {
    eventEditType: 'thisEvent' | 'thisAndFollowingEvent' | 'allEvent';
}

function EditRecurringModal({ modalId, zIndex, onConfirm }: EditRecurringModalProps) {
    const { closeModal } = useMailUI();

    const {
        control,
        handleSubmit,
        reset,
    } = useForm<EditRecurringFormValues>({
        mode: "onSubmit",
        defaultValues: {
            eventEditType: 'thisEvent',
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onSubmit = (data: EditRecurringFormValues) => {
        if (onConfirm) {
            onConfirm(data.eventEditType);
        }
        onClose();
    };

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
            width="min(100vw, 360px)"
        >
            <div
                className="edit-recurring-modal"
                id="editRecurringModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-w-640 modal-box-shadow-c1">
                        <div className="modal-header drag-handle">
                            <button className="btn hover-link icon-hover-effect drag-handle-btn">
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
                            <h1 className="modal-title modal-title-center" id="editRecurringModalLabel">Edit recurring event</h1>
                            <button type="button" className="btn-close hover-link btn icon-hover-effect" onClick={onClose}>
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
                            <div className="radio-group">
                                <div className="form-group" id="thisEventSection">
                                    <Controller
                                        name="eventEditType"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="radio-wrapper sm-label-fs">This Event
                                                <input
                                                    type="radio"
                                                    value="thisEvent"
                                                    checked={field.value === 'thisEvent'}
                                                    onChange={() => field.onChange('thisEvent')}
                                                />
                                                <span className="custom-radio"></span>
                                            </label>
                                        )}
                                    />
                                </div>
                                <div className="form-group" id="thisAndFollowingEventSection">
                                    <Controller
                                        name="eventEditType"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="radio-wrapper sm-label-fs">This and following events
                                                <input
                                                    type="radio"
                                                    value="thisAndFollowingEvent"
                                                    checked={field.value === 'thisAndFollowingEvent'}
                                                    onChange={() => field.onChange('thisAndFollowingEvent')}
                                                />
                                                <span className="custom-radio"></span>
                                            </label>
                                        )}
                                    />
                                </div>
                                <div className="form-group mb-4" id="allEventSection">
                                    <Controller
                                        name="eventEditType"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="radio-wrapper sm-label-fs">All events
                                                <input
                                                    type="radio"
                                                    value="allEvent"
                                                    checked={field.value === 'allEvent'}
                                                    onChange={() => field.onChange('allEvent')}
                                                />
                                                <span className="custom-radio"></span>
                                            </label>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <button type="button" onClick={handleSubmit(onSubmit)} className="btn-new btn-new-bg loading-spinner"> Confirm </button>
                                <button type="button" className="btn-new" onClick={onClose}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default EditRecurringModal;