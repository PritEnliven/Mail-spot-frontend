import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import SimpleBar from 'simplebar-react';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useContacts } from '@context/ContactsContext';
import { useMailUI } from '@context/MailUIContext';
import type { ContactAutocompleteOption, ContactGroup, ContactGroupMember } from '@models/Contact';
import {
    createContactGroup,
    editContactGroup,
    getContactGroupById,
} from '@services/contact/contactService';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import closeIconHover from '@assets/images/close-icon-hover.svg';
import closeIcon from '@assets/images/close-icon.svg';
import {
    createGroupFormSchema,
    type CreateGroupFormValues,
} from './createGroup.schema';

interface CreateGroupModalProps {
    modalId: string;
    zIndex: number;
    isEdit?: boolean;
    groupId?: string;
    groupName?: string;
    onSuccess?: (updated?: ContactGroup) => void;
}

function extractUpdatedGroup(data: unknown, fallbackId?: string): ContactGroup | undefined {
    if (!data || typeof data !== 'object') return undefined;
    const payload = data as Record<string, unknown>;
    const candidate = (payload.group ?? payload) as ContactGroup | undefined;
    if (candidate && typeof candidate === 'object' && candidate._id) {
        return candidate;
    }
    if (fallbackId && candidate && typeof candidate === 'object') {
        return { ...(candidate as ContactGroup), _id: fallbackId };
    }
    return undefined;
}

function memberToOption(member: ContactGroupMember): ContactAutocompleteOption | null {
    const email = member.email?.trim() ?? '';
    if (!email) return null;

    const name = member.name?.trim() ?? '';
    return {
        value: email,
        name,
        email,
        label: name || email,
    };
}

function getMemberOptionsFromGroup(group: ContactGroup | null): ContactAutocompleteOption[] {
    if (!group || !Array.isArray(group.members)) return [];

    return group.members
        .map((member) => memberToOption(member))
        .filter((opt): opt is ContactAutocompleteOption => Boolean(opt));
}

function mergeMemberOptions(
    base: ContactAutocompleteOption[],
    extras: ContactAutocompleteOption[],
): ContactAutocompleteOption[] {
    const seen = new Set(
        base.map((opt) => (opt.email || opt.value || '').trim().toLowerCase()).filter(Boolean),
    );
    const merged = [...base];
    for (const opt of extras) {
        const key = (opt.email || opt.value || '').trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(opt);
    }
    return merged;
}

