import { useCallback, useRef, type TouchEvent as ReactTouchEvent } from "react";

export type SwipeDirection = "left" | "right";

interface UseSwipeGestureOptions {
    /** Minimum horizontal distance (px) to count as a swipe. Default 60. */
    threshold?: number;
    /** Max vertical drift allowed relative to horizontal move. Default 0.75. */
    maxVerticalRatio?: number;
    enabled?: boolean;
    onSwipe?: (direction: SwipeDirection) => void;
    /** Skip swipe when touch starts inside this selector (e.g. inputs, editor). */
    ignoreSelector?: string;
}

/**
 * Touch swipe handlers for horizontal left/right gestures.
 * Distinguishes from vertical scroll by requiring mostly-horizontal movement.
 */
export function useSwipeGesture({
    threshold = 60,
    maxVerticalRatio = 0.75,
    enabled = true,
    onSwipe,
    ignoreSelector = "input, textarea, select, button, a, .ck-editor, .ck-content, .reply-mail-box, .modal, .dropdown-menu",
}: UseSwipeGestureOptions = {}) {
    const startRef = useRef<{ x: number; y: number; ignored: boolean } | null>(null);
    const onSwipeRef = useRef(onSwipe);
    onSwipeRef.current = onSwipe;

    const onTouchStart = useCallback(
        (e: ReactTouchEvent) => {
            if (!enabled || e.touches.length !== 1) {
                startRef.current = null;
                return;
            }

            const target = e.target as Element | null;
            const ignored = !!(target && ignoreSelector && target.closest(ignoreSelector));
            const touch = e.touches[0];
            startRef.current = { x: touch.clientX, y: touch.clientY, ignored };
        },
        [enabled, ignoreSelector]
    );

    const onTouchEnd = useCallback(
        (e: ReactTouchEvent) => {
            const start = startRef.current;
            startRef.current = null;

            if (!enabled || !start || start.ignored || e.changedTouches.length !== 1) return;

            const touch = e.changedTouches[0];
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (absDx < threshold) return;
            if (absDy > absDx * maxVerticalRatio) return;

            onSwipeRef.current?.(dx < 0 ? "left" : "right");
        },
        [enabled, threshold, maxVerticalRatio]
    );

    const onTouchCancel = useCallback(() => {
        startRef.current = null;
    }, []);

    return { onTouchStart, onTouchEnd, onTouchCancel };
}
