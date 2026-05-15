import { Controller, useForm, useWatch } from 'react-hook-form';
import InteractiveIcon from "@components/ui/InteractiveIcon";
import closeIcon from "@images/close-icon.svg"
import closeIconHover from "@images/close-icon.svg"
import { adminSettingsSchema, type AdminSettingsFormValues } from './adminSettings.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import SubmitButton from '@components/ui/form/SubmitButton';
import { useEffect } from 'react';
import { useAdmin } from '@context/AdminDataContext';
import { adminSaveSettings, getAdminSettings } from '@services/adminService/adminService';
import type { Response } from '@models/Response';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
    const navigate = useNavigate();
    let { settingPayLoad } = useAdmin();
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        getValues,
        watch,
    } = useForm<AdminSettingsFormValues>({
        resolver: zodResolver(adminSettingsSchema),
        defaultValues: {
            name: "",
            email: "",
            fileSize: 0,
            fileExtensionInput: [],
            send: false,
            receive: false,
            both: false,
            aiFeatures: false,
            status: true,
        },
    });

    useEffect(() => {
        let isMounted = true;

        const fetchAdminSettings = async () => {
            if (!settingPayLoad) return;

            try {
                const response: Response = await getAdminSettings(settingPayLoad);
                console.log(response);

                if (isMounted && response.statusCode === 200) {
                    reset({
                        name: response.data.userName,
                        email: response.data.email,
                        fileSize: response.data.fileSize,
                        fileExtensionInput: response.data.allowedFileTypes,
                        send: response.data.sendToOutsideDomain,
                        receive: response.data.receiveFromOutsideDomain,
                        both: response.data.both,
                        aiFeatures: response.data.aiFeatures,
                        status: response.data.status
                    });
                }
            } catch (error) {
                console.error('Error fetching admin settings:', error);
            }
        };

        fetchAdminSettings();
    }, [settingPayLoad, reset]);

    const redirectToDashboard = () => {
        navigate('/admin/dashboard');
    }

    const onSubmit = async (data: any) => {
        console.log(data);
        const userId = settingPayLoad?.isAdmin ? null : settingPayLoad?.userId || null;

        let payload = {
            fileSize: data.fileSize,
            allowedFileTypes: data.fileExtensionInput,
            sendToOutsideDomain: data.send,
            receiveFromOutsideDomain: data.receive,
            both: data.both,
            aiFeatures: data.aiFeatures,
            isAdmin: settingPayLoad?.isAdmin ?? false,
            userId: userId,
            status: data.status
        }
        const response = await adminSaveSettings(payload);
        if (response.statusCode === 200) {
            showSuccess("Settings saved successfullly");
        }
        else {
            showError("Error while save settings")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.currentTarget.value.trim();
            if (input) {
                const currentExtensions = getValues('fileExtensionInput') || [];
                if (!currentExtensions.includes(input)) {
                    setValue('fileExtensionInput', [...currentExtensions, input]);
                    e.currentTarget.value = '';
                }
            }
        }
    };

    const removeExtension = (extensionToRemove: string) => {
        const currentExtensions = getValues('fileExtensionInput') || [];
        setValue('fileExtensionInput', currentExtensions.filter(ext => ext !== extensionToRemove));
    };

    return (
        <div>
            <div className="admin-setting-box" id="adminSettingBox">
                <div className="row m-0 row-p">
                    <div className={`col-lg-4 col-md-4 col-p ${settingPayLoad?.isAdmin ? 'd-none' : ''}`}>
                        <div className="form-group form-row ">
                            <label className="control-label" htmlFor="Name">
                                Name
                            </label>
                            <div className="input-control">
                                <Controller
                                    disabled
                                    name="name"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="name"
                                            placeholder="Add Name"
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={`col-lg-4 col-md-4 col-p ${settingPayLoad?.isAdmin ? 'd-none' : ''}`}>
                        <div className="form-group form-row ">
                            <label className="control-label" htmlFor="Email">
                                Email
                            </label>
                            <div className="input-control">
                                <Controller
                                    disabled
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="email"
                                            placeholder="Add Email"
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-4 col-p">
                        <div className="form-group form-row ">
                            <label className="control-label" htmlFor="file-size">
                                File size (in MB)
                            </label>
                            <div className="input-control">
                                <Controller
                                    name="fileSize"
                                    control={control}
                                    render={({ field: { onChange, value, ...field } }) => (
                                        <input
                                            type="number"
                                            className="form-control"
                                            id="file-size"
                                            placeholder="Add File size (MB)"
                                            value={value || ''}
                                            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-p">
                        <div className="form-group form-row mb-2">
                            <label className="control-label">Allowed file extensions</label>
                            <div className="input-control">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="fileExtensionInput"
                                    placeholder="Add extensions (e.g., doc, pdf)..."
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>
                        <div className="tags-input-container mb-4 d-flex flex-wrap gap-2">
                            {watch('fileExtensionInput')?.map((extension) => (
                                <span key={extension} className="input-tag d-flex align-items-center">
                                    <div className="file-icon-sprite">.{extension}</div>
                                    <button
                                        type="button"
                                        className="ms-2 hover-link btn p-0 bg-transparent border-0"
                                        onClick={() => removeExtension(extension)}
                                    >
                                        <InteractiveIcon
                                            defaultIcon={closeIcon}
                                            hoverIcon={closeIconHover}
                                            activeIcon=""
                                            isActive={false}
                                            alt="Remove"
                                            className="interactive-icon hover-image"
                                            renderAs="img"
                                            tooltip="Remove"
                                        />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="switch-settings">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="fs-12-commom">Send to outside domains</span>
                        <div className="switch-toggale d-flex align-items-center justify-content-center">
                            <Controller
                                name="send"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        ref={field.ref}
                                        name={field.name}
                                        id="send"
                                    />
                                )}
                            />
                            <label htmlFor="send">Toggle</label>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="fs-12-commom">Receive from outside domains</span>
                        <div className="switch-toggale d-flex align-items-center justify-content-center">
                            <Controller
                                name="receive"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        ref={field.ref}
                                        name={field.name}
                                        id="receive"
                                    />
                                )}
                            />
                            <label htmlFor="receive">Toggle</label>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="fs-12-commom">Both</span>
                        <div className="switch-toggale d-flex align-items-center justify-content-center">
                            <Controller
                                name="both"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        ref={field.ref}
                                        name={field.name}
                                        id="both"
                                    />
                                )}
                            />
                            <label htmlFor="both">Toggle</label>
                        </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="fs-12-commom">Ai features enabled or not</span>
                        <div className="switch-toggale d-flex align-items-center justify-content-center">
                            <Controller
                                name="aiFeatures"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        ref={field.ref}
                                        name={field.name}
                                        id="aiFeatures"
                                    />
                                )}
                            />
                            <label htmlFor="aiFeatures">Toggle</label>
                        </div>
                    </div>
                    <div className={`d-flex align-items-center justify-content-between mb-3 ${settingPayLoad?.isAdmin ? 'd-none' : ''}`}>
                        <span className="fs-12-commom">Status (Active/InActive)</span>
                        <div className="switch-toggale d-flex align-items-center justify-content-center">
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        ref={field.ref}
                                        name={field.name}
                                        id="status"
                                    />
                                )}
                            />
                            <label htmlFor="status">Toggle</label>
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-center mt-5">
                    <button className="btn-new mb-0 me-3" onClick={redirectToDashboard}>
                        Cancel
                    </button>
                    <SubmitButton
                        className="btn-new ms-3 send-btn d-flex align-items-center loading-spinner"
                        onClick={handleSubmit(onSubmit, (errors: any) => {
                            console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                        })}
                    >Save</SubmitButton>
                </div>
            </div>

        </div >
    )
}

export default AdminSettings;