import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import SimpleBar from 'simplebar-react';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import SubmitButton from '@components/ui/form/SubmitButton';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useContacts } from '@context/ContactsContext';
import { useMailUI } from '@context/MailUIContext';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import closeIconHover from '@assets/images/close-icon-hover.svg';
import closeIcon from '@assets/images/close-icon.svg';
import { createContactGroup } from '@services/contact/contactService';
import {
    createGroupFormSchema,
    type CreateGroupFormValues,
} from './createGroup.schema';

interface CreateGroupModalProps {
    modalId: string;
    zIndex: number;
    onSuccess?: () => void;
}

function CreateGroupModal({ modalId, zIndex, onSuccess }: CreateGroupModalProps) {
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

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateGroupFormValues>({
        resolver: zodResolver(createGroupFormSchema) as Resolver<CreateGroupFormValues>,
        mode: 'onSubmit',
        defaultValues: {
            name: '',
            memberIds: [],
        },
    });

    const onClose = () => {
        resetContactSuggestions();
        reset();
        closeModal(modalId);
    };

    const onSubmit = async (data: CreateGroupFormValues) => {
        const response = await createContactGroup({
            name: data.name.trim(),
            memberIds: data.memberIds ?? [],
        });

        if (response?.statusCode === 200 || response?.statusCode === 201) {
            showSuccess(response?.message || 'Group created successfully');
            onSuccess?.();
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
                            <h1 className="modal-title modal-title-center">Create Group</h1>
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
                                                        options={contacts}
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
                                    Create
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
