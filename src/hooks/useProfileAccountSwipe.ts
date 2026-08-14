import { useCallback, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
import {
  getAccountInitials,
  usePerformAccountSwitch,
} from '@hooks/usePerformAccountSwitch';

const SWIPE_THRESHOLD = 24;
const TAP_SLOP = 8;
const MAX_DRAG = 40;
const CLICK_SUPPRESS_MS = 400;

interface UseProfileAccountSwipeOptions {
  enabled: boolean;
}

export function useProfileAccountSwipe({ enabled }: UseProfileAccountSwipeOptions) {
  const { allAccounts, activeAccountId, isSwitchingAccount, switchByOffset } =
    usePerformAccountSwitch();

  const [dragOffset, setDragOffset] = useState(0);
  const [isSettling, setIsSettling] = useState(false);
  const [optimisticInitials, setOptimisticInitials] = useState<string | null>(null);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);
  const suppressClickUntilRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const switchLockRef = useRef(false);

  const hasMultipleAccounts = enabled && allAccounts.length > 1;
  const canSwipe = hasMultipleAccounts && !isSwitchingAccount && !switchLockRef.current;

  const { prevAccount, nextAccount, currentInitials } = useMemo(() => {
    const currentIndex = allAccounts.findIndex((a) => a.id === activeAccountId);
    const fromIndex = currentIndex >= 0 ? currentIndex : 0;
    const current = allAccounts[fromIndex];
    const prev =
      allAccounts.length > 1
        ? allAccounts[(fromIndex - 1 + allAccounts.length) % allAccounts.length]
        : null;
    const next =
      allAccounts.length > 1
        ? allAccounts[(fromIndex + 1) % allAccounts.length]
        : null;

    return {
      prevAccount: prev,
      nextAccount: next,
      currentInitials: current
        ? getAccountInitials(current.email, current.username)
        : '',
    };
  }, [allAccounts, activeAccountId]);

  const displayInitials = optimisticInitials || currentInitials;
  const prevInitials = prevAccount
    ? getAccountInitials(prevAccount.email, prevAccount.username)
    : '';
  const nextInitials = nextAccount
    ? getAccountInitials(nextAccount.email, nextAccount.username)
    : '';

  const resetDrag = useCallback((settle: boolean) => {
    startRef.current = null;
    if (dragOffsetRef.current === 0) return;
    dragOffsetRef.current = 0;
    if (settle) {
      setIsSettling(true);
      setDragOffset(0);
      window.setTimeout(() => setIsSettling(false), 200);
    } else {
      setIsSettling(false);
      setDragOffset(0);
    }
  }, []);

  const markSwiped = useCallback(() => {
    didSwipeRef.current = true;
    suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
    window.setTimeout(() => {
      didSwipeRef.current = false;
    }, CLICK_SUPPRESS_MS);
  }, []);

  const wasSwipeGesture = useCallback(() => {
    return didSwipeRef.current || Date.now() < suppressClickUntilRef.current;
  }, []);

  const onTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      if (
        !hasMultipleAccounts ||
        switchLockRef.current ||
        isSwitchingAccount ||
        e.touches.length !== 1
      ) {
        startRef.current = null;
        return;
      }
      const touch = e.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
    },
    [hasMultipleAccounts, isSwitchingAccount]
  );

  const onTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      const start = startRef.current;
      if (
        !hasMultipleAccounts ||
        switchLockRef.current ||
        isSwitchingAccount ||
        !start ||
        e.touches.length !== 1
      ) {
        return;
      }

      const touch = e.touches[0];
      const dy = touch.clientY - start.y;
      const dx = touch.clientX - start.x;

      if (Math.abs(dy) > TAP_SLOP && Math.abs(dy) >= Math.abs(dx)) {
        e.preventDefault();
        e.stopPropagation();
        const nextOffset = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dy));
        dragOffsetRef.current = nextOffset;
        setDragOffset(nextOffset);
      }
    },
    [hasMultipleAccounts, isSwitchingAccount]
  );

  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      const start = startRef.current;
      startRef.current = null;

      if (
        !hasMultipleAccounts ||
        switchLockRef.current ||
        isSwitchingAccount ||
        !start ||
        e.changedTouches.length !== 1
      ) {
        resetDrag(true);
        return;
      }

      const touch = e.changedTouches[0];
      const dy = touch.clientY - start.y;
      const dx = touch.clientX - start.x;
      const absDy = Math.abs(dy);
      const absDx = Math.abs(dx);

      if (absDy < SWIPE_THRESHOLD || absDx > absDy) {
        resetDrag(true);
        return;
      }

      markSwiped();
      const goingToNext = dy < 0;
      const target = goingToNext ? nextAccount : prevAccount;
      if (target) {
        setOptimisticInitials(getAccountInitials(target.email, target.username));
      }
      resetDrag(false);

      // Lock immediately so a second swipe cannot start before React re-renders.
      switchLockRef.current = true;
      void switchByOffset(goingToNext ? 1 : -1).finally(() => {
        switchLockRef.current = false;
        setOptimisticInitials(null);
      });
    },
    [
      hasMultipleAccounts,
      isSwitchingAccount,
      markSwiped,
      nextAccount,
      prevAccount,
      resetDrag,
      switchByOffset,
    ]
  );

  const onTouchCancel = useCallback(() => {
    resetDrag(true);
  }, [resetDrag]);

  return {
    canSwipe,
    hasMultipleAccounts,
    isSwitchingAccount,
    dragOffset,
    isSettling,
    displayInitials,
    prevInitials,
    nextInitials,
    wasSwipeGesture,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  };
}
