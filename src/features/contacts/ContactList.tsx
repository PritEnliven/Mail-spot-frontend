import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import type { Contact } from '@models/Contact';
import { getContactEmails, getContactPhones } from '@models/Contact';
import { copyEmailToClipBoard } from '@utils/generalUtil';
import { formatDate, parseDateForFlatpickr, TimeFormat } from '@utils/dateUtil';
import checkIcon from '@images/checkbox-check-box-blue.svg';
import copyIcon from '@images/copy-icon-16.svg';
import dateIcon from '@images/date-icon-16.svg';
import descriptionIcon from '@images/description-icon-16.svg';
import editIcon from '@images/edit2-icon.svg';
import editIconHover from '@images/edit2-icon-hover.svg';
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';
import locationIcon from '@images/location-icon-16.svg';
import mailIcon from '@images/mail-icon-16.svg';
import phoneIcon from '@images/phone-icon-16.svg';
import viewIcon from '@images/view-icon.svg';
import viewIconHover from '@images/view-icon-hover.svg';

const NOTE_PREVIEW_LENGTH = 40;
const CONTACT_TABLE_COLSPAN = 8;
const POPUP_GAP = 8;

interface ContactListProps {
    contacts: Contact[];
    isLoading: boolean;
    startIndex: number;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
    layout?: 'table' | 'mobile';
}

interface PopupPosition {
    top: number;
    left: number;
    placement: 'top' | 'bottom';
}

function truncateNote(note: string, max = NOTE_PREVIEW_LENGTH) {
    const trimmed = note.trim();
    if (trimmed.length <= max) return { text: trimmed, truncated: false };
    return { text: `${trimmed.slice(0, max).trimEnd()}...`, truncated: true };
}

function formatBirthdate(value?: string | null) {
    if (!value?.trim()) return '—';
    const parsed = parseDateForFlatpickr(value.trim());
    if (!parsed) return value.trim();
    return String(formatDate(parsed, TimeFormat.DD_MM_YYYY));
}

function ContactCopyButton({
    text,
    ariaLabel,
}: {
    text: string;
    ariaLabel: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const value = text.trim();
        if (!value) return;

        try {
            await copyEmailToClipBoard(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1000);
        } catch {
            // Keep UI unchanged if copy fails
        }
    };

    return (
        <button
            type="button"
            className="btn contact-hover-popup__copy-btn"
            onClick={handleCopy}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={ariaLabel}
        >
            <img
                src={copied ? checkIcon : copyIcon}
                alt={copied ? 'Copied' : 'Copy'}
                width={14}
                height={14}
                className={copied ? 'is-check' : 'is-copy'}
            />
        </button>
    );
}

