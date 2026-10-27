import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import smartMessageIcon from '@images/smart-message-icon-16.svg';

const POPUP_GAP = 8;

interface PopupPosition {
    top: number;
    left: number;
    placement: 'top' | 'bottom';
}

interface EmailSummaryPopoverProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    isLoading: boolean;
    points: string[] | null;
    error: string | null;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    /** Desktop: anchored tooltip. Mobile: bottom sheet over a dimmed backdrop. */
    variant?: 'popover' | 'sheet';
    onClose?: () => void;
}

function EmailSummaryContent({
    isLoading,
    points,
    error,
}: {
    isLoading: boolean;
    points: string[] | null;
    error: string | null;
}) {
    return (
        <>
            <div className="email-summary-popup__header">
                <img
                    src={smartMessageIcon}
                    width={16}
                    height={16}
                    alt=""
                    className="email-summary-popup__icon"
                />
                <div className="email-summary-popup__title">Summary</div>
            </div>

            {isLoading && (
                <div className="email-summary-popup__loading" role="status" aria-label="Loading summary">
                    <div className="email-loader-container email-summary-popup__loader">
                        <div className="email-loader-dots">
                            <div className="email-loader-dot" />
                            <div className="email-loader-dot" />
                            <div className="email-loader-dot" />
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && error && (
                <div className="email-summary-popup__empty">{error}</div>
            )}

            {!isLoading && !error && points && points.length === 0 && (
                <div className="email-summary-popup__empty">No summary available</div>
            )}

            {!isLoading && !error && points && points.length > 0 && (
                <ol className="email-summary-popup__list">
                    {points.map((point, index) => (
                        <li key={`${index}-${point.slice(0, 24)}`}>
                            <span className="email-summary-popup__list-text">{point}</span>
                        </li>
                    ))}
                </ol>
            )}
        </>
    );
}

function EmailSummaryAnchoredPortal({
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
            const popupWidth = popupRect?.width ?? 280;
            const popupHeight = popupRect?.height ?? 120;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const spaceAbove = anchorRect.top;
            const spaceBelow = viewportHeight - anchorRect.bottom;
            // Prefer below the hovered row so the popup isn't mistaken for the email above.
            const placement: 'top' | 'bottom' =
                spaceBelow >= popupHeight + POPUP_GAP || spaceBelow >= spaceAbove
                    ? 'bottom'
                    : 'top';

            let top =
                placement === 'top'
                    ? anchorRect.top - popupHeight - POPUP_GAP
                    : anchorRect.bottom + POPUP_GAP;

            let left = anchorRect.left + 24;
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
            className={`email-summary-popup${position ? ` is-${position.placement}` : ''}`}
            style={
                position
                    ? { top: position.top, left: position.left }
                    : { visibility: 'hidden', top: 0, left: 0 }
            }
            role="tooltip"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>,
        document.body,
    );
}

function EmailSummarySheetPortal({
    open,
    children,
    onClose,
}: {
    open: boolean;
    children: ReactNode;
    onClose?: () => void;
}) {
    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <>
            <div
                className="email-summary-backdrop"
                aria-hidden="true"
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose?.();
                }}
            />
            <div
                className="email-summary-popup email-summary-popup--sheet"
                role="dialog"
                aria-modal="true"
                aria-label="Email summary"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="email-summary-popup__sheet-handle" aria-hidden="true" />
                {children}
            </div>
        </>,
        document.body,
    );
}

function EmailSummaryPopover({
    open,
    anchorEl,
    isLoading,
    points,
    error,
    onMouseEnter,
    onMouseLeave,
    variant = 'popover',
    onClose,
}: EmailSummaryPopoverProps) {
    const content = (
        <EmailSummaryContent isLoading={isLoading} points={points} error={error} />
    );

    if (variant === 'sheet') {
        return (
            <EmailSummarySheetPortal open={open} onClose={onClose}>
                {content}
            </EmailSummarySheetPortal>
        );
    }

    return (
        <EmailSummaryAnchoredPortal
            open={open}
            anchorEl={anchorEl}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {content}
        </EmailSummaryAnchoredPortal>
    );
}

export default EmailSummaryPopover;
