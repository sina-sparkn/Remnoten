import React, { useMemo, useRef, useEffect } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';
import { hapticLight, hapticMedium, hapticSuccess, playCheckSound, playUncheckSound } from '../api.js';

/**
 * Builds 53 weeks (371 days) ending on the current week's Sunday.
 * Rows 0 to 6 correspond to Monday through Sunday.
 */
function build365Grid(todayStr) {
  const [year, month, day] = todayStr.split('-').map(Number);
  const today = new Date(year, month - 1, day, 12, 0, 0);

  // Day of week: 0 = Mon, ..., 6 = Sun
  const todayDow = (today.getDay() + 6) % 7;

  // Monday of the current week
  const currentWeekMon = new Date(today);
  currentWeekMon.setDate(today.getDate() - todayDow);

  // Monday 52 weeks ago
  const startMon = new Date(currentWeekMon);
  startMon.setDate(currentWeekMon.getDate() - 52 * 7);

  const weeks = [];
  const cur = new Date(startMon);

  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dt = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dt}`;
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      days.push({
        dateStr,
        isFuture,
        isToday,
        dow: d,
      });

      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}

export default function HabitContributionHeatmap({
  habit,
  completedDays,
  highlightedDate = null,
  showMonthLabels = false,
  onOpenDetail,
  onToggleDay,
}) {
  const { currentTheme } = useTheme();
  const { t } = useI18n();

  const scrollRef = useRef(null);
  const todayCellRef = useRef(null);
  const cellRefs = useRef({});
  const pointerPos = useRef({ x: 0, y: 0, moved: false });

  // Current local date YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // 53 weeks grid
  const weeks = useMemo(() => build365Grid(todayStr), [todayStr]);

  // Set of completed date strings for fast O(1) checks - prioritize completedDays prop if passed
  const completedSet = useMemo(() => {
    const list = completedDays !== undefined ? completedDays : (habit?.completedDays || []);
    return new Set(list);
  }, [habit?.completedDays, completedDays]);

  // Month headers row aligned with week columns
  const monthHeaders = useMemo(() => {
    if (!showMonthLabels) return [];
    const monthNames = t('months_short') || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const headers = new Array(weeks.length).fill(null);
    let lastMonth = -1;
    let lastCol = -10;

    weeks.forEach((week, colIdx) => {
      const d = new Date(week[0].dateStr + 'T12:00:00');
      const m = d.getMonth();

      if (m !== lastMonth) {
        if (colIdx - lastCol >= 3) {
          headers[colIdx] = monthNames[m];
          lastCol = colIdx;
        }
        lastMonth = m;
      }
    });

    return headers;
  }, [weeks, showMonthLabels, t]);

  // Scroll helper to center a target cell horizontally inside the heatmap container
  const scrollToDate = (dateStr, smooth = true) => {
    const container = scrollRef.current;
    if (!container) return;
    const cellEl = dateStr ? cellRefs.current[dateStr] : todayCellRef.current;
    if (cellEl) {
      const cellRect = cellEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const targetLeft =
        container.scrollLeft +
        (cellRect.left - containerRect.left) -
        container.clientWidth / 2 +
        cellRect.width / 2;

      if (smooth) {
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: 'smooth',
        });
      } else {
        container.scrollLeft = Math.max(0, targetLeft);
      }
    } else if (!smooth) {
      container.scrollLeft = container.scrollWidth;
    }
  };

  // Initial scroll to recent weeks on mount
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      if (highlightedDate && cellRefs.current[highlightedDate]) {
        scrollToDate(highlightedDate, false);
      } else if (todayCellRef.current) {
        scrollToDate(todayStr, false);
      } else {
        container.scrollLeft = container.scrollWidth;
      }
    });
  }, []);

  // Smooth scroll to highlighted date when it changes
  useEffect(() => {
    if (highlightedDate) {
      scrollToDate(highlightedDate, true);
    }
  }, [highlightedDate]);

  // Touch & pointer movement tracking to differentiate tap vs drag-scroll
  const handlePointerDown = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    pointerPos.current = {
      x: x ?? 0,
      y: y ?? 0,
      moved: false,
    };
  };

  const handlePointerMove = (e) => {
    const curX = e.touches ? e.touches[0].clientX : e.clientX;
    const curY = e.touches ? e.touches[0].clientY : e.clientY;
    if (curX === undefined || curY === undefined) return;
    if (Math.hypot(curX - pointerPos.current.x, curY - pointerPos.current.y) > 8) {
      pointerPos.current.moved = true;
    }
  };

  const handleCancel = () => {
    pointerPos.current.moved = true;
  };

  const handleContainerClick = () => {
    if (pointerPos.current.moved) return;
    if (onOpenDetail) {
      hapticLight();
      onOpenDetail();
    }
  };

  const handleCellClick = (e, day) => {
    if (day.isFuture) return;
    if (pointerPos.current.moved) return;

    // If on card view, clicking any square opens habit detail
    if (onOpenDetail) {
      e.stopPropagation();
      hapticLight();
      onOpenDetail();
      return;
    }

    // If inside HabitDetailScreen, toggle day and highlight
    if (onToggleDay) {
      e.stopPropagation();
      const isDone = completedSet.has(day.dateStr);
      if (isDone) {
        playUncheckSound();
        hapticMedium();
      } else {
        playCheckSound();
        hapticSuccess();
      }
      onToggleDay(habit?.id, day.dateStr);
    }
  };

  return (
    <div
      className="w-full relative select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchCancel={handleCancel}
      onClick={handleContainerClick}
    >
      {/* 365 Days Heatmap Grid */}
      <div
        ref={scrollRef}
        onScroll={() => {
          pointerPos.current.moved = true;
        }}
        className="overflow-x-auto no-scrollbar py-1"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="inline-flex flex-col min-w-max">
          {/* Month names row above columns (shown in Habit Details screen) */}
          {showMonthLabels && (
            <div className="inline-flex gap-[2.5px] min-w-max mb-1.5 h-4 select-none">
              {monthHeaders.map((mName, wIdx) => (
                <div
                  key={wIdx}
                  className="w-[10px] relative text-[10px] font-semibold text-[#8E8E93]"
                >
                  {mName && (
                    <span className="absolute left-0 top-0 whitespace-nowrap">
                      {mName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Grid columns */}
          <div className="inline-flex gap-[2.5px] min-w-max">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[2.5px]">
                {week.map((day) => {
                  const isDone = completedSet.has(day.dateStr);
                  const isHighlighted = day.dateStr === highlightedDate;

                  // Future days are transparent
                  if (day.isFuture) {
                    return (
                      <div
                        key={day.dateStr}
                        className="w-[10px] h-[10px] rounded-[2px] opacity-0 pointer-events-none"
                      />
                    );
                  }

                  // Default empty square: clean flat square without any glow or rings
                  let bg = 'rgba(255, 255, 255, 0.08)';
                  let border = '1px solid rgba(255, 255, 255, 0.04)';

                  if (isDone) {
                    bg = currentTheme.primary;
                    border = `1px solid ${currentTheme.primary}`;
                  } else if (day.isToday) {
                    bg = 'rgba(255, 255, 255, 0.12)';
                    border = `1.5px solid ${currentTheme.primary}`;
                  }

                  return (
                    <div
                      key={`${day.dateStr}-${isHighlighted ? 'sel' : 'norm'}`}
                      ref={(el) => {
                        if (el) cellRefs.current[day.dateStr] = el;
                        if (day.isToday) todayCellRef.current = el;
                      }}
                      onClick={(e) => handleCellClick(e, day)}
                      className={`w-[10px] h-[10px] rounded-[2px] transition-all cursor-pointer ${
                        isHighlighted ? 'heatmap-cell-selected' : ''
                      }`}
                      style={{
                        backgroundColor: bg,
                        border,
                      }}
                      title={`${day.dateStr}: ${isDone ? 'Completed' : 'Not completed'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
