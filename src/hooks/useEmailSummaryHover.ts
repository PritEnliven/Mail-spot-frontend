import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type RefObject,
    type TouchEvent as ReactTouchEvent,
} from 'react';
import { getEmailSummary } from '@services/aiService/aiService';

/** Show preparing blur on the row after this hover intent delay. */
const BLUR_DELAY_MS = 500;
/** Start the AI summary API after this longer hover delay. */
const OPEN_DELAY_MS = 2000;
const CLOSE_DELAY_MS = 175;
/** Touch / coarse pointer: hold this long to open summary instead of navigating. */
const LONG_PRESS_MS = 500;
/** Cancel long-press if the finger moves more than this (px) — likely scrolling. */
const LONG_PRESS_MOVE_THRESHOLD_PX = 10;
/** Ignore hover opens until scrolling has been idle this long. */
const SCROLL_IDLE_MS = 180;

const LONG_PRESS_IGNORE_SELECTOR =
    'a, button, input, label, [role="button"], .mail-received-check-btn';

/** Session cache — same messageId is not re-fetched until reload. */
const emailSummaryCache = new Map<string, string[]>();

/** Shared across all rows: scroll moves rows under a fixed cursor and fires mouseenter. */
let isMailListScrolling = false;
let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
const scrollCloseListeners = new Set<() => void>();
let scrollListenerAttached = false;

/** Only one summary popover open at a time (important for long-press on mobile). */
const openSummaryClosers = new Set<() => void>();

function isLongPressIgnoredTarget(target: EventTarget | null) {
    return Boolean(target instanceof Element && target.closest(LONG_PRESS_IGNORE_SELECTOR));
}

function attachScrollSuppression() {
    if (scrollListenerAttached || typeof document === 'undefined') return;
    scrollListenerAttached = true;

    const onScroll = () => {
        isMailListScrolling = true;
        if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
        scrollCloseListeners.forEach((listener) => listener());
        scrollIdleTimer = setTimeout(() => {
            isMailListScrolling = false;
            scrollIdleTimer = null;
        }, SCROLL_IDLE_MS);
    };

    // Capture: scroll does not bubble; this still sees SimpleBar / nested list scroll.
    document.addEventListener('scroll', onScroll, true);
}

export type EmailSummaryHoverState = {
    open: boolean;
    /** True while the AI summary request is in flight (row shows preparing blur; menu stays closed). */
    isLoading: boolean;
    points: string[] | null;
    error: string | null;
    anchorEl: HTMLElement | null;
    rowRef: RefObject<HTMLDivElement | null>;
    /** True when device has fine pointer hover (desktop). */
    isHoverDevice: boolean;
    onRowMouseEnter: () => void;
    onRowMouseLeave: () => void;
    onPopoverMouseEnter: () => void;
    onPopoverMouseLeave: () => void;
    /** Mobile/touch: long-press handlers (short tap still opens the email). */
    onRowTouchStart: (event: ReactTouchEvent) => void;
    onRowTouchMove: (event: ReactTouchEvent) => void;
    onRowTouchEnd: () => void;
    onRowTouchCancel: () => void;
    onRowContextMenu: (event: { preventDefault: () => void }) => void;
    /**
     * Call from row click on touch devices. Returns true when the click followed a
     * long-press (summary already opened) so the email should not navigate open.
     */
    shouldSuppressClickAfterLongPress: () => boolean;
    close: () => void;
};

interface UseEmailSummaryHoverOptions {
    enabled: boolean;
    messageId?: string | null;
    boxName?: string | null;
    /** Close when the row’s email is opened in the detail pane. */
    isActive?: boolean;
}

function canHover() {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
}

