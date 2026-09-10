import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import InteractiveIcon from '@components/ui/InteractiveIcon';
import type { Contact } from '@models/Contact';
import { getContactEmails, getContactPhones } from '@models/Contact';
import { copyEmailToClipBoard } from '@utils/generalUtil';
import { formatDate, parseDateForFlatpickr, TimeFormat } from '@utils/dateUtil';
import checkIcon from '@images/checkbox-check-box-blue.svg';
import copyIcon from '@images/copy-icon-16.svg';
import editIcon from '@images/edit2-icon.svg';
import editIconHover from '@images/edit2-icon-hover.svg';
import deleteIcon from '@images/trash-icon.svg';
import deleteIconHover from '@images/trash-icon-hover.svg';
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

    const togglePopup = () => {
        clearCloseTimer();
        setOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (triggerRef.current?.contains(target)) return;
            const popup = document.querySelector('.contact-hover-popup');
            if (popup?.contains(target)) return;
            setOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        return () => {
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
        togglePopup,
        setOpen,
    };
}

function ContactPreviewCell({
    value,
    title,
    copyLabel,
    viewLabel,
}: {
    value?: string | null;
    title: string;
    copyLabel: string;
    viewLabel: string;
}) {
    const { open, triggerRef, openPopup, scheduleClose, togglePopup, setOpen } = useHoverPopup();
    const raw = value?.trim() ?? '';
    const { text, truncated } = truncateNote(raw);

    if (!raw) return <>—</>;

    if (!truncated) {
        return <span className="contact-note-preview">{text}</span>;
    }

    return (
        <div className="contact-note-cell">
            <span className="contact-note-preview">{text}</span>
            <button
                type="button"
                ref={(node) => {
                    triggerRef.current = node;
                }}
                className={`contact-note-view-btn hover-link${open ? ' is-open' : ''}`}
                aria-expanded={open}
                aria-label={viewLabel}
                onMouseEnter={openPopup}
                onMouseLeave={scheduleClose}
                onFocus={openPopup}
                onBlur={scheduleClose}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    togglePopup();
                }}
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
    const { open, triggerRef, openPopup, scheduleClose, togglePopup, setOpen } = useHoverPopup();

    if (values.length === 0) return <>—</>;

    const [primary, ...rest] = values;

    return (
        <div className="contact-multi-value">
            <span className="contact-multi-value__primary" >{primary}</span>
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
                        onMouseEnter={openPopup}
                        onMouseLeave={scheduleClose}
                        onFocus={openPopup}
                        onBlur={scheduleClose}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            togglePopup();
                        }}
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

function ContactList({
    contacts,
    isLoading,
    startIndex,
    onEdit,
    onDelete,
}: ContactListProps) {
    if (isLoading) {
        return (
            <tr>
                <td colSpan={CONTACT_TABLE_COLSPAN} className="text-center py-4 fs-12-commom">
                    Loading contacts...
                </td>
            </tr>
        );
    }

    if (contacts.length === 0) {
        return (
            <tr>
                <td colSpan={CONTACT_TABLE_COLSPAN} className="text-center py-4">
                    <div className="no-new-mail">
                        <div className="d-block text-center">
                            <h2 className="new-h2 mb-2">No saved contacts yet</h2>
                            <p className="fs-12-commom">
                                People you email will still appear when you compose.
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        );
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
                            <div className="d-flex align-items-center justify-content-end">
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
                        </td>
                    </tr>
                );
            })}
        </>
    );
}

export default ContactList;
