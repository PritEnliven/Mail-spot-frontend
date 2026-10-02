import InteractiveIcon from "@components/ui/InteractiveIcon";
import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import { useMailUI } from "@context/MailUIContext";
import { createLocalFolderFormSchema, type CreateLocalFolderFormValues } from "./createLocalFolder.schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import BaseModal from "@components/ui/BaseModal";
import SubmitButton from "@components/ui/form/SubmitButton";
import ColorSingleSelect from "@components/ui/form/Select2ColorOption";
import { colorListConfi } from "../../../../config/fullCalendar.config";
import { useMailData } from "@context/MailDataContext";
import { createLocalFolder, renameLocalFolder } from "@services/localFolder/localFolderService";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import SimpleBar from "simplebar-react";

const defaultColor = colorListConfi.find(c => c.default)?.value ?? colorListConfi[0].value;

interface CreateLocalFolderModalProps {
    modalId: string;
    zIndex: number;
    folderName?: string;
    folderIconColor?: string;
    folderId?: string;
    isEdit?: boolean;
}

function CreateLocalFolderModal({
    modalId,
    zIndex,
    ...props
}: CreateLocalFolderModalProps) {
    const { setSidebarStateFromAPI } = useMailData();
    const { closeModal } = useMailUI();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateLocalFolderFormValues>({
        resolver: zodResolver(createLocalFolderFormSchema),
        defaultValues: {
            folderName: props.folderName ?? "",
            folderIconColor: props.folderIconColor ?? defaultColor,
            folderId: props.folderId,
            isEdit: props.isEdit,
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: CreateLocalFolderFormValues) => {
        const response = props.isEdit && props.folderId
            ? await renameLocalFolder({
                folderId: props.folderId,
                folderName: data.folderName,
                color: data.folderIconColor || null,
            })
            : await createLocalFolder({
                folderName: data.folderName,
                color: data.folderIconColor || null,
            });

        if (response.statusCode === 200 || response.folder || response.data?.folder) {
            showSuccess(`Local folder ${props.isEdit ? "updated" : "created"} successfully`);
            await setSidebarStateFromAPI();
            onClose();
            return;
        }

        const message =
            response?.message ||
            response?.error ||
            `Local folder ${props.isEdit ? "updated" : "created"} failed`;
        showError(typeof message === "string" ? message : "Something went wrong");
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
            showBackdrop={true}
            backdropClassName="modal-backdrop-transparent"
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div
                id="createLocalFolderModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-dialog modal-dialog-centered m-0">
                    <div className="modal-content modal-box-shadow-c1">
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
                            <h5 className="modal-title modal-title-center" id="createLocalFolderModalLabel">
                                {props.isEdit ? "Edit Local Folder" : "Create Local Folder"}
                            </h5>
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

                        <div className="modal-body folder-features-select-2 p-0">
                            <SimpleBar className="creat-folder-custom-modal" autoHide={true}>
                                <div className="d-block">
                                    <div className="form-group form-row mb-0">
                                        <label className="control-label">Folder Name</label>
                                    </div>
                                    <div className="d-flex align-items-start">
                                        <div className="form-group form-row mb-3 me-3 w-100">
                                            <Controller
                                                name="folderName"
                                                control={control}
                                                render={({ field }) => (
                                                    <input
                                                        type="text"
                                                        id="localFolderName"
                                                        className="form-control"
                                                        maxLength={100}
                                                        {...field}
                                                    />
                                                )}
                                            />
                                            {errors.folderName && (
                                                <div className="invalid-feedback d-block mb-2">
                                                    {errors.folderName.message}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-group m-0 form-row select2-color-pick color-pik folder-icon-color-pick">
                                            <div className="input-control">
                                                <Controller
                                                    name="folderIconColor"
                                                    control={control}
                                                    render={({ field }) => {
                                                        const selectedOption =
                                                            colorListConfi.find(opt => opt.value === field.value) ?? null;

                                                        return (
                                                            <ColorSingleSelect
                                                                value={selectedOption}
                                                                options={colorListConfi}
                                                                onChange={(option) => {
                                                                    field.onChange(option?.value ?? "");
                                                                }}
                                                            />
                                                        );
                                                    }}
                                                />
                                                {errors.folderIconColor && (
                                                    <div className="invalid-feedback d-block mb-2">
                                                        {errors.folderIconColor.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <button className="btn-new me-3" type="button" onClick={onClose}>
                                            Cancel
                                        </button>
                                        <SubmitButton
                                            className="btn-new loading-spinner"
                                            onClick={handleSubmit(onSubmit)}
                                        >
                                            Save
                                        </SubmitButton>
                                    </div>
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default CreateLocalFolderModal;
