import { Controller, useForm } from 'react-hook-form';
import InteractiveIcon from "@components/ui/InteractiveIcon";
import Select2Wrapper from "@components/ui/form/Select2Wrapper";
import CkEditorRichText from '@components/ui/CkEditor/CkEditorRichText';
import plusIcon from "@images/plus-icon.svg"
import plusIconHover from "@images/plus-icon-hover.svg"
import { SettingsSchema, type SettingPageFormValues, type Signature } from './settings.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMailData } from '@context/MailDataContext';
import { useEffect, useState } from 'react';
import { deleteSignature, getSettings, saveSettings, getAllRules, deleteRule } from '@services/settings/settingsService';
import SignatureList from '@components/ui/settings/SignatureList';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showSuccess, showError } from '@components/ui/toast/toastNotification';
import { useMailUI } from '@context/MailUIContext';
import RulesList from '@components/ui/settings/RulesList';
import { useSettings } from '@context/SettingsContext';
import { usePageStylesheet, pageStyles } from '@hooks/usePageStyleSheet';

function SettingsPage() {
    usePageStylesheet([pageStyles.settingsCss]);
    const { setBoxName } = useMailData();
    const { openModal } = useMailUI();
    const { updateSettings } = useSettings();
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
    const [rules, setRules] = useState<any[]>([]);

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
            recoveryEmail: "",
            enableSignature: false,
            enableReplyForwardUse: false,
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
                recoveryEmail: response.data.recoveryEmail ?? '',
            });

            reset({
                undoSendPeriod: response.data.undoSendPeriod ?? 0,
                maximumPageSize: safePageSize,
                recoveryEmail: response.data.recoveryEmail ?? '',
                enableSignature: response.data.enableSignature ?? false,
                signatureId: defaultSignature?.id ?? '',
                enableReplyForwardUse: response.data.enableReplyForwardUse ?? false,
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
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    }

    useEffect(() => {
        setBoxName('settings')

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
        console.log("Edit signature", id);
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

    async function handleEditRule(id: string) {
        console.log("Edit rule", id);
    }

    async function handleDelete(id: string) {
        console.log("Delete signature", id);
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
                signatures: undefined
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
                    recoveryEmail: data.recoveryEmail || '',
                });
            } else {
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
        console.log("Open delete confirmation for rule:", ruleId);
        openModal('confirmDelete', {
            onConfirm: () => handleDeleteRule(ruleId)
        })
    }

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
                                <span className="fs-12-commom">Enable email signature</span>
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
                                <span className="fs-12-commom">Enable on reply/forward use</span>
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
                        </div>
                    </div>
                    <div className="setting-quill w-100">
                        <Controller
                            name="body"
                            control={control}
                            render={({ field }) => (
                                <CkEditorRichText
                                    id="compose-email-body"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>
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