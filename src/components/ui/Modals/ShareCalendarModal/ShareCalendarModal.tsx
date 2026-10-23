import arrowPointingOutIconHover from '@images/arrows-pointing-out-icon-hover.svg';
import arrowPointingOutIcon from '@images/arrows-pointing-out-icon.svg';
import closeIconHover from '@images/close-icon-hover.svg';
import closeIcon from '@images/close-icon.svg';
import BaseModal from '@components/ui/BaseModal';
import GuestTag, { type Guest } from '@components/ui/calendar/GuestTag';
import Select2Wrapper from '@components/ui/form/Select2Wrapper';
import InteractiveIcon from '@components/ui/InteractiveIcon';      
import deleteIcon from "@images/trash-icon.svg";
import deleteIconHover from "@images/trash-icon-hover.svg";
import { showError, showSuccess } from '@components/ui/toast/toastNotification';
import { useAccount } from '@context/AccountContext';
import { useCalendar } from '@context/CalendarContext';
import { useContacts } from '@context/ContactsContext';
import { useMailUI } from '@context/MailUIContext';
import type { CalendarShare, CalendarSharePermission } from '@models/CalendarModels';
import {
    listCalendarShares,
    revokeCalendarShare,
    shareCalendar,
    updateCalendarShare,
} from '@services/calendar/calendarsService';
import { SHARE_LIST_REFRESH_EVENT } from '@hooks/useCalendarSocket';
import { permissionLabel } from '@utils/calendarPermissionUtil';
import { parseEmailAddress } from '@utils/emailUtil';
import { filterGuestByEmail, normalizeGuests } from '@utils/guestUtil';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import SimpleBar from 'simplebar-react';
import {
    SHARE_PERMISSION_OPTIONS,
    shareCalendarInviteSchema,
    type ShareCalendarInviteValues,
} from './shareCalendar.schema';

interface ShareCalendarModalProps {
    modalId: string;
    zIndex: number;
    calendarId: string;
    name?: string;
    color?: string;
}

function normalizeInviteEmails(emails: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of emails) {
        const email = parseEmailAddress(String(raw)).email.trim().toLowerCase();
        if (!email.includes('@') || seen.has(email)) continue;
        seen.add(email);
        result.push(email);
    }

    return result;
}

// function shareStatusLabel(status: CalendarShare['status']): string {
//     if (status === 'accepted') return 'Accepted';
//     if (status === 'declined') return 'Declined';
//     if (status === 'revoked') return 'Revoked';
//     return 'Pending';
// }

function shareStatusLabel(status: CalendarShare['status']): string {
    if (status === 'accepted') return 'Accepted';
    if (status === 'declined') return 'Declined';                        
    if (status === 'revoked') return 'Revoked';
    return 'Pending';
}

