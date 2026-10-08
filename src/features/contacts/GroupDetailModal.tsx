import { useEffect, useState } from 'react';
import SimpleBar from 'simplebar-react';
import BaseModal from '@components/ui/BaseModal';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useMailUI } from '@context/MailUIContext';
import type { ContactGroup, ContactGroupMember } from '@models/Contact';
import { formatGroupMemberLabel } from '@models/Contact';
import {
    deleteContactGroup,
    getContactGroupById,
} from '@services/contact/contactService';
import { getGroupMemberCount } from '@features/contacts/GroupList';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import closeIconHover from '@assets/images/close-icon-hover.svg';
import closeIcon from '@assets/images/close-icon.svg';
import editIcon from '@images/edit2-icon.svg';
import editIconHover from '@images/edit2-icon-hover.svg';
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';

interface GroupDetailModalProps {
    modalId: string;
    zIndex: number;
    groupId: string;
    groupName?: string;
    onDeleted?: () => void;
    onUpdated?: (updated?: ContactGroup) => void;
}

function getGroupMembers(group: ContactGroup | null): ContactGroupMember[] {
    if (!group || !Array.isArray(group.members)) return [];
    return group.members;
}

function GroupDetailModal({
    modalId,
    zIndex,
    groupId,
    groupName,
    onDeleted,
    onUpdated,
}: GroupDetailModalProps) {
    const { closeModal, openModal } = useMailUI();
    const [group, setGroup] = useState<ContactGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const onClose = () => closeModal(modalId);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setIsLoading(true);
            setError(null);

            const response = await getContactGroupById(groupId);
            if (cancelled) return;

            if (response?.statusCode === 200) {
                const data = response.data;
                const nextGroup = (data?.group ?? data) as ContactGroup | undefined;
                if (nextGroup?._id) {
                    setGroup(nextGroup);
                } else {
                    setError('Group not found');
                }
            } else {
                setError(response?.message || 'Failed to load group');
            }

            setIsLoading(false);
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [groupId]);

    const members = getGroupMembers(group);
    const title = group?.name || groupName || 'Group';
    const memberCount = group ? getGroupMemberCount(group) : members.length;

    const handleEdit = () => {
        openModal('createGroup', {
            isEdit: true,
            groupId,
            groupName: title,
            onSuccess: (updated?: ContactGroup) => {
                if (updated?._id) {
                    setGroup(updated);
                }
                onUpdated?.(updated);
            },
        });
    };

    const handleDelete = () => {
        openModal('confirmDelete', {
            title: 'Delete group',
            message: `Delete “${title}”?`,
            onConfirm: async () => {
                const response = await deleteContactGroup(groupId);
                if (response?.statusCode === 200) {
                    showSuccess(response?.message || 'Group deleted successfully');
                    onDeleted?.();
                    onClose();
                } else {
                    showError(response?.message || 'Failed to delete group');
                }
            },
        });
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
            <div className="modal-center-draggable" id="groupDetailModal">
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
                            <h1 className="modal-title modal-title-center">{title}</h1>
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
                                    {isLoading && (
                                        <p className="fs-12-commom mb-0">Loading group...</p>
                                    )}
                                    {!isLoading && error && (
                                        <p className="text-danger fs-12-commom mb-0">{error}</p>
                                    )}
                                    {!isLoading && !error && group && (
                                        <>
                                            <p className="fs-12-commom mb-3">
                                                {memberCount}{' '}
                                                {memberCount === 1 ? 'member' : 'members'}
                                            </p>
                                            {members.length === 0 ? (
                                                <p className="fs-12-commom mb-0 text-muted">
                                                    No members in this group.
                                                </p>
                                            ) : (
                                                <ul className="contacts-group-member-list">
                                                    {members.map((member, index) => (
                                                        <li
                                                            key={
                                                                member.contactId
                                                                || member.email
                                                                || `member-${index}`
                                                            }
                                                        >
                                                            <span className="contacts-group-member-list__name">
                                                                {formatGroupMemberLabel(member)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            </SimpleBar>

                            <div className="contact-form-modal-footer">
                                <button type="button" className="btn-new" onClick={onClose}>
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn-new hover-link d-inline-flex align-items-center gap-2"
                                    onClick={handleEdit}
                                    disabled={isLoading || Boolean(error)}
                                >
                                    <InteractiveIcon
                                        defaultIcon={editIcon}
                                        hoverIcon={editIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip=""
                                    />
                                    <span>Edit</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-new hover-link d-inline-flex align-items-center gap-2"
                                    onClick={handleDelete}
                                    disabled={isLoading || Boolean(error)}
                                >
                                    <InteractiveIcon
                                        defaultIcon={deleteIcon}
                                        hoverIcon={deleteIconHover}
                                        activeIcon=""
                                        isActive={false}
                                        alt=""
                                        className="interactive-icon hover-image"
                                        renderAs="img"
                                        tooltip=""
                                    />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default GroupDetailModal;