export function useEmailSummaryHover({
    enabled,
    messageId,
    boxName,
    isActive = false,
}: UseEmailSummaryHoverOptions): EmailSummaryHoverState {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [points, setPoints] = useState<string[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [isHoverDevice, setIsHoverDevice] = useState(canHover);

    const rowRef = useRef<HTMLDivElement | null>(null);
    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
    const longPressTriggeredRef = useRef(false);
    const requestIdRef = useRef(0);
    const hoveredMessageIdRef = useRef<string | null>(null);
    const openRef = useRef(false);

    const clearOpenTimer = useCallback(() => {
        if (openTimerRef.current) {
            clearTimeout(openTimerRef.current);
            openTimerRef.current = null;
        }
    }, []);

    const clearBlurTimer = useCallback(() => {
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
        }
    }, []);

    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const clearLongPressTimer = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        longPressStartRef.current = null;
    }, []);

    /** Invalidate in-flight responses without aborting HTTP (avoids network-error toasts). */
    const invalidateInFlight = useCallback(() => {
        requestIdRef.current += 1;
    }, []);

    const close = useCallback(() => {
        clearOpenTimer();
        clearBlurTimer();
        clearCloseTimer();
        clearLongPressTimer();
        invalidateInFlight();
        hoveredMessageIdRef.current = null;
        openRef.current = false;
        setOpen(false);
        setIsLoading(false);
        setError(null);
        setAnchorEl(null);
    }, [clearBlurTimer, clearCloseTimer, clearLongPressTimer, clearOpenTimer, invalidateInFlight]);

    const closeRef = useRef(close);
    closeRef.current = close;

    const showPopover = useCallback(() => {
        openRef.current = true;
        setOpen(true);
    }, []);

    const fetchSummary = useCallback(
        async (id: string) => {
            const cached = emailSummaryCache.get(id);
            if (cached) {
                setPoints(cached);
                setIsLoading(false);
                setError(null);
                showPopover();
                return;
            }

            const requestId = ++requestIdRef.current;

            // Keep row blurred while fetching; open the menu only after the response.
            setIsLoading(true);
            setError(null);
            setPoints(null);
            openRef.current = false;
            setOpen(false);

            const payload: { messageId: string; boxName?: string } = { messageId: id };
            if (boxName?.trim()) payload.boxName = boxName.trim();

            // Yield so React can paint the preparing blur before the request settles.
            await Promise.resolve();

            const response = await getEmailSummary(payload);

            // Ignore stale responses if hover moved on or preparing was cancelled.
            if (requestId !== requestIdRef.current || hoveredMessageIdRef.current !== id) {
                return;
            }

            if (response?.statusCode === 403) {
                close();
                return;
            }

            const summary = Array.isArray(response?.data?.emailSummary)
                ? (response.data.emailSummary as string[])
                : null;

            if (summary === null) {
                setError("Couldn't load summary");
                setPoints([]);
                setIsLoading(false);
                showPopover();
                return;
            }

            emailSummaryCache.set(id, summary);
            setPoints(summary);
            setIsLoading(false);
            setError(null);
            showPopover();
        },
        [boxName, close, showPopover],
    );

    const openPopover = useCallback(
        (opts?: { fromPress?: boolean }) => {
            const id = messageId?.trim();
            const fromPress = Boolean(opts?.fromPress);
            if (!enabled || !id || isMailListScrolling) return;
            if (!fromPress && !canHover()) return;

            // Close any other row's summary first (mobile tap switching rows).
            openSummaryClosers.forEach((fn) => {
                if (fn !== closeRef.current) fn();
            });

            clearCloseTimer();

            hoveredMessageIdRef.current = id;
            setAnchorEl(rowRef.current);

            const cached = emailSummaryCache.get(id);
            if (cached) {
                setPoints(cached);
                setIsLoading(false);
                setError(null);
                showPopover();
                return;
            }

            // Keep menu closed until AI summary is ready; row shows preparing blur instead.
            void fetchSummary(id);
        },
        [clearCloseTimer, enabled, fetchSummary, messageId, showPopover],
    );

    const scheduleClose = useCallback(() => {
        clearCloseTimer();
        closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            invalidateInFlight();
            hoveredMessageIdRef.current = null;
            openRef.current = false;
            setOpen(false);
            setIsLoading(false);
            setAnchorEl(null);
        }, CLOSE_DELAY_MS);
    }, [clearCloseTimer, invalidateInFlight]);

    const onRowMouseEnter = useCallback(() => {
        if (!enabled || !messageId?.trim() || !canHover() || isMailListScrolling) return;
        clearCloseTimer();
        clearOpenTimer();
        clearBlurTimer();

        const id = messageId.trim();

        // Show preparing blur while the user keeps hovering (before the API fires).
        blurTimerRef.current = setTimeout(() => {
            blurTimerRef.current = null;
            if (isMailListScrolling || openRef.current) return;
            if (emailSummaryCache.has(id)) return;
            hoveredMessageIdRef.current = id;
            setAnchorEl(rowRef.current);
            setIsLoading(true);
        }, BLUR_DELAY_MS);

        openTimerRef.current = setTimeout(() => {
            openTimerRef.current = null;
            if (isMailListScrolling) return;
            openPopover();
        }, OPEN_DELAY_MS);
    }, [clearBlurTimer, clearCloseTimer, clearOpenTimer, enabled, messageId, openPopover]);

    const onRowMouseLeave = useCallback(() => {
        if (!canHover()) return;
        clearOpenTimer();
        clearBlurTimer();
        // While summary is still preparing there is no menu to move into — cancel immediately.
        if (!openRef.current) {
            clearCloseTimer();
            invalidateInFlight();
            hoveredMessageIdRef.current = null;
            setIsLoading(false);
            setAnchorEl(null);
            return;
        }
        scheduleClose();
    }, [clearBlurTimer, clearCloseTimer, clearOpenTimer, invalidateInFlight, scheduleClose]);

    const onPopoverMouseEnter = useCallback(() => {
        if (isMailListScrolling || !canHover()) return;
        clearCloseTimer();
    }, [clearCloseTimer]);

    const onPopoverMouseLeave = useCallback(() => {
        if (!canHover()) return;
        scheduleClose();
    }, [scheduleClose]);

    /**
     * Touch / coarse pointer: long-press opens summary.
     * Short tap is left alone so the row click can open the email.
     */
    const onRowTouchStart = useCallback(
        (event: ReactTouchEvent) => {
            if (
                !enabled ||
                !messageId?.trim() ||
                canHover() ||
                isMailListScrolling ||
                event.touches.length !== 1 ||
                isLongPressIgnoredTarget(event.target)
            ) {
                return;
            }

            clearLongPressTimer();
            longPressTriggeredRef.current = false;
            const touch = event.touches[0];
            longPressStartRef.current = { x: touch.clientX, y: touch.clientY };
            longPressTimerRef.current = setTimeout(() => {
                longPressTimerRef.current = null;
                longPressStartRef.current = null;
                if (isMailListScrolling) return;
                longPressTriggeredRef.current = true;
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(10);
                }
                openPopover({ fromPress: true });
            }, LONG_PRESS_MS);
        },
        [clearLongPressTimer, enabled, messageId, openPopover],
    );                                                                     

    const onRowTouchMove = useCallback(
        (event: ReactTouchEvent) => {
            const start = longPressStartRef.current;
            if (!start || !longPressTimerRef.current || event.touches.length !== 1) return;

            const touch = event.touches[0];
            const dx = Math.abs(touch.clientX - start.x);
            const dy = Math.abs(touch.clientY - start.y);
            if (dx > LONG_PRESS_MOVE_THRESHOLD_PX || dy > LONG_PRESS_MOVE_THRESHOLD_PX) {
                clearLongPressTimer();
            }
        },
        [clearLongPressTimer],
    );

    const onRowTouchEnd = useCallback(() => {
        clearLongPressTimer();
    }, [clearLongPressTimer]);

    const onRowTouchCancel = useCallback(() => {
        clearLongPressTimer();
        longPressTriggeredRef.current = false;
    }, [clearLongPressTimer]);

    const onRowContextMenu = useCallback(
        (event: { preventDefault: () => void }) => {
            if (!enabled || canHover()) return;
            // Avoid the native callout / context menu stealing long-press on mobile.
            event.preventDefault();
        },
        [enabled],
    );

    const shouldSuppressClickAfterLongPress = useCallback(() => {
        if (!longPressTriggeredRef.current) return false;
        longPressTriggeredRef.current = false;
        return true;
    }, []);

    // Track hover capability across resize / device mode changes.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
        const update = () => setIsHoverDevice(mq.matches);
        update();
        mq.addEventListener?.('change', update);
        return () => mq.removeEventListener?.('change', update);
    }, []);

    // Register this row's closer so other rows can dismiss us.
    useEffect(() => {
        const closer = () => closeRef.current();
        openSummaryClosers.add(closer);
        return () => {
            openSummaryClosers.delete(closer);
        };
    }, []);

    // Outside tap dismisses an open sheet, or cancels an in-flight prepare, on touch devices.
    useEffect(() => {
        if ((!open && !isLoading) || canHover()) return;

        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (rowRef.current?.contains(target)) return;
            const popup = document.querySelector('.email-summary-popup');
            if (popup?.contains(target)) return;
            // Backdrop (or any other outside target) dismisses the sheet / preparing state.
            close();
        };

        const bindTimer = window.setTimeout(() => {
            document.addEventListener('mousedown', onPointerDown);
            document.addEventListener('touchstart', onPointerDown);
        }, 0);

        return () => {
            window.clearTimeout(bindTimer);
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [open, isLoading, close]);

    // Close when the email is opened or AI features are disabled.
    useEffect(() => {
        if (isActive || !enabled) {
            close();
        }
    }, [isActive, enabled, close]);

    // While scrolling the mail list, cancel pending opens and dismiss any open popover.
    useEffect(() => {
        if (!enabled) return;

        attachScrollSuppression();

        const onScrollClose = () => {
            clearOpenTimer();
            clearBlurTimer();
            clearCloseTimer();
            clearLongPressTimer();
            longPressTriggeredRef.current = false;
            invalidateInFlight();
            hoveredMessageIdRef.current = null;
            openRef.current = false;
            setOpen(false);
            setIsLoading(false);
            setAnchorEl(null);
        };

        scrollCloseListeners.add(onScrollClose);
        return () => {
            scrollCloseListeners.delete(onScrollClose);
        };
    }, [clearBlurTimer, clearCloseTimer, clearLongPressTimer, clearOpenTimer, enabled, invalidateInFlight]);

    useEffect(() => {
        return () => {
            clearOpenTimer();
            clearBlurTimer();
            clearCloseTimer();
            clearLongPressTimer();
            invalidateInFlight();
        };
    }, [clearBlurTimer, clearCloseTimer, clearLongPressTimer, clearOpenTimer, invalidateInFlight]);

    return {
        open,
        isLoading,
        points,
        error,
        anchorEl,
        rowRef,
        isHoverDevice,
        onRowMouseEnter,
        onRowMouseLeave,
        onPopoverMouseEnter,
        onPopoverMouseLeave,
        onRowTouchStart,
        onRowTouchMove,
        onRowTouchEnd,
        onRowTouchCancel,
        onRowContextMenu,
        shouldSuppressClickAfterLongPress,
        close,
    };
}
