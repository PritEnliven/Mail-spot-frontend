
// import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
// import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
// import closeIcon from "@images/close-icon.svg";
// import closeIconHover from "@images/close-icon-hover.svg";
// import InteractiveIcon from "@components/ui/InteractiveIcon";
// import { useMailUI } from "@context/MailUIContext";
// import { createCustomFolderFormSchema, type CreateCustomFolderFormValues } from "./createCustomFolder.schema";
// import { Controller, useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import Select2Wrapper from "@components/ui/form/Select2Wrapper";
// import BaseModal from "@components/ui/BaseModal";
// import SubmitButton from "@components/ui/form/SubmitButton";
// import ColorSingleSelect from "@components/ui/form/Select2ColorOption";
// import { colorListConfi } from "../../../../config/fullCalendar.config";
// import { useMailData } from "@context/MailDataContext";
// import { createCustomBox } from "@services/customBox/customBoxService";
// import { showSuccess } from "@components/ui/toast/toastNotification";
// import { useMemo } from "react";
// import { buildParentFolderOptions } from "@utils/emailUtil";
// import SimpleBar from "simplebar-react";

// const defaultColor = colorListConfi.find(c => c.default)?.value ?? colorListConfi[0].value;

// interface CreateCustomFoldarModlaProps {
//     modalId: string;
//     zIndex: number;
//     folderName?: string;
//     folderIconColor?: string;
//     parentFolder?: string;
//     editFolderId?: string;
//     isEdit?: boolean;
// }

// function CreateCustomFolderModal(
//     { modalId, zIndex, ...props }: CreateCustomFoldarModlaProps
// ) {

//     const { sidebarState, setSidebarStateFromAPI } = useMailData();
//     const { closeModal } = useMailUI();

//     const parentFolderOptions = useMemo(
//         () => buildParentFolderOptions([], sidebarState.customBoxes, props.editFolderId),
//         [sidebarState.customBoxes, props.editFolderId]
//     );

//     const {
//         control,
//         handleSubmit,
//         reset,
//         formState: { errors }
//     } = useForm<CreateCustomFolderFormValues>({
//         resolver: zodResolver(createCustomFolderFormSchema),
//         defaultValues: {
//             folderName: props.folderName,
//             folderIconColor: props.folderIconColor ?? defaultColor,
//             parentFolder: props.parentFolder,
//             editFolderId: props.editFolderId,
//             isEdit: props.isEdit,
//         },
//     });

//     const onClose = () => {
//         reset();
//         closeModal(modalId);
//     };

//     const onSubmit = async (data: any) => {
//         if (props.isEdit) {
//             data.isEdit = true;
//             data.editFolderId = props.editFolderId;
//         }
//         const response = await createCustomBox(data);
//         if (response.statusCode === 200) {
//             showSuccess(`Folder ${props.isEdit ? 'updated' : 'created'} successfully`);
//             setSidebarStateFromAPI();
//             onClose();
//         }
//         else {
//             showSuccess(`Folder ${props.isEdit ? 'updated' : 'created'} failed`);
//         }
//     };

//     return (
//         <BaseModal
//             isOpen={true}
//             onClose={onClose}
//             zIndex={zIndex}
//             className=""
//             closeOnBackdrop={true}
//             closeOnEsc={true}
//             draggable={true}
//             dragHandleSelector=".drag-handle"
//             width="min(100vw, 498px)"
//         >
//             <div
//                 id="createFolderModal"
//                 style={{ zIndex }}
//                 role="dialog"
//                 aria-modal="true"
//             >
//                 <div className="modal-dialog modal-dialog-centered m-0">
//                     <div className="modal-content modal-box-shadow-c1">
//                         <div className="modal-header drag-handle">
//                             <button className="expand-btn btn hover-link icon-hover-effect drag-handle-btn">
//                                 <InteractiveIcon
//                                     defaultIcon={arrowPointingOutIcon}
//                                     hoverIcon={arrowPointingOutIconHover}
//                                     activeIcon=""
//                                     isActive={false}
//                                     alt=""
//                                     className="interactive-icon hover-image"
//                                     renderAs="img"
//                                     tooltip="Move"
//                                 />
//                             </button>
//                             <h5 className="modal-title modal-title-center" id="createFolderModalLabel">
//                                 Create Folder
//                             </h5>
//                             <button type="button" className="btn-close hover-link btn icon-hover-effect" onClick={onClose}>
//                                 <InteractiveIcon
//                                     defaultIcon={closeIcon}
//                                     hoverIcon={closeIconHover}
//                                     activeIcon=""
//                                     isActive={false}
//                                     alt=""
//                                     className="interactive-icon hover-image"
//                                     renderAs="img"
//                                     tooltip="Close"
//                                 />
//                             </button>
//                         </div>