function ContactHoverPopup({
    open,
    anchorEl,
    children,
    onMouseEnter,
    onMouseLeave,
}: {
    open: boolean;
    anchorEl: HTMLElement | null;
    children: ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<PopupPosition | null>(null);

    useLayoutEffect(() => {
        if (!open || !anchorEl) {
            setPosition(null);
            return;
        }

        const updatePosition = () => {
            const anchorRect = anchorEl.getBoundingClientRect();
            const popupRect = popupRef.current?.getBoundingClientRect();
            const popupWidth = popupRect?.width ?? 220;
            const popupHeight = popupRect?.height ?? 120;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const spaceAbove = anchorRect.top;
            const spaceBelow = viewportHeight - anchorRect.bottom;
            const placement: 'top' | 'bottom' =
                spaceAbove > spaceBelow && spaceAbove >= popupHeight + POPUP_GAP
                    ? 'top'
                    : 'bottom';

            let top = placement === 'top'
                ? anchorRect.top - popupHeight - POPUP_GAP
                : anchorRect.bottom + POPUP_GAP;

            let left = anchorRect.left;
            left = Math.min(left, viewportWidth - popupWidth - 8);
            left = Math.max(8, left);
            top = Math.max(8, Math.min(top, viewportHeight - popupHeight - 8));

            setPosition({ top, left, placement });
        };

        updatePosition();
        const frame = requestAnimationFrame(updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [open, anchorEl, children]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={popupRef}
            className={`contact-hover-popup${position ? ` is-${position.placement}` : ''}`}
            style={position ? { top: position.top, left: position.left } : { visibility: 'hidden', top: 0, left: 0 }}
            role="tooltip"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>,
        document.body,
    );
}

function useHoverPopup() {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLElement | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ignoreClickRef = useRef(false);

    const clearCloseTimer = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    const openPopup = () => {
        clearCloseTimer();
        setOpen(true);
    };

    const scheduleClose = () => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => setOpen(false), 120);
    };

    const closePopup = () => {
        clearCloseTimer();
        setOpen(false);
    };

    const togglePopup = () => {
        clearCloseTimer();
        setOpen((prev) => !prev);
    };

    const canHover = () =>
        typeof window !== 'undefined'
        && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const handleTriggerMouseEnter = () => {
        if (canHover()) openPopup();
    };

    const handleTriggerMouseLeave = () => {
        if (canHover()) scheduleClose();
    };

    const handleTriggerClick = (event: React.SyntheticEvent) => {
        event.preventDefault();
        event.stopPropagation();
        // Mobile: focus can open first, then the same tap's click would toggle closed.
        if (ignoreClickRef.current) {
            ignoreClickRef.current = false;
            openPopup();
            return;
        }
        togglePopup();
    };

    const handleTriggerFocus = () => {
        // Keyboard focus should open; touch focus is followed by click — skip that click.
        if (!canHover()) {
            ignoreClickRef.current = true;
        }
        openPopup();
    };

    const handleTriggerBlur = () => {
        // Don't close on blur for touch — outside tap handler closes instead.
        if (canHover()) scheduleClose();
    };

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target)) return;
            const popup = document.querySelector('.contact-hover-popup');
            if (popup?.contains(target)) return;
            closePopup();
        };

        // Delay binding so the opening tap does not immediately close the popup.
        const bindTimer = window.setTimeout(() => {
            document.addEventListener('mousedown', onPointerDown);
            document.addEventListener('touchstart', onPointerDown);
        }, 0);

        return () => {
            window.clearTimeout(bindTimer);
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [open]);

    useEffect(() => () => clearCloseTimer(), []);

    return {
        open,
        triggerRef,
        openPopup,
        scheduleClose,
        closePopup,
        togglePopup,
        setOpen,
        handleTriggerMouseEnter,
        handleTriggerMouseLeave,
        handleTriggerClick,
        handleTriggerFocus,
        handleTriggerBlur,
    };
}

function ContactPreviewCell({
    value,
    title,
    copyLabel,
    viewLabel,
    singleLine = false,
}: {
    value?: string | null;
    title: string;
    copyLabel: string;
    viewLabel: string;
    singleLine?: boolean;
}) {
    const {
        open,
        triggerRef,
        openPopup,
        scheduleClose,
        togglePopup,
        setOpen,
        handleTriggerMouseEnter,
        handleTriggerMouseLeave,
        handleTriggerClick,
        handleTriggerFocus,
        handleTriggerBlur,
    } = useHoverPopup();
    const raw = value?.trim() ?? '';
    const { text, truncated } = singleLine
        ? { text: raw, truncated: raw.length > NOTE_PREVIEW_LENGTH }
        : truncateNote(raw);

    if (!raw) return <>—</>;

    if (!truncated) {
        return (
            <span className={`contact-note-preview${singleLine ? ' contact-note-preview--single-line' : ''}`}>
                {text}
            </span>
        );
    }

    return (
        <div className={`contact-note-cell${singleLine ? ' contact-note-cell--single-line' : ''}`}>
            <span className={`contact-note-preview${singleLine ? ' contact-note-preview--single-line' : ''}`}>
                {text}
            </span>
            <button
                type="button"
                ref={(node) => {
                    triggerRef.current = node;
                }}
                className={`contact-note-view-btn hover-link${open ? ' is-open' : ''}`}
                aria-expanded={open}
                aria-label={viewLabel}
                onMouseEnter={handleTriggerMouseEnter}
                onMouseLeave={handleTriggerMouseLeave}
                onFocus={handleTriggerFocus}
                onBlur={handleTriggerBlur}
                onClick={handleTriggerClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        togglePopup();
                    }
                    if (event.key === 'Escape') {
                        setOpen(false);
                    }
                }}
            >
                <InteractiveIcon
                    defaultIcon={viewIcon}
                    hoverIcon={viewIconHover}
                    activeIcon={viewIconHover}
                    isActive={open}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip=""
                />
            </button>
            <ContactHoverPopup
                open={open}
                anchorEl={triggerRef.current}
                onMouseEnter={openPopup}
                onMouseLeave={scheduleClose}
            >
                <div className="contact-hover-popup__header">
                    <div className="contact-hover-popup__title">{title}</div>
                    <ContactCopyButton text={raw} ariaLabel={copyLabel} />
                </div>
                <div className="contact-hover-popup__body-wrapper">
                    <div className="contact-hover-popup__body contact-hover-popup__body--note">{raw}</div>
                </div>
            </ContactHoverPopup>
        </div>
    );
}

