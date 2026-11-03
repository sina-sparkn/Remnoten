import React, { useRef, useState, useEffect } from 'react';

/**
 * AutoScrollText
 *
 * Smoothly slides text back and forth (ping-pong loop) when the text overflows its container,
 * allowing users to comfortably read the entire description without breaking layouts or
 * getting cut off with "...".
 * If the text fits within the container, it behaves statically with zero animation overhead.
 */
export default function AutoScrollText({
  children,
  className = '',
  dir = 'auto',
  speed = 28, // pixels per second
  pauseStart = 2.0, // seconds to pause at the start
  pauseEnd = 1.6, // seconds to pause at the end
  as: Component = 'div',
  ...rest
}) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Strip 'truncate' class if passed so the full text is rendered for sliding
  const cleanClassName = className.replace(/\btruncate\b/g, '').trim();
  const textTooltip = typeof children === 'string' ? children : undefined;

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    let isDisposed = false;

    const updateScrollAnimation = () => {
      if (isDisposed || !container || !content) return;

      // Cancel previous animation cleanly
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
      content.style.transform = 'none';

      // Measure dimensions
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;

      // If container is hidden (e.g. inside an inactive tab/modal), wait for visibility
      if (containerWidth <= 0 || contentWidth <= 0) return;

      const overflow = contentWidth - containerWidth;

      // If no overflow (or negligible subpixel), stay static
      if (overflow <= 2) {
        setIsOverflowing(false);
        return;
      }

      setIsOverflowing(true);

      // Provide breathing room at the end of the slide
      const extraPad = 12;
      const distance = overflow + extraPad;

      // Determine text direction (LTR vs RTL)
      const computedDir = window.getComputedStyle(container).direction;
      const isRtl = computedDir === 'rtl';
      const targetX = isRtl ? distance : -distance;

      // Calculate readable, proportional durations
      const slideDuration = Math.max(2.2, distance / speed);
      const returnDuration = Math.max(1.8, distance / (speed * 1.35));
      const totalDuration = pauseStart + slideDuration + pauseEnd + returnDuration;

      // Fractional timeline offsets (0 to 1)
      const t1 = pauseStart / totalDuration;
      const t2 = (pauseStart + slideDuration) / totalDuration;
      const t3 = (pauseStart + slideDuration + pauseEnd) / totalDuration;

      const keyframes = [
        { transform: 'translateX(0)', offset: 0, easing: 'ease-in-out' },
        { transform: 'translateX(0)', offset: t1, easing: 'ease-in-out' },
        { transform: `translateX(${targetX}px)`, offset: t2, easing: 'ease-in-out' },
        { transform: `translateX(${targetX}px)`, offset: t3, easing: 'ease-in-out' },
        { transform: 'translateX(0)', offset: 1 },
      ];

      try {
        if (typeof content.animate === 'function') {
          const anim = content.animate(keyframes, {
            duration: totalDuration * 1000,
            iterations: Infinity,
          });
          animationRef.current = anim;
        }
      } catch (err) {
        console.warn('AutoScrollText animation failed:', err);
      }
    };

    // Initial measurement
    updateScrollAnimation();

    // Re-check once web fonts have fully loaded to ensure precision
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!isDisposed) updateScrollAnimation();
      });
    }

    // Listen to container resizing
    const resizeObserver = new ResizeObserver(() => {
      updateScrollAnimation();
    });
    resizeObserver.observe(container);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
    };
  }, [children, speed, pauseStart, pauseEnd]);

  const handlePointerEnter = () => {
    if (animationRef.current && animationRef.current.playState === 'running') {
      animationRef.current.pause();
    }
  };

  const handlePointerLeave = () => {
    if (animationRef.current && animationRef.current.playState === 'paused') {
      animationRef.current.play();
    }
  };

  return (
    <Component
      ref={containerRef}
      dir={dir}
      title={textTooltip}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`overflow-hidden relative max-w-full block select-none ${cleanClassName}`}
      {...rest}
    >
      <span
        ref={contentRef}
        className="inline-block whitespace-nowrap will-change-transform"
      >
        {children}
      </span>
    </Component>
  );
}