function ShareCalendarModal({
    modalId,
    zIndex,
    calendarId,
    name = '',
    color = '#49BA14',
}: ShareCalendarModalProps) {
    const { closeModal, openModal } = useMailUI();
    const { fetchCalendars } = useCalendar();
    const { activeAccountEmail } = useAccount();
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

    const [shares, setShares] = useState<CalendarShare[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [updatingShareId, setUpdatingShareId] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        getValues,
        setValue,
        formState: { errors },
    } = useForm<ShareCalendarInviteValues>({
        resolver: zodResolver(shareCalendarInviteSchema),
        defaultValues: {
            emails: [],
            permission: 'view',
        },
    });

    const emailsList = useWatch({
        control,
        name: 'emails',
    });
    const invitees: Guest[] = normalizeGuests(emailsList);

    const onRemoveInvitee = (email: string) => {
        const current = getValues('emails') || [];
        setValue('emails', filterGuestByEmail(current, email), { shouldDirty: true });
    };

    const loadShares = async () => {
        setListLoading(true);
        setListError('');
        const response = await listCalendarShares({ calendarId });
        if (response.statusCode === 200) {             
            const nextShares = (response.data?.shares || []).filter(
                (share) => share.status !== 'revoked'
            );
            setShares(nextShares);
            setListLoading(false);
            return;
        }
        setListError(response.message || 'Failed to load shares');
        setListLoading(false);
    };

    useEffect(() => {
        void loadShares();
    }, [calendarId]);

    useEffect(() => {
        const onShareListRefresh = (event: Event) => {
            const detail = (event as CustomEvent<{ calendarId?: string }>).detail;
            if (detail?.calendarId && String(detail.calendarId) !== String(calendarId)) return;
            void loadShares();
        };
        window.addEventListener(SHARE_LIST_REFRESH_EVENT, onShareListRefresh);
        return () => window.removeEventListener(SHARE_LIST_REFRESH_EVENT, onShareListRefresh);
    }, [calendarId]);

    const onClose = () => {
        reset({ emails: [], permission: 'view' });
        closeModal(modalId);
    };

    const onSendInvite = async (data: ShareCalendarInviteValues) => {
        const emails = normalizeInviteEmails(data.emails);
        if (emails.length === 0) {
            setError('emails', { type: 'manual', message: 'Add at least one email' });
            return;
        }

        const selfEmail = (activeAccountEmail || '').trim().toLowerCase();
        if (selfEmail && emails.some((email) => email === selfEmail)) {
            setError('emails', { type: 'manual', message: 'You cannot share with yourself' });
            return;
        }

        const response = await shareCalendar({
            calendarId,
            shares: emails.map((email) => ({
                email,
                permission: data.permission,
            })),
        });

        if (response.statusCode !== 200) {
            showError(response.message || 'Failed to send invite');
            return;
        }

        const results = response.data?.results || [];
        const apiErrors = response.data?.errors || [];
        if (results.length > 0) {
            showSuccess('Invite sent');
        }
        for (const item of apiErrors) {
            showError(item.error || `Failed for ${item.email}`);
        }

        reset({ emails: [], permission: 'view' });
        await loadShares();
        await fetchCalendars();
    };

    const onPermissionChange = async (shareId: string, permission: CalendarSharePermission) => {
        setUpdatingShareId(shareId);
        const response = await updateCalendarShare({ shareId, permission });
        setUpdatingShareId(null);

        if (response.statusCode === 200) {
            showSuccess(response.data?.message || 'Permission updated');
            setShares((prev) =>
                prev.map((share) =>
                    share._id === shareId ? { ...share, permission } : share
                )
            );
            return;
        }

        showError(response.message || 'Failed to update permission');
        await loadShares();
    };

    const onConfirmRemove = async (shareId: string) => {
        const response = await revokeCalendarShare({ shareId });
        if (response.statusCode === 200) {
            showSuccess(response.data?.message || 'Access removed');
            await loadShares();
            await fetchCalendars();
            return;
        }
        showError(response.message || 'Failed to remove access');
    };

    const onRemoveShare = (share: CalendarShare) => {
        openModal('confirmDelete', {
            title: 'Remove access',
            message: `Remove ${share.inviteeEmail} from this calendar?`,
            onConfirm: () => onConfirmRemove(share._id),
        });
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
            width="min(100vw, 520px)"
        >
            <div id="shareCalendarModal" className='share-calendar-modal' style={{ zIndex }} role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered m-0">
                    <div className="modal-content modal-box-shadow-c1">
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
                            <h5
                                className="modal-title modal-title-center d-flex align-items-center justify-content-center gap-2"
                                id="shareCalendarModalLabel"
                            >
                                <span
                                    className="share-calendar-swatch"
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                />
                                <span className="text-truncate">{name || 'Share calendar'}</span>
                            </h5>
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

                        <div className="modal-body folder-features-select-2 p-0">
                            <SimpleBar className="share-calendar-modal-scroll" autoHide={true}>
                                <div className="share-calendar-content-body">
                                    <div className="share-calendar-modal-subtitle">Share calendar</div>

                                    <div className="d-block guests-section-calendar po">
                                        <div className="form-group form-row select2-profile mb-2">
                                            <label className="control-label">Add people</label>
                                            <div className="input-control">
                                                <Controller
                                                    name="emails"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select2Wrapper
                                                            value={field.value || []}
                                                            onChange={field.onChange}
                                                            options={contacts}
                                                            onInputChange={searchContacts}
                                                            onOpen={fetchContacts}
                                                            onClose={resetContactSuggestions}
                                                            onLoadMore={loadMoreContacts}
                                                            hasMore={hasMoreContacts}
                                                            isLoading={isLoadingContacts}
                                                            isLoadingMore={isLoadingMoreContacts}
                                                            showSuggestionBadge={true}
                                                            placeholder="Enter email"
                                                            isMulti={true}
                                                            isModal={true}
                                                            isEmail={true}
                                                        />
                                                    )}
                                                />
                                                {errors.emails && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.emails.message}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {invitees.length > 0 && (
                                            <div className="form-group mb-2 mail-tag-add-to-bottom">
                                                <div className="mt-2 d-block selected-tags-addmail mb-3">
                                                    <SimpleBar
                                                        className="gustsTagsScrollbar"
                                                        autoHide={false}
                                                        forceVisible="y"
                                                    >
                                                        {invitees.map((guest, index) => (
                                                            <GuestTag
                                                                key={`${guest.email}-${index}`}
                                                                guest={guest}
                                                                mode="edit"
                                                                onRemove={onRemoveInvitee}
                                                            />
                                                        ))}
                                                    </SimpleBar>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="share-calendar-section">
                                        <div className="form-group form-row flex-grow-1" style={{ minWidth: 140 }}>
                                            <label className="control-label">Permission</label>
                                            <Controller
                                                name="permission"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select2Wrapper
                                                        value={field.value}
                                                        onChange={(val) =>
                                                            field.onChange((val || 'view') as CalendarSharePermission)
                                                        }
                                                        options={[...SHARE_PERMISSION_OPTIONS]}
                                                        isMulti={false}
                                                        isModal={true}
                                                        placeholder="Permission"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <button
                                            className="btn-new btn-new-bg btn-new-bg loading-spinner "
                                            onClick={handleSubmit(onSendInvite)}
                                        >
                                            Send invite
                                        </button>
                                    </div>

                                    <div className="share-calendar-shared-list">
                                        <div className="share-calendar-modal-subtitle">Shared with</div>
                                        {listLoading && (
                                            <p className="text-muted small mb-0 mt-2">
                                                <span
                                                    className="spinner-border spinner-border-sm text-primary"
                                                    role="status"
                                                />
                                            </p>
                                        )}
                                        {!listLoading && listError && (
                                            <p className="text-danger small mb-0 mt-2">{listError}</p>
                                        )}
                                        {!listLoading && !listError && shares.length === 0 && (
                                            <p className="share-calendar-no-shared">
                                                No one has been invited yet.
                                            </p>
                                        )}
                                        {!listLoading && !listError && shares.length > 0 && (
                                            <ul className="share-calendar-people-list list-unstyled mb-0 mt-2">
                                                {shares.map((share) => (
                                                    <li
                                                        key={share._id}
                                                        className="share-calendar-people-row"
                                                    >
                                                        <div className="share-calendar-people-meta">
                                                            <span className="share-calendar-people-email">
                                                                {share.inviteeEmail}
                                                            </span>
                                                            <span
                                                                className={`status-badge1 ${share.status === 'pending' ? 'orange' : share.status === 'accepted' ? 'green' : 'red'}`}
                                                            >
                                                                {shareStatusLabel(share.status)}
                                                            </span>
                                                        </div>
                                                        <div className="share-calendar-people-actions">
                                                            <div className="share-calendar-permission-select">
                                                                <Select2Wrapper
                                                                    value={share.permission}
                                                                    onChange={(val) => {
                                                                        const next = (val || share.permission) as CalendarSharePermission;
                                                                        if (next === share.permission) return;
                                                                        void onPermissionChange(share._id, next);
                                                                    }}
                                                                    options={[...SHARE_PERMISSION_OPTIONS]}
                                                                    isMulti={false}
                                                                    isModal={true}
                                                                    isDisabled={updatingShareId === share._id}
                                                                    placeholder={permissionLabel(share.permission)}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn hover-link btn-sm share-calendar-remove-btn"
                                                                onClick={() => onRemoveShare(share)}
                                                                aria-label={`Remove ${share.inviteeEmail}`}     >
                                                                <InteractiveIcon
                                                                    defaultIcon={deleteIcon}
                                                                    hoverIcon={deleteIconHover}
                                                                    activeIcon=""
                                                                    isActive={false}
                                                                    alt=""
                                                                    className="interactive-icon hover-image"
                                                                    renderAs="img"
                                                                    tooltip="Remove"
                                                                />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <p className="share-calendar-note mb-3">
                                        Edit and Manage work in MailSpot. Guests can also subscribe in
                                        Gmail/Outlook from the invite email.
                                    </p>

                                    <div className="d-flex align-items-center justify-content-end">
                                        <button className="btn-new" type="button" onClick={onClose}>
                                            Close
                                        </button>
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

export default ShareCalendarModal;
