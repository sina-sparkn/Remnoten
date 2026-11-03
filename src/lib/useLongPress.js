import { useRef, useCallback, useEffect } from 'react';
import { hapticMedium } from '../api.js';

/**
 * Custom hook to handle long press gestures for mobile and desktop without
 * interfering with native scrolling.
 *
 * @param {Function} onLongPress - Callback when long press is detected (e.g. 500ms).
 * @param {Function} onClick - Normal click callback if long press and scrolling didn't happen.
 * @param {number} delay - Duration in ms before trigger (default: 500ms).
 */
export function useLongPress(onLongPress, onClick, delay = 500) {
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const isMovedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastTouchTimeRef = useRef(0);
  const isTouchingRef = useRef(false);
  const scrollListenerRef = useRef(null);

  const isInteractiveTarget = (target) => {
    const el = target?.target || target;
    return Boolean(
      el?.closest?.(
        'button, [role="switch"], [data-slot="switch"], [data-slot="switch-thumb"], input, textarea, select, .check-btn, [data-no-card-click]'
      )
    );
  };

  const removeScrollListener = useCallback(() => {
    if (scrollListenerRef.current) {
      window.removeEventListener('scroll', scrollListenerRef.current, { capture: true });
      scrollListenerRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    isMovedRef.current = true;
    clearTimer();
    removeScrollListener();
  }, [clearTimer, removeScrollListener]);

  const start = useCallback((e) => {
    // Only handle primary touch or left-click
    if (e.button !== undefined && e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;

    const isTouch = Boolean(e.touches);

    // Drop synthetic mouse events fired after touch
    if (!isTouch && Date.now() - lastTouchTimeRef.current < 700) {
      return;
    }

    if (isTouch) {
      lastTouchTimeRef.current = Date.now();
      isTouchingRef.current = true;
    }

    isLongPressRef.current = false;
    isMovedRef.current = false;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };

    clearTimer();
    removeScrollListener();

    // If any container on the page scrolls while touching, it is a scroll gesture -> cancel tap/long press
    const handleScroll = () => {
      isMovedRef.current = true;
      clearTimer();
    };
    scrollListenerRef.current = handleScroll;
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    timerRef.current = setTimeout(() => {
      if (!isMovedRef.current) {
        isLongPressRef.current = true;
        hapticMedium();
        if (onLongPress) {
          onLongPress(e);
        }
      }
    }, delay);
  }, [onLongPress, delay, clearTimer, removeScrollListener]);

  const move = useCallback((e) => {
    if (isMovedRef.current) return;
    if (isInteractiveTarget(e.target)) {
      cancel();
      return;
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    if (clientX === undefined || clientY === undefined) return;

    const dx = Math.abs(clientX - startPosRef.current.x);
    const dy = Math.abs(clientY - startPosRef.current.y);

    // If user moved more than 8px, it is a scroll/drag gesture
    if (dx > 8 || dy > 8) {
      cancel();
    }
  }, [cancel]);

  const end = useCallback(() => {
    clearTimer();
    removeScrollListener();
    isTouchingRef.current = false;
    // Do NOT trigger onClick here — native onClick handles tap if user did not move and did not long-press
  }, [clearTimer, removeScrollListener]);

  const handleClick = useCallback((e) => {
    if (isInteractiveTarget(e.target)) return;

    // If a long press was triggered, consume and suppress the click
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // If the user moved or scrolled, consume and suppress the click
    if (isMovedRef.current) {
      isMovedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  useEffect(() => {
    return () => {
      clearTimer();
      removeScrollListener();
    };
  }, [clearTimer, removeScrollListener]);

  return {
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onClick: handleClick,
    onContextMenu: (e) => {
      e.preventDefault();
      if (isLongPressRef.current) {
        e.stopPropagation();
      }
    },
  };
}
