import { Controller, useForm, useWatch } from 'react-hook-form';
import InteractiveIcon from "../../InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import { useContacts } from '@context/ContactsContext';
import { forwardEmailSchema, type forwardEmailFormValues } from './forwardEmail.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import BaseModal from '@components/ui/BaseModal';
import { useMailUI } from '@context/MailUIContext';
import GuestTag from '@components/ui/calendar/GuestTag';
import { copyEmailToClipBoard } from "@utils/generalUtil";
import { parseEmailAddress } from "@utils/emailUtil";

interface ForwardEmailProps {
    modalId: string,
    zIndex: number;
    initialForwardEmailList?: string[];
    onConfirm: (data: forwardEmailFormValues) => Promise<void> | void;
}

function ForwardEmail({ modalId, zIndex, initialForwardEmailList, onConfirm }: ForwardEmailProps) {

    const { closeModal } = useMailUI();
    const {
        control,
        handleSubmit,
        reset,
    } = useForm<forwardEmailFormValues>({
        resolver: zodResolver(forwardEmailSchema),
        mode: "onSubmit",
        defaultValues: {
            forwardToEmailList: initialForwardEmailList || [],
        },
    });

    const formValues = useWatch({ control });

    const onSubmit = async (data: forwardEmailFormValues) => {
        await onConfirm(data);
        onClose();
    }

    const onClose = () => {
        reset({ forwardToEmailList: [] });
        closeModal(modalId);
    }

    const { contacts } = useContacts();

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
            <div className="forward-it-modal modal-center-draggable">
                <div className="modal-dialog modal-dialog-centered ">
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
                            <h1 className="modal-title modal-title-center" id="addForwardEmailAddressModalLabel">Forward it</h1>
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
                        <div className="modal-body">
                            <div className="form-group form-row select2-profile mb-2">
                                <label className="control-label">Enter email</label>
                                <div className="input-control">
                                    <Controller
                                        name="forwardToEmailList"
                                        control={control}
                                        render={({ field }) => (
                                            <Select2Wrapper
                                                value={field.value || []}
                                                onChange={field.onChange}
                                                options={contacts}
                                                placeholder="Select or type to add"
                                                isMulti={true}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="form-group  mb-0 mail-tag-add-to-bottom">
                                <div className="">
                                    <div className="d-block selected-tags-addmail">
                                        <div className="tag-addmail-box-main-t forward-emailList" id="eventInfoGuestList">
                                            {formValues?.forwardToEmailList?.length
                                                ? formValues.forwardToEmailList.map((email, index) => {
                                                    const parsedEmail = parseEmailAddress(email);
                                                    return (
                                                        <GuestTag
                                                            key={`${email}-${index}`}
                                                            guest={{
                                                                email: parsedEmail.email,
                                                                name: parsedEmail.name,
                                                            }}
                                                            mode="view"
                                                            onCopy={() => copyEmailToClipBoard(parsedEmail.email)}
                                                        />
                                                    );
                                                })
                                                : <p className="m-0">No Guests</p>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="compose-btn-box d-flex align-items-center justify-content-between pt-2" style={{ bottom: 'unset' }}>
                            <button type="button" className="btn-new" onClick={onClose}>Cancel</button>
                            <button className="btn-new btn-new-bg"
                                onClick={handleSubmit(onSubmit)}
                            >Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}
export default ForwardEmail;