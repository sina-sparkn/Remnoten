import React, { useRef, useState, useEffect } from 'react';

/**
 * AutoScrollText
 *
 * Implements a smooth, continuous infinite marquee loop (NOT ping-pong / go-and-return).
 * - If the text fits in the container, it stays static with zero overhead.
 * - If the text overflows, a seamless duplicate is rendered after a spacer gap.
 * - Glides continuously in one direction with a gentle pause at the start of each loop,
 *   looping seamlessly without any visual jump or reversing direction.
 * - Flawlessly handles Persian / Arabic (RTL) and English / Cyrillic (LTR) scripts
 *   without layout clipping or coordinate flipping.
 * - Automatically pauses when touched or hovered so the user can read comfortably.
 */
export default function AutoScrollText({
  children,
  className = '',
  dir,
  speed = 28, // pixels per second
  pauseStart = 1.6, // seconds to pause at the beginning of each loop cycle
  gap = 42, // spacer gap between duplicated text in pixels
  as: Component = 'div',
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Strip 'truncate' class if passed so the full text width can be measured
  const cleanClassName = className.replace(/\btruncate\b/g, '').trim();
  const textTooltip = typeof children === 'string' ? children : undefined;

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    const track = trackRef.current;
    if (!container || !content) return;

    let isDisposed = false;

    const updateScrollAnimation = () => {
      if (isDisposed || !container || !content) return;

      // Cancel any running animation cleanly
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
      if (track) {
        track.style.transform = 'none';
      }

      // Measure dimensions
      const containerWidth = container.clientWidth;
      const contentWidth = content.scrollWidth;

      // If container is hidden (e.g. inside an inactive tab/modal), wait for visibility
      if (containerWidth <= 0 || contentWidth <= 0) return;

      const overflow = contentWidth - containerWidth;

      // If no overflow (or negligible subpixel), stay static
      if (overflow <= 2) {
        if (isOverflowing) setIsOverflowing(false);
        return;
      }

      if (!isOverflowing) {
        setIsOverflowing(true);
        return; // will re-run on next render with duplicate span in place
      }

      // If overflowing and track is present with duplicate span
      if (track) {
        const cycleDistance = Math.round(contentWidth + gap);
        const scrollDuration = Math.max(2.8, cycleDistance / speed);
        const totalDuration = pauseStart + scrollDuration;
        const pauseRatio = Math.min(0.4, pauseStart / totalDuration);

        // One-direction continuous loop keyframes (0 -> -cycleDistance -> seamless restart)
        const keyframes = [
          { transform: 'translateX(0)', offset: 0 },
          { transform: 'translateX(0)', offset: pauseRatio },
          { transform: `translateX(-${cycleDistance}px)`, offset: 1 },
        ];

        try {
          if (typeof track.animate === 'function') {
            const anim = track.animate(keyframes, {
              duration: totalDuration * 1000,
              iterations: Infinity,
              easing: 'linear',
            });
            animationRef.current = anim;
          }
        } catch (err) {
          console.warn('AutoScrollText continuous marquee failed:', err);
        }
      }
    };

    // Initial measurement
    updateScrollAnimation();

    // Re-check once web fonts (like Persian Vazirmatn) have loaded
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
  }, [children, speed, pauseStart, gap, isOverflowing]);

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
      title={textTooltip}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handlePointerEnter}
      onTouchEnd={handlePointerLeave}
      className={`overflow-hidden relative max-w-full block select-none ${cleanClassName}`}
      style={{
        maskImage: isOverflowing
          ? 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)'
          : 'none',
        WebkitMaskImage: isOverflowing
          ? 'linear-gradient(to right, transparent 0%, black 6px, black calc(100% - 6px), transparent 100%)'
          : 'none',
        ...style,
      }}
      {...rest}
    >
      <div
        ref={trackRef}
        className="inline-flex items-center whitespace-nowrap will-change-transform"
        style={{
          direction: 'ltr',
          width: 'max-content',
        }}
      >
        {/* Primary copy */}
        <span
          ref={contentRef}
          className="shrink-0 inline-block whitespace-nowrap"
          dir={dir || 'auto'}
        >
          {children}
        </span>

        {/* Seamless duplicate copy and spacers (only rendered when overflowing) */}
        {isOverflowing && (
          <>
            <span
              className="shrink-0 inline-block select-none pointer-events-none"
              style={{ width: `${gap}px` }}
              aria-hidden="true"
            />
            <span
              className="shrink-0 inline-block whitespace-nowrap"
              dir={dir || 'auto'}
              aria-hidden="true"
            >
              {children}
            </span>
            <span
              className="shrink-0 inline-block select-none pointer-events-none"
              style={{ width: `${gap}px` }}
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </Component>
  );
}
