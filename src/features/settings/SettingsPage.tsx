import InteractiveIcon from "@components/ui/InteractiveIcon";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import SubmitButton from '@components/ui/form/SubmitButton';
import RulesList, { type Rule } from '@components/ui/settings/RulesList';
import SignatureList from '@components/ui/settings/SignatureList';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailData } from '@context/MailDataContext';
import { useMailUI } from '@context/MailUIContext';
import { useSettings } from '@context/SettingsContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { pageStyles, usePageStylesheet } from '@hooks/usePageStyleSheet';
import plusIconHover from "@images/plus-icon-hover.svg";
import plusIcon from "@images/plus-icon.svg";
import { deleteRule, deleteSignature, getAllRules, getSettings, saveSettings } from '@services/settings/settingsService';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { SettingsSchema, type SettingPageFormValues, type Signature } from './settings.schema';

const CkEditorRichText = lazy(() => import('@components/ui/CkEditor/CkEditorRichText'));

declare global {
    interface Window {
        electron?: {
            ipcRenderer?: {
                invoke: (channel: string, ...args: any[]) => Promise<any>;
            };
        };
    }
}

function SettingsPage() {
    usePageStylesheet([pageStyles.settingsCss]);
    const { setBoxName } = useMailData();
    const { openModal } = useMailUI();
    const { updateSettings } = useSettings();
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
    const [rules, setRules] = useState<any[]>([]);
    // const folderInputRef = useRef<HTMLInputElement>(null);

    const {
        control,
        handleSubmit,
        reset,
    } = useForm<SettingPageFormValues>({
        resolver: zodResolver(SettingsSchema as any),
        mode: "onSubmit",
        defaultValues: {
            undoSendPeriod: 0,
            maximumPageSize: 20,
            markAsReadDelay: 0,
            recoveryEmail: "",
            enableSignature: false,
            enableReplyForwardUse: false,
            threadView: true,
            downloadLocation: "",
            notification: true,
            body: "",
        },
    });

    const loadSettings = async () => {
        try {
            const response = await getSettings();
            const defaultSignature = response.data.signatures?.find((sig: Signature) => sig.isDefault);
            setSignatures(response.data.signatures ?? []);
            setSelectedSignature(defaultSignature ?? null);

            const rawPageSize = response.data.pageSize;
            const pageSize = typeof rawPageSize === 'number'
                ? rawPageSize
                : Number(rawPageSize);
            const safePageSize = Number.isFinite(pageSize) ? pageSize : 20;

            updateSettings({
                undoSendPeriod: response.data.undoSendPeriod ?? 0,
                pageSize: safePageSize,
                enableSignature: response.data.enableSignature ?? false,
                enableReplyForwardUse: response.data.enableReplyForwardUse ?? false,
                threadView: response.data.threadView ?? true,
                downloadLocation: response.data.downloadLocation ?? '',
                notification: response.data.notification ?? true,
                recoveryEmail: response.data.recoveryEmail ?? '',
                markAsReadDelay: response.data.markAsReadDelay ?? 0
            });

            reset({
                undoSendPeriod: response.data.undoSendPeriod ?? 0,
                markAsReadDelay: response.data.markAsReadDelay ?? 0,
                maximumPageSize: safePageSize,
                recoveryEmail: response.data.recoveryEmail ?? '',
                enableSignature: response.data.enableSignature ?? false,
                signatureId: defaultSignature?.id ?? '',
                enableReplyForwardUse: response.data.enableReplyForwardUse ?? false,
                threadView: response.data.threadView ?? true,
                downloadLocation: response.data.downloadLocation ?? '',
                notification: response.data.notification ?? true,
                body: defaultSignature?.body ?? response.data.body ?? ''
            });
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    const loadRules = async () => {
        try {
            const response = await getAllRules();
            if (response.statusCode === 200) {
                setRules(response.data ?? []);
            }
        } 
        catch (error) {
            console.error('Failed to load settings', error);
        }
    }

    useEffect(() => {
        setBoxName('settings');
        loadSettings();
        loadRules();
    }, [setBoxName, reset])

    async function resetSignatureSettings() {
        const response = await getSettings();
        const defaultSignature = response.data.signatures?.find((sig: Signature) => sig.isDefault);
        setSignatures(response.data.signatures ?? []);
        setSelectedSignature(defaultSignature ?? null);
    }

    const handleCreateSignature = () => {
        openModal('createSignature', {
            onSuccess: async () => {
                resetSignatureSettings();
            }
        });
    };

    const handleSelectSignature = (id: string) => {
        const signature = signatures.find(sig => sig.id === id) || null;
        setSelectedSignature(signature);

        if (signature) {
            // Update editor body when signature changes
            reset(prev => ({ ...prev, body: signature.body }));
        }
    };

    function handleEdit(id: string) {
        let signature: any = signatures.find(sig => sig.id === id) || null;
        signature.isEdit = true;
        const editSignatureProps = {
            isEdit: true,
            signatureId: signature.id,
            signatureName: signature.name,
            isDefaultSignature: signature.isDefault,
        }
        openModal('createSignature', {
            ...editSignatureProps,
            onSuccess: async () => {
                resetSignatureSettings();
            }
        })
    }

    async function handleEditRule(rule: Rule) {
        openModal('editRule', {
            rule,
            onSuccess: () => loadRules(),
        });
    }

    async function handleDelete(id: string) {
        const response = await deleteSignature({ signatureId: id });
        if (response.statusCode === 200) {
            showSuccess("Signature deleted successfully");
            resetSignatureSettings();
            loadSettings();
        }
        else {
            showError(response.message);
        }
    }

    async function onSubmit(data: SettingPageFormValues) {
        try {
            let payload = {
                ...data,
                pageSize: data.maximumPageSize,
                signatureBody: data.body || '',
                signatureId: data.signatureId || '',
                recoveryEmail: data.recoveryEmail || '',
                signatures: undefined,
                threadView: data.threadView,
                downloadLocation: data.downloadLocation || '',
                notification: data.notification
            };
            payload.signatureId = selectedSignature?.id || '';
            const response = await saveSettings(payload);
            if (response.statusCode === 200) {
                showSuccess("Settings saved successfully");
                resetSignatureSettings();
                updateSettings({
                    undoSendPeriod: data.undoSendPeriod,
                    pageSize: data.maximumPageSize,
                    enableSignature: data.enableSignature,
                    enableReplyForwardUse: data.enableReplyForwardUse,
                    threadView: data.threadView,
                    downloadLocation: data.downloadLocation || '',
                    notification: data.notification,
                    recoveryEmail: data.recoveryEmail || '',
                    markAsReadDelay: data.markAsReadDelay
                });
            }
            else {
                showError("Failed to save settings");
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showError("An error occurred while saving settings");
        }
    }

    async function handleDeleteRule(ruleId: string) {
        const response = await deleteRule({ ruleId: ruleId });
        if (response.statusCode === 200) {
            showSuccess("Rule deleted successfully");
            loadRules();
        }
        else {
            showError(response.message);
        }
    }

    const setupDeleteConfirmation = (ruleId: string) => {
        openModal('confirmDelete', {
            onConfirm: () => handleDeleteRule(ruleId)
        })
    }

    // ─── Folder Picker Logic ───────────────────────────────────────────
    // const handleFolderPick = async () => {
    //     // 1. Browser FIRST
    //     if ('showDirectoryPicker' in window) {
    //         try {
    //             const dirHandle = await (window as Window & {
    //                 showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    //             }).showDirectoryPicker();

    //             // UI
    //             setValue('downloadLocation', dirHandle.name, { shouldDirty: true });

    //             showSuccess(`Download folder set to "${dirHandle.name}"`);

    //             return;
    //         } catch (err: any) {
    //             if (err?.name !== 'AbortError') {
    //                 console.error(err);
    //                 showError('Could not open folder picker');
    //             }
    //             return;
    //         }
    //     }

    //     // 2. Electron (no restriction)
    //     if (window.electron?.ipcRenderer) {
    //         try {
    //             const result = await window.electron.ipcRenderer.invoke('show-open-dialog', {
    //                 properties: ['openDirectory'],
    //                 title: 'Select Download Folder',
    //             });

    //             if (!result.canceled && result.filePaths.length > 0) {
    //                 const fullPath = result.filePaths[0];

    //                 // Electron → can persist
    //                 localStorage.setItem('downloadDirPath', fullPath);

    //                 setValue('downloadLocation', fullPath, { shouldDirty: true });

    //                 showSuccess(`Download folder set`);
    //             }
    //         } catch (err) {
    //             console.error(err);
    //             showError('Could not open folder picker');
    //         }
    //         return;
    //     }

    //     // 3. Fallback
    //     folderInputRef.current?.click();
    // };
    // ──────────────────────────────────────────────────────────────────

    return (
        <div id="settingsContainer" className="settings-container setting-main-section-left">
            <div className="single-header blue-line-aft">
                <h2 className="box-title">General Settings</h2>
            </div>
            <div className="setting-features setting-features-select-2">
                <div className="row m-0">
                    <div className="col-lg-3 col-md-4">
                        <div className="form-group form-row ">
                            <label className="control-label">Undo Send Period</label>
                            <div className="input-control">
                                <Controller
                                    name="undoSendPeriod"
                                    control={control}
                                    render={({ field }) => (
                                        <Select2Wrapper
                                            value={field.value.toString() || null}
                                            onChange={(val: string | null) => {
                                                field.onChange(val != null ? Number(val) : null)
                                            }}
                                            options={[
                                                { label: "0", value: "0" },
                                                { label: "5", value: "5" },
                                                { label: "10", value: "10" },
                                                { label: "30", value: "30" },
                                            ]}
                                            isMulti={false}
                                            placeholder="Select period..."
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                        <div className="form-group form-row ">
                            <label className="control-label">Maximum page size</label>
                            <div className="input-control">
                                <Controller
                                    name="maximumPageSize"
                                    control={control}
                                    render={({ field }) => (
                                        <Select2Wrapper
                                            value={field.value.toString() || null}
                                            onChange={(val: string | null) => {
                                                field.onChange(val != null ? Number(val) : null)
                                            }}
                                            options={[
                                                { label: "10", value: "10" },
                                                { label: "15", value: "15" },
                                                { label: "20", value: "20" },
                                                { label: "25", value: "25" },
                                                { label: "30", value: "30" },
                                            ]}
                                            isMulti={false}
                                            typeable={false}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-4">
                        <form id="generalSettingsForm">
                            <div className="form-group form-row ">
                                <label className="control-label">Recovery mail</label>
                                <div className="input-control">
                                    <Controller
                                        name="recoveryEmail" control={control}
                                        render={({ field }) => (
                                            <input
                                                type="text"
                                                id="recoveryEmail"
                                                className={`form-control`}
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    {/* <div className="col-lg-3 col-md-4">
                        <div className="form-group form-row ">
                            <label className="control-label">Download location</label>
                            <div className="input-icon-add">
                                <img src={fileIcon} alt="" width={16} height={16}
                                    className="input-icon-1"
                                    onClick={handleFolderPick}
                                />
                                <Controller
                                    name="downloadLocation" control={control}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            id="downloadLocation"
                                            className={`form-control`}
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div> */}
                    <div className="col-lg-3 col-md-4">
                        <div className="form-group form-row ">
                            <label className="control-label">Mark as read delay</label>
                            <div className="input-control">
                                <Controller
                                    name="markAsReadDelay"
                                    control={control}
                                    render={({ field }) => (
                                        <Select2Wrapper
                                            value={field.value.toString() || null}
                                            onChange={(val: string | null) => {
                                                field.onChange(val != null ? Number(val) : null)
                                            }}
                                            options={[
                                                { label: "Immediately", value: "0" },
                                                { label: "After 1 second", value: "1" },
                                                { label: "After 3 second", value: "3" },
                                                { label: "After 20 second", value: "20" },
                                                { label: "Never", value: "-1" },
                                            ]}
                                            isMulti={false}
                                            typeable={false}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="single-header blue-line-aft">
                <h2 className="box-title">Signature Settings</h2>
            </div>
            <div className="setting-features pt-0 pb-0 pe-0 ">
                <div className="setting-features-sub-box">
                    <div className="setting-signature-box">
                        <div className="signature-table-new">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>
                                            <div className="setting-th-head">
                                                No.
                                            </div>
                                        </th>
                                        <th className="name-size">
                                            <div className="setting-th-head">
                                                Name
                                            </div>
                                        </th>
                                        <th>
                                            <div className="setting-th-head">
                                                Status
                                            </div>
                                        </th>
                                        <th className="text-end">
                                            <div className="setting-th-head">
                                                Action
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="signatureTableBody">
                                    <SignatureList
                                        signatures={signatures}
                                        selectedSignatureId={selectedSignature?.id ?? null}
                                        onSelect={handleSelectSignature}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </tbody>
                            </table>
                        </div>
                        <button className="btn-new hover-link" onClick={handleCreateSignature}>
                            <InteractiveIcon
                                defaultIcon={plusIcon}
                                hoverIcon={plusIconHover}
                                activeIcon=""
                                isActive={false}
                                alt=""
                                className="interactive-icon hover-image me-2"
                                renderAs="img"
                                tooltip=""
                            />
                            Create new
                        </button>
                        <div className="sub-signatur-setting">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <span className="fs-12-commom">Enable compose email signature</span>
                                <div className="switch-toggale d-flex align-items-center justify-content-center">
                                    <Controller
                                        name="enableSignature" control={control}
                                        render={({ field }) => (
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                ref={field.ref}
                                                name={field.name}
                                                id="enableSignature"
                                            />
                                        )}
                                    />
                                    <label htmlFor="enableSignature" className="switch-label">
                                        Toggle
                                    </label>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <span className="fs-12-commom">Enable signature on reply/forward use</span>
                                <div className="switch-toggale d-flex align-items-center justify-content-center">
                                    <Controller
                                        name="enableReplyForwardUse"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                ref={field.ref}
                                                name={field.name}
                                                id="enableReplyForwardUse"
                                            />
                                        )}
                                    />
                                    <label htmlFor="enableReplyForwardUse" className="switch-label">
                                        Toggle
                                    </label>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between mt-3">
                                <span className="fs-12-commom">Enable Thread View</span>
                                <div className="switch-toggale d-flex align-items-center justify-content-center">
                                    <Controller
                                        name="threadView"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                ref={field.ref}
                                                name={field.name}
                                                id="threadView"
                                            />
                                        )}
                                    />
                                    <label htmlFor="threadView" className="switch-label">
                                        Toggle
                                    </label>
                                </div>
                            </div>
                            <div className="d-flex align-items-center justify-content-between mt-3">
                                <span className="fs-12-commom">Enable Notification</span>
                                <div className="switch-toggale d-flex align-items-center justify-content-center">
                                    <Controller
                                        name="notification"
                                        control={control}
                                        render={({ field }) => (
                                            <input
                                                type="checkbox"
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                ref={field.ref}
                                                name={field.name}
                                                id="notification"
                                            />
                                        )}
                                    />
                                    <label htmlFor="notification" className="switch-label">
                                        Toggle
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="setting-quill w-100">
                        <Controller
                            name="body"
                            control={control}
                            render={({ field }) => (
                                <Suspense fallback={<div className="form-control" style={{ height: '200px' }}>Loading editor...</div>}>
                                    <CkEditorRichText
                                        id="compose-email-body"
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </Suspense>
                            )}
                        />
                    </div>
                </div>
            </div>
            {/* <div className="single-header blue-line-aft">
                <h2 className="box-title">Keyboard Shortcuts</h2>
            </div>
            <KeyboardShortCutList shortcuts={settings.shortcuts}/> */}
            <div className="single-header blue-line-aft">
                <h2 className="box-title">Rules</h2>
            </div>
            <div className="setting-features">
                <div className="setting-signature-box p-0">
                    <form className="filter-blocked-sec">
                        {
                            rules.length > 0 ? (
                                <RulesList rules={rules} onEdit={handleEditRule} onDelete={setupDeleteConfirmation} />
                            ) : (
                                <div className="text-center p-3 fs-12-commom">No rules found.</div>
                            )
                        }
                    </form>
                </div>
            </div>
            <div className="d-flex align-items-center mb-3 mt-4 ms-3">
                <SubmitButton className="btn-new btn-new-bg loading-spinner"
                    onClick={handleSubmit(onSubmit, (errors: any) => {
                        console.log('SUBMIT BLOCKED BY ERRORS:', errors);
                    })}
                >
                    Save
                </SubmitButton>
            </div>
        </div>
    )

}

export default SettingsPage;