function MultiValueCell({ values, label }: { values: string[]; label: string }) {
    const {
        open,
        triggerRef,
        openPopup,
        scheduleClose,
        togglePopup,
        setOpen,
        handleTriggerMouseEnter,
        handleTriggerMouseLeave,
        handleTriggerClick,
        handleTriggerFocus,
        handleTriggerBlur,
    } = useHoverPopup();

    if (values.length === 0) return <>—</>;

    const [primary, ...rest] = values;

    return (
        <div className="contact-multi-value">
            <span className="contact-multi-value__primary">{primary}</span>
            {rest.length > 0 && (
                <>
                    <span
                        ref={(node) => {
                            triggerRef.current = node;
                        }}
                        className={`contact-multi-value__more${open ? ' is-open' : ''}`}
                        tabIndex={0}
                        role="button"
                        aria-expanded={open}
                        aria-label={`Show ${rest.length} more ${label}`}
                        onMouseEnter={handleTriggerMouseEnter}
                        onMouseLeave={handleTriggerMouseLeave}
                        onFocus={handleTriggerFocus}
                        onBlur={handleTriggerBlur}
                        onClick={handleTriggerClick}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                togglePopup();
                            }
                            if (event.key === 'Escape') {
                                setOpen(false);
                            }
                        }}
                    >
                        +{rest.length}
                    </span>
                    <ContactHoverPopup
                        open={open}
                        anchorEl={triggerRef.current}
                        onMouseEnter={openPopup}
                        onMouseLeave={scheduleClose}
                    >
                        <div className="contact-hover-popup__header">
                            <div className="contact-hover-popup__title">{label}</div>
                        </div>
                        <ul className="contact-hover-popup__list">
                            {values.map((value) => (
                                <li key={value}>
                                    <span className="contact-hover-popup__list-text">{value}</span>
                                    <ContactCopyButton
                                        text={value}
                                        ariaLabel={`Copy ${value}`}
                                    />
                                </li>
                            ))}
                        </ul>
                    </ContactHoverPopup>
                </>
            )}
        </div>
    );
}