//                         <div className="modal-body folder-features-select-2 p-0">
//                             <SimpleBar
//                                 className="creat-folder-custom-modal"
//                                 autoHide={true}
//                             >
//                                 <div className="d-block">
//                                     <div className="form-group form-row mb-0">
//                                         <label className="control-label">Folder Name</label>
//                                     </div>
//                                     <div className="d-flex align-items-start">
//                                         <div className="form-group form-row mb-3 me-3 w-100">
//                                             <Controller
//                                                 name="folderName"
//                                                 control={control}
//                                                 render={({ field }) => (
//                                                     <input
//                                                         type="text"
//                                                         id="folderName"
//                                                         className={`form-control`}
//                                                         {...field}
//                                                     />
//                                                 )}
//                                             />
//                                             {errors.folderName && (
//                                                 <div className="invalid-feedback d-block mb-2">{errors.folderName.message}</div>
//                                             )}
//                                         </div>
//                                         <div className="form-group m-0 form-row select2-color-pick color-pik folder-icon-color-pick">
//                                             <div className="input-control">
//                                                 <Controller
//                                                     name="folderIconColor"
//                                                     control={control}
//                                                     render={({ field }) => {
//                                                         const selectedOption =
//                                                             colorListConfi.find(opt => opt.value === field.value) ?? null;

//                                                         return (
//                                                             <ColorSingleSelect
//                                                                 value={selectedOption}
//                                                                 options={colorListConfi}
//                                                                 onChange={(option) => {
//                                                                     field.onChange(option?.value ?? "");
//                                                                 }}
//                                                             />
//                                                         );
//                                                     }}
//                                                 />
//                                                 {errors.folderIconColor && (
//                                                     <div className="invalid-feedback d-block mb-2">{errors.folderIconColor.message}</div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="form-group form-row w-100 mb-0">
//                                         <label className="control-label">Parent Folder</label>
//                                         <div className="input-control">
//                                             <Controller
//                                                 name="parentFolder"
//                                                 control={control}
//                                                 render={({ field }) => (
//                                                     <Select2Wrapper
//                                                         {...field}
//                                                         options={parentFolderOptions}
//                                                         placeholder="Select one"
//                                                         isMulti={false}
//                                                         value={field.value || null}
//                                                         isModal={true}
//                                                     />
//                                                 )}
//                                             />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </SimpleBar>
//                         </div>

//                         {/* Compact Footer */}
//                         <div className="modal-footer d-flex align-items-center justify-content-between px-3 pb-3 pt-2">
//                             <button className="btn-new me-3" type="button" onClick={onClose}>
//                                 Cancel
//                             </button>
//                             <SubmitButton
//                                 className="btn-new loading-spinner"
//                                 onClick={handleSubmit(onSubmit, (errors: any) => {
//                                     console.log('SUBMIT BLOCKED BY ERRORS:', errors);
//                                 })}
//                             >
//                                 Save
//                             </SubmitButton>
//                         </div>

//                     </div>
//                 </div>
//             </div>
//         </BaseModal>
//     );
// }

// export default CreateCustomFolderModal;










import arrowPointingOutIcon from "@images/arrows-pointing-out-icon.svg";
import arrowPointingOutIconHover from "@images/arrows-pointing-out-icon-hover.svg";
import closeIcon from "@images/close-icon.svg";
import closeIconHover from "@images/close-icon-hover.svg";
import InteractiveIcon from "@components/ui/InteractiveIcon";
import { useMailUI } from "@context/MailUIContext";
import { createCustomFolderFormSchema, type CreateCustomFolderFormValues } from "./createCustomFolder.schema";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import BaseModal from "@components/ui/BaseModal";
import SubmitButton from "@components/ui/form/SubmitButton";
import ColorSingleSelect from "@components/ui/form/Select2ColorOption";
import { colorListConfi } from "../../../../config/fullCalendar.config";
import { useMailData } from "@context/MailDataContext";
import { createCustomBox } from "@services/customBox/customBoxService";
import { showError, showSuccess } from "@components/ui/toast/toastNotification";
import { useMemo } from "react";
import { buildParentFolderOptions, isCustomFolderDepthAllowed } from "@utils/emailUtil";
import {
    CUSTOM_FOLDER_DEPTH_LIMIT_MESSAGE,
    NO_PARENT_FOLDER_VALUE,
} from "@constants/customFolder";
import SimpleBar from "simplebar-react";