function CreateGroupModal({
    modalId,
    zIndex,
    isEdit = false,
    groupId,
    groupName,
    onSuccess,
}: CreateGroupModalProps) {
    const { closeModal } = useMailUI();
    const {
        contacts,
        searchContacts,
        fetchContacts,
        resetContactSuggestions,
        loadMoreContacts,
        hasMoreContacts,
        isLoadingContacts,
        isLoadingMoreContacts,
    } = useContacts();

    const [isLoadingGroup, setIsLoadingGroup] = useState(Boolean(isEdit && groupId));
    const [memberOptions, setMemberOptions] = useState<ContactAutocompleteOption[]>([]);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateGroupFormValues>({
        resolver: zodResolver(createGroupFormSchema) as Resolver<CreateGroupFormValues>,
        mode: 'onSubmit',
        defaultValues: {
            name: groupName ?? '',
            memberIds: [],
        },
    });

    useEffect(() => {
        if (!isEdit || !groupId) {
            setIsLoadingGroup(false);
            return;
        }

        let cancelled = false;

        const load = async () => {
            setIsLoadingGroup(true);
            const response = await getContactGroupById(groupId);
            if (cancelled) return;

            if (response?.statusCode === 200) {
                const data = response.data;
                const group = (data?.group ?? data) as ContactGroup | undefined;
                if (group?._id) {
                    const options = getMemberOptionsFromGroup(group);
                    setMemberOptions(options);
                    reset({
                        name: group.name ?? '',
                        memberIds: options.map((opt) => opt.value),
                    });
                } else {
                    showError('Group not found');
                }
            } else {
                showError(response?.message || 'Failed to load group');
            }

            setIsLoadingGroup(false);
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [groupId, isEdit, reset]);

    const selectOptions = useMemo(
        () => mergeMemberOptions(contacts, memberOptions),
        [contacts, memberOptions],
    );

    const onClose = () => {
        resetContactSuggestions();
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: CreateGroupFormValues) => {
        if (isLoadingGroup) return;

        const payload = {
            name: data.name.trim(),
            memberIds: data.memberIds ?? [],
        };

        if (isEdit && groupId) {
            const response = await editContactGroup(groupId, payload);
            if (response?.statusCode === 200) {
                showSuccess(response?.message || 'Group updated successfully');
                onSuccess?.(extractUpdatedGroup(response.data, groupId));
                onClose();
                return;
            }
            showError(response?.message || 'Failed to update group');
            return;
        }

        const response = await createContactGroup(payload);
        if (response?.statusCode === 200 || response?.statusCode === 201) {
            showSuccess(response?.message || 'Group created successfully');
            onSuccess?.(extractUpdatedGroup(response.data));
            onClose();
            return;
        }

        showError(response?.message || 'Failed to create group');
    };

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            zIndex={zIndex}
            showBackdrop={true}
            closeOnBackdrop={true}
            closeOnEsc={true}
            draggable={true}
            dragHandleSelector=".drag-handle"
            width="min(100vw, 498px)"
        >
            <div className="modal-center-draggable" id="createGroupModal">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content contact-form-modal-content">
                        <div className="modal-header drag-handle">
                            <button
                                className="expand-btn btn hover-link icon-hover-effect drag-handle-btn"
                                type="button"
                            >
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
                            <h1 className="modal-title modal-title-center">
                                {isEdit ? 'Edit Group' : 'Create Group'}
                            </h1>
                            <button
                                type="button"
                                className="btn-close hover-link btn icon-hover-effect"
                                onClick={onClose}
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

                        <div className="modal-body p-0 contact-form-modal-body">
                            <SimpleBar
                                className="contact-form-modal-scroll"
                                autoHide={false}
                                forceVisible="y"
                            >
                                <div className="contact-form-modal-scroll-inner">
                                    {isLoadingGroup ? (
                                        <p className="fs-12-commom mb-0">Loading group...</p>
                                    ) : (
                                        <>
                                            <div className="form-group mb-3 w-100">
                                                <label className="control-label" htmlFor="groupName">
                                                    Group name
                                                </label>
                                                <Controller
                                                    name="name"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <input
                                                            {...field}
                                                            id="groupName"
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Group name"
                                                            maxLength={100}
                                                            autoComplete="off"
                                                            autoFocus
                                                        />
                                                    )}
                                                />
                                                {errors.name && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.name.message}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="form-group form-row select2-profile mb-0 w-100">
                                                <label className="control-label" htmlFor="groupMembers">
                                                    Members
                                                </label>
                                                <div className="input-control w-100">
                                                    <Controller
                                                        name="memberIds"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <Select2Wrapper
                                                                value={field.value ?? []}
                                                                onChange={(value) => field.onChange(value ?? [])}
                                                                options={selectOptions}
                                                                onInputChange={searchContacts}
                                                                onOpen={fetchContacts}
                                                                onClose={resetContactSuggestions}
                                                                onLoadMore={loadMoreContacts}
                                                                hasMore={hasMoreContacts}
                                                                isLoading={isLoadingContacts}
                                                                isLoadingMore={isLoadingMoreContacts}
                                                                placeholder="Search by name or email"
                                                                isMulti
                                                                isModal
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                {errors.memberIds && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.memberIds.message}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </SimpleBar>

                            <div className="contact-form-modal-footer">
                                <button type="button" className="btn-new" onClick={onClose}>
                                    Cancel
                                </button>
                                <SubmitButton
                                    className="btn-new loading-spinner"
                                    onClick={handleSubmit(onSubmit)}
                                >
                                    {isEdit ? 'Save' : 'Create'}
                                </SubmitButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default CreateGroupModal;