function ContactActions({
    contact,
    onEdit,
    onDelete,
}: {
    contact: Contact;
    onEdit: (contact: Contact) => void;
    onDelete: (contact: Contact) => void;
}) {
    return (
        <div className="d-flex align-items-center justify-content-end contact-actions">
            <a
                href="#"
                className="hover-link d-flex align-items-center me-2"
                onClick={(e) => {
                    e.preventDefault();
                    onEdit(contact);
                }}
                aria-label={`Edit ${contact.name}`}
            >
                <InteractiveIcon
                    defaultIcon={editIcon}
                    hoverIcon={editIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Edit"
                />
            </a>
            <a
                href="#"
                className="hover-link d-flex align-items-center"
                onClick={(e) => {
                    e.preventDefault();
                    onDelete(contact);
                }}
                aria-label={`Delete ${contact.name}`}
            >
                <InteractiveIcon
                    defaultIcon={deleteIcon}
                    hoverIcon={deleteIconHover}
                    activeIcon=""
                    isActive={false}
                    alt=""
                    className="interactive-icon hover-image"
                    renderAs="img"
                    tooltip="Delete"
                />
            </a>
        </div>
    );
}

function ContactEmptyState() {
    return (
        <div className="no-new-mail contacts-empty-state">
            <div className="d-block text-center">
                <h2 className="new-h2 mb-2">No saved contacts yet</h2>
            </div>
        </div>
    );
}

export { ContactEmptyState };

function ContactFieldIcon({ src, label }: { src: string; label: string }) {
    return (
        <span className="contact-mobile-item__icon" aria-hidden="true" title={label}>
            <img src={src} alt="" width={16} height={16} />
            <span className="visually-hidden">{label}</span>
        </span>
    );
}

function ContactMobileList({
    contacts,
    isLoading,
    startIndex,
    onEdit,
    onDelete,
}: ContactListProps) {
    if (isLoading) {
        return (
            <div className="contacts-mobile-list">
                <div className="contacts-mobile-status text-center py-4 fs-12-commom">
                    Loading contacts...
                </div>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="contacts-mobile-list">
                <div className="contacts-mobile-status text-center py-4">
                    <ContactEmptyState />
                </div>
            </div>
        );
    }

    return (
        <div className="contacts-mobile-list" role="list">
            {contacts.map((contact, index) => {
                const emails = getContactEmails(contact);
                const phones = getContactPhones(contact);
                const address = contact.address?.trim();
                const notes = contact.notes?.trim();
                const birthdate = formatBirthdate(contact.birthdate);

                return (
                    <article
                        key={contact._id}
                        className="contact-mobile-item"
                        role="listitem"
                    >
                        <div className="contact-mobile-item__header">
                            <div className="contact-mobile-item__identity">
                                <span className="contact-mobile-item__index">
                                    {startIndex + index}
                                </span>
                                <h3 className="contact-mobile-item__name">{contact.name}</h3>
                            </div>
                            <ContactActions
                                contact={contact}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </div>

                        <div className="contact-mobile-item__fields-wrapper">
                            <dl className="contact-mobile-item__fields">
                            {emails.length > 0 && (
                                <div className="contact-mobile-item__field">
                                    <dt>
                                        <ContactFieldIcon src={mailIcon} label="Email" />
                                    </dt>
                                    <dd>
                                        <MultiValueCell values={emails} label="Emails" />
                                    </dd>
                                </div>
                            )}
                            {phones.length > 0 && (
                                <div className="contact-mobile-item__field">
                                    <dt>
                                        <ContactFieldIcon src={phoneIcon} label="Phone" />
                                    </dt>
                                    <dd>
                                        <MultiValueCell values={phones} label="Phones" />
                                    </dd>
                                </div>
                            )}
                            {address && (
                                <div className="contact-mobile-item__field">
                                    <dt>
                                        <ContactFieldIcon src={locationIcon} label="Address" />
                                    </dt>
                                    <dd>
                                        <ContactPreviewCell
                                            value={contact.address}
                                            title="Address"
                                            copyLabel="Copy address"
                                            viewLabel="View full address"
                                            singleLine
                                        />
                                    </dd>
                                </div>
                            )}
                            {birthdate !== '—' && (
                                <div className="contact-mobile-item__field">
                                    <dt>
                                        <ContactFieldIcon src={dateIcon} label="Birthdate" />
                                    </dt>
                                    <dd>
                                        <span className="contact-mobile-item__text">{birthdate}</span>
                                    </dd>
                                </div>
                            )}
                            {notes && (
                                <div className="contact-mobile-item__field">
                                    <dt>
                                        <ContactFieldIcon src={descriptionIcon} label="Notes" />
                                    </dt>
                                    <dd>
                                        <ContactPreviewCell
                                            value={contact.notes}
                                            title="Notes"
                                            copyLabel="Copy note"
                                            viewLabel="View full note"
                                            singleLine
                                        />
                                    </dd>
                                </div>
                            )}
                        </dl>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

function ContactList({
    contacts,
    isLoading,
    startIndex,
    onEdit,
    onDelete,
    layout = 'table',
}: ContactListProps) {
    if (layout === 'mobile') {
        return (
            <ContactMobileList
                contacts={contacts}
                isLoading={isLoading}
                startIndex={startIndex}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        );
    }

    if (isLoading) {
        return (
            <tr className="contacts-table-status-row">
                <td colSpan={CONTACT_TABLE_COLSPAN} className="text-center py-4 fs-12-commom">
                    Loading contacts...
                </td>
            </tr>
        );
    }

    if (contacts.length === 0) {
        return null;
    }

    return (
        <>
            {contacts.map((contact, index) => {
                const emails = getContactEmails(contact);
                const phones = getContactPhones(contact);

                return (
                    <tr className="blue-line-aft" key={contact._id}>
                        <td>{startIndex + index}</td>
                        <td>{contact.name}</td>
                        <td>
                            <MultiValueCell values={emails} label="Emails" />
                        </td>
                        <td>
                            <MultiValueCell values={phones} label="Phones" />
                        </td>
                        <td>
                            <ContactPreviewCell
                                value={contact.address}
                                title="Address"
                                copyLabel="Copy address"
                                viewLabel="View full address"
                            />
                        </td>
                        <td>{formatBirthdate(contact.birthdate)}</td>
                        <td>
                            <ContactPreviewCell
                                value={contact.notes}
                                title="Notes"
                                copyLabel="Copy note"
                                viewLabel="View full note"
                            />
                        </td>
                        <td>
                            <ContactActions
                                contact={contact}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

export default ContactList;