const defaultColor = colorListConfi.find(c => c.default)?.value ?? colorListConfi[0].value;

interface CreateCustomFoldarModlaProps {
    modalId: string;
    zIndex: number;
    folderName?: string;
    folderIconColor?: string;
    parentFolder?: string;
    editFolderId?: string;
    isEdit?: boolean;
}

function CreateCustomFolderModal(
    { modalId, zIndex, ...props }: CreateCustomFoldarModlaProps
) 
{
    const { sidebarState, setSidebarStateFromAPI } = useMailData();
    const { closeModal } = useMailUI();

    const editFolderImap = useMemo(() => {
        if (!props.isEdit || !props.editFolderId) return undefined;
        const box = sidebarState.customBoxes.find(
            (b: any) => b.value?._id === props.editFolderId || b.value?.value === props.editFolderId
        );
        return box ? (typeof box.value === "object" ? box.value.value : box.value) : undefined;
    }, [props.isEdit, props.editFolderId, sidebarState.customBoxes]);

    const parentFolderOptions = useMemo(
        () => buildParentFolderOptions([], sidebarState.customBoxes, editFolderImap),
        [sidebarState.customBoxes, editFolderImap]
    );

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors }
    } = useForm<CreateCustomFolderFormValues>({
        resolver: zodResolver(createCustomFolderFormSchema),
        defaultValues: {
            folderName: props.folderName,
            folderIconColor: props.folderIconColor ?? defaultColor,
            parentFolder: props.parentFolder || NO_PARENT_FOLDER_VALUE,
            editFolderId: props.editFolderId,
            isEdit: props.isEdit,
        },
    });

    const onClose = () => {
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: CreateCustomFolderFormValues) => {
        if (!isCustomFolderDepthAllowed(data.parentFolder, parentFolderOptions)) {
            setError("parentFolder", { type: "manual", message: CUSTOM_FOLDER_DEPTH_LIMIT_MESSAGE });
            showError(CUSTOM_FOLDER_DEPTH_LIMIT_MESSAGE);
            return;
        }

        const payload: any = { ...data };

        if (props.isEdit) {
            payload.isEdit = true;
            payload.editFolderId = props.editFolderId;
        }
        
        const response = await createCustomBox(payload);
        if (response.statusCode === 200) {
            showSuccess(`Folder ${props.isEdit ? 'updated' : 'created'} successfully`);
            setSidebarStateFromAPI();
            onClose();
        }
        else {
            const message =
                response?.message ||
                response?.error ||
                `Folder ${props.isEdit ? 'updated' : 'created'} failed`;
            showError(typeof message === "string" ? message : CUSTOM_FOLDER_DEPTH_LIMIT_MESSAGE);
        }
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
            width="min(100vw, 498px)"
        >
            <div
                id="createFolderModal"
                style={{ zIndex }}
                role="dialog"
                aria-modal="true">
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
                            <h5 className="modal-title modal-title-center" id="createFolderModalLabel">
                                Create Folder
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

                        <div
                            className="modal-body folder-features-select-2 p-0"
                        >
                            <SimpleBar
                                className="creat-folder-custom-modal"
                                autoHide={true}
                            >
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
                                                        id="folderName"
                                                        className={`form-control`}
                                                        {...field}
                                                    />
                                                )}
                                            />
                                            {errors.folderName && (
                                                <div className="invalid-feedback d-block mb-2">{errors.folderName.message}</div>
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
                                                    <div className="invalid-feedback d-block mb-2">{errors.folderIconColor.message}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group form-row w-100 mb-3 me-3">
                                        <label className="control-label">Parent Folder</label>
                                        <div className="input-control">
                                            <Controller
                                                name="parentFolder"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select2Wrapper
                                                        {...field}
                                                        options={parentFolderOptions}
                                                        placeholder="Select one"
                                                        isMulti={false}
                                                        value={field.value || null}
                                                    />
                                                )}
                                            />
                                            {errors.parentFolder && (
                                                <div className="invalid-feedback d-block mb-2">{errors.parentFolder.message}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <button className="btn-new me-3" type="button" onClick={onClose}>
                                            Cancel
                                        </button>
                                        <SubmitButton
                                            className="btn-new loading-spinner"
                                            onClick={handleSubmit(onSubmit, (errors: any) => {
                                                console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                                            })}
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
        </BaseModal >
    )
};

export default CreateCustomFolderModal;