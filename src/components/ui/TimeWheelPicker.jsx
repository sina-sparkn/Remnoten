import React, { useRef, useEffect, useState, useCallback } from 'react';
import { hapticLight, playWheelSound } from '../../api.js';
import { useI18n } from '../../lib/i18n.jsx';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function WheelColumn({ items, selectedIndex, onSelect, label, compact = false, maxIndex = null }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const lastHapticIndexRef = useRef(selectedIndex);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const itemHeight = compact ? 36 : 44;
  const padding = compact ? 36 : 88;
  const containerHeight = compact ? 108 : 220;
  const maxAllowed = maxIndex !== null && maxIndex !== undefined ? maxIndex : items.length - 1;

  // Sync scroll position when selectedIndex or maxIndex changes externally
  useEffect(() => {
    const safeIndex = Math.min(selectedIndex, maxAllowed);
    setActiveIndex(safeIndex);
    lastHapticIndexRef.current = safeIndex;
    if (containerRef.current && !isScrollingRef.current) {
      const targetTop = safeIndex * itemHeight;
      if (Math.abs(containerRef.current.scrollTop - targetTop) > 2) {
        containerRef.current.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex, maxAllowed, itemHeight]);

  // Handle scroll events with Apple-like haptics & index tracking
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const currentScrollTop = containerRef.current.scrollTop;
    const nearestIndex = Math.max(0, Math.min(maxAllowed, Math.round(currentScrollTop / itemHeight)));

    if (nearestIndex !== activeIndex) {
      setActiveIndex(nearestIndex);
      if (nearestIndex !== lastHapticIndexRef.current) {
        lastHapticIndexRef.current = nearestIndex;
        playWheelSound();
        hapticLight();
      }
    }

    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      const finalIndex = Math.max(0, Math.min(maxAllowed, Math.round(containerRef.current.scrollTop / itemHeight)));
      if (containerRef.current && finalIndex * itemHeight !== containerRef.current.scrollTop) {
        containerRef.current.scrollTo({
          top: finalIndex * itemHeight,
          behavior: 'smooth',
        });
      }
      onSelect(finalIndex);
    }, 120);
  }, [maxAllowed, activeIndex, onSelect, itemHeight]);

  // Tap directly on an item to center it
  const handleItemClick = (idx) => {
    if (!containerRef.current || idx > maxAllowed) return;
    hapticLight();
    setActiveIndex(idx);
    containerRef.current.scrollTo({
      top: idx * itemHeight,
      behavior: 'smooth',
    });
    onSelect(idx);
  };

  // Desktop mouse drag support
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    dragStartYRef.current = e.clientY;
    dragStartScrollRef.current = containerRef.current.scrollTop;

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const deltaY = moveEvent.clientY - dragStartYRef.current;
      containerRef.current.scrollTop = dragStartScrollRef.current - deltaY;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (containerRef.current) {
        const finalIndex = Math.max(0, Math.min(maxAllowed, Math.round(containerRef.current.scrollTop / itemHeight)));
        containerRef.current.scrollTo({
          top: finalIndex * itemHeight,
          behavior: 'smooth',
        });
        onSelect(finalIndex);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex-1 flex flex-col items-center select-none relative">
      {label && !compact && (
        <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1">
          {label}
        </span>
      )}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        style={{
          height: `${containerHeight}px`,
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="w-full overflow-y-auto cursor-grab active:cursor-grabbing no-scrollbar"
      >
        {/* Top spacer to center first item */}
        <div style={{ height: `${padding}px` }} />

        {items.map((item, idx) => {
          const distance = Math.abs(idx - activeIndex);
          const isDisabled = idx > maxAllowed;

          // Apple cylinder 3D perspective rotation
          const clampedDiff = Math.max(-3, Math.min(3, idx - activeIndex));
          const rotateAngle = clampedDiff * (compact ? 18 : 22);

          let textClass = compact
            ? 'text-white font-bold text-[20px] scale-105 tracking-tight opacity-100'
            : 'text-white font-black text-[27px] scale-110 tracking-tight opacity-100';

          if (isDisabled) {
            textClass = compact
              ? 'text-[#44444C] font-normal text-[14px] opacity-20 line-through'
              : 'text-[#44444C] font-normal text-[16px] opacity-20 line-through';
          } else if (distance === 1) {
            textClass = compact
              ? 'text-[#8E8E93] font-medium text-[15px] opacity-60'
              : 'text-[#8E8E93] font-semibold text-[20px] scale-95 opacity-60';
          } else if (distance === 2) {
            textClass = compact
              ? 'text-[#545458] font-normal text-[12px] opacity-25'
              : 'text-[#545458] font-medium text-[16px] scale-85 opacity-30';
          } else if (distance >= 3) {
            textClass = 'text-[#333338] font-normal text-[12px] opacity-10';
          }

          return (
            <div
              key={item}
              onClick={() => handleItemClick(idx)}
              style={{
                height: `${itemHeight}px`,
                scrollSnapAlign: 'center',
                transform: `perspective(350px) rotateX(${rotateAngle}deg)`,
                transformOrigin: 'center center',
              }}
              className={`flex items-center justify-center transition-all duration-150 ease-out ${
                isDisabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'
              }`}
            >
              <span className={`${textClass} font-mono transition-all duration-150`}>
                {item}
              </span>
            </div>
          );
        })}

        {/* Bottom spacer to center last item */}
        <div style={{ height: `${padding}px` }} />
      </div>
    </div>
  );
}

export default function TimeWheelPicker({ value = '08:00', onChange, compact = false, maxTime = null }) {
  const { t } = useI18n();
  const [hStr, mStr] = (value || '08:00').split(':');
  let hourIndex = Math.max(0, Math.min(23, parseInt(hStr || '8', 10)));
  let minuteIndex = Math.max(0, Math.min(59, parseInt(mStr || '0', 10)));

  let maxHour = 23;
  let maxMinute = 59;
  if (maxTime && /^\d{2}:\d{2}$/.test(maxTime)) {
    const [mh, mm] = maxTime.split(':').map(Number);
    maxHour = mh;
    if (hourIndex >= maxHour) {
      hourIndex = maxHour;
      maxMinute = mm;
      if (minuteIndex > maxMinute) {
        minuteIndex = maxMinute;
      }
    }
  }

  const handleHourSelect = useCallback((newHour) => {
    let effectiveHour = newHour;
    let effectiveMinute = minuteIndex;
    if (maxTime && /^\d{2}:\d{2}$/.test(maxTime)) {
      const [mh, mm] = maxTime.split(':').map(Number);
      if (effectiveHour > mh) {
        effectiveHour = mh;
      }
      if (effectiveHour === mh && effectiveMinute > mm) {
        effectiveMinute = mm;
      }
    }
    const formatted = `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`;
    onChange?.(formatted);
  }, [minuteIndex, maxTime, onChange]);

  const handleMinuteSelect = useCallback((newMin) => {
    let effectiveHour = hourIndex;
    let effectiveMinute = newMin;
    if (maxTime && /^\d{2}:\d{2}$/.test(maxTime)) {
      const [mh, mm] = maxTime.split(':').map(Number);
      if (effectiveHour > mh) {
        effectiveHour = mh;
      }
      if (effectiveHour === mh && effectiveMinute > mm) {
        effectiveMinute = mm;
      }
    }
    const formatted = `${String(effectiveHour).padStart(2, '0')}:${String(effectiveMinute).padStart(2, '0')}`;
    onChange?.(formatted);
  }, [hourIndex, maxTime, onChange]);

  const itemHeight = compact ? 36 : 44;
  const highlightTop = compact ? 36 : 88 + 24;
  const gradientHeight = compact ? '36px' : '88px';

  return (
    <div
      dir="ltr"
      className={`relative w-full rounded-2xl bg-[#121215] border border-[#222228] overflow-hidden select-none ${
        compact ? 'p-1.5' : 'p-2 shadow-inner'
      }`}
    >
      {/* Central Apple Selection Highlight Band */}
      <div
        className="absolute left-2 right-2 rounded-xl bg-white/[0.08] border border-white/[0.12] pointer-events-none z-0"
        style={{
          top: `${highlightTop}px`,
          height: `${itemHeight}px`,
        }}
      />

      {/* Top & Bottom Cylinder Shadow Gradients */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10 bg-gradient-to-b from-[#121215] via-[#121215]/80 to-transparent"
        style={{ height: gradientHeight }}
      />
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-10 bg-gradient-to-t from-[#121215] via-[#121215]/80 to-transparent"
        style={{ height: gradientHeight }}
      />

      {/* Two Wheel Columns with colon divider */}
      <div className={`flex items-center justify-between relative z-5 ${compact ? 'px-2' : 'px-3'}`}>
        {/* Hours Wheel */}
        <WheelColumn
          items={HOURS}
          selectedIndex={hourIndex}
          onSelect={handleHourSelect}
          label={t('time_hours')}
          compact={compact}
          maxIndex={maxTime ? maxHour : null}
        />

        {/* Apple colon separator */}
        <div
          className={`flex flex-col items-center justify-center select-none pointer-events-none ${
            compact ? 'pt-0 px-1' : 'pt-5 px-2'
          }`}
        >
          <span className={`text-white/80 font-black leading-none mb-1 ${compact ? 'text-[20px]' : 'text-[24px]'}`}>
            :
          </span>
        </div>

        {/* Minutes Wheel */}
        <WheelColumn
          items={MINUTES}
          selectedIndex={minuteIndex}
          onSelect={handleMinuteSelect}
          label={t('time_minutes')}
          compact={compact}
          maxIndex={maxTime && hourIndex === maxHour ? maxMinute : null}
        />
      </div>
    </div>
  );
}
