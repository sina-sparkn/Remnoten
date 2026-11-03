import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Edit3, Share2 } from 'lucide-react';
import { WorkoutHeroLogo } from './Icons.jsx';
import HabitIcon from './Icons.jsx';
import HabitContributionHeatmap from './HabitContributionHeatmap.jsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { callEndpoint, hapticMedium, hapticSuccess, playCheckSound, playUncheckSound } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';

export default function HabitDetailScreen({
  habit,
  onBack,
  onToggleCheckin,
  onEditHabit,
  onOpenShareModal,
}) {
  const { t, lang, isRTL } = useI18n();
  const { currentTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Initialize with full 365-day history from habit.completedDays
  const [completedDays, setCompletedDays] = useState(() => {
    const set = new Set(habit?.completedDays || []);
    if (habit?.isDoneToday) set.add(todayStr);
    return Array.from(set);
  });
  
  // Track selected date from calendar to highlight on the heatmap (defaults to today)
  const [highlightedDate, setHighlightedDate] = useState(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString(lang === 'fa' ? 'fa-IR' : 'default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    let isMounted = true;
    const yearMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
    callEndpoint('getHabitHistory', { habitId: habit.id, yearMonth })
      .then((res) => {
        if (isMounted && res.completedDays) {
          setCompletedDays((prev) => {
            const merged = new Set(prev);
            res.completedDays.forEach((d) => merged.add(d));
            return Array.from(merged);
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [habit.id, year, month]);

  const prevMonth = () => {
    hapticMedium();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    hapticMedium();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations (Monday = 0, Sunday = 6)
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const isDoneToday = completedDays.includes(todayStr);

  const handleToggleDay = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    // User cannot select any future days after today
    if (dateStr > todayStr) return;

    // Show on the heatmap where the user clicked!
    setHighlightedDate(dateStr);

    const wasDone = completedDays.includes(dateStr);
    if (wasDone) {
      playUncheckSound();
      hapticMedium();
      setCompletedDays(completedDays.filter((d) => d !== dateStr));
    } else {
      playCheckSound();
      hapticSuccess();
      setCompletedDays([...completedDays, dateStr]);
    }

    onToggleCheckin(habit.id, dateStr);
  };

  const handleToggleToday = () => {
    setHighlightedDate(todayStr);
    const wasDone = completedDays.includes(todayStr);
    if (wasDone) {
      playUncheckSound();
      hapticMedium();
      setCompletedDays(completedDays.filter((d) => d !== todayStr));
    } else {
      playCheckSound();
      hapticSuccess();
      setCompletedDays([...completedDays, todayStr]);
    }

    onToggleCheckin(habit.id, todayStr);
  };

  const dayLabels = t('days_short') || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex-1 px-5 pt-3 pb-8">
      {/* Top Bar with Back Arrow & Share Button */}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon-sm"
          className="text-white"
          title="Back"
        >
          <ChevronLeft size={22} color="#ffffff" className="rtl:rotate-180" />
        </Button>
        <Button
          onClick={() => {
            hapticMedium();
            onOpenShareModal?.(habit);
          }}
          variant="ghost"
          size="icon-sm"
          className="text-white"
          title={t('share_title')}
        >
          <Share2 size={18} color="#ffffff" />
        </Button>
      </div>

      {/* Hero Icon & Title */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          {habit.name?.toLowerCase().includes('workout') ? (
            <WorkoutHeroLogo size={76} color={currentTheme.primary} />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-colors"
              style={{ backgroundColor: currentTheme.primarySubtle }}
            >
              <HabitIcon name={habit.icon || habit.name} size={36} color={currentTheme.primary} />
            </div>
          )}
        </div>
        <h1 dir="auto" className="text-2xl font-black text-white tracking-tight">{habit.name}</h1>
        <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
          {habit.frequency || t('freq_daily')} • {habit.unit ? `${habit.target} ${habit.unit}` : '30 min'}
        </p>
      </div>

      {/* 365 Days GitHub-Style Contribution Heatmap Card with Month Names */}
      <Card className="p-4 mb-4">
        <HabitContributionHeatmap
          habit={habit}
          completedDays={completedDays}
          highlightedDate={highlightedDate}
          showMonthLabels={true}
          onToggleDay={(id, d) => {
            const wasDone = completedDays.includes(d);
            if (wasDone) {
              setCompletedDays(completedDays.filter((x) => x !== d));
            } else {
              setCompletedDays([...completedDays, d]);
            }
            setHighlightedDate(d);
            const [y, m] = d.split('-').map(Number);
            setCurrentDate(new Date(y, m - 1, 1));
            onToggleCheckin(id, d);
          }}
        />
      </Card>

      {/* Monthly Calendar Card */}
      <Card className="p-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 px-1">
          <Button onClick={prevMonth} variant="ghost" size="icon-sm" className="h-7 w-7 text-white">
            <ChevronLeft size={16} className="rtl:rotate-180" />
          </Button>
          <span className="text-sm font-bold text-white tracking-tight">{monthName}</span>
          <Button onClick={nextMonth} variant="ghost" size="icon-sm" className="h-7 w-7 text-white">
            <ChevronRight size={16} className="rtl:rotate-180" />
          </Button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-3">
          {dayLabels.map((label, idx) => (
            <span key={idx} className="text-[11px] font-semibold text-[#8E8E93]">
              {label}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2.5 text-center">
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-8 w-8 mx-auto" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isCompleted = completedDays.includes(dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isSelected = dateStr === highlightedDate;

            let btnStyle = '';
            if (isFuture) {
              btnStyle = 'text-[#545458] opacity-35 cursor-not-allowed pointer-events-none select-none';
            } else if (isSelected) {
              btnStyle = isCompleted
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-white ring-offset-2 ring-offset-[#121215] font-black'
                : 'text-white bg-white/20 ring-2 ring-white ring-offset-2 ring-offset-[#121215] font-bold';
            } else if (isCompleted) {
              btnStyle = isToday
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-1.5 ring-[var(--primary)] ring-offset-1 ring-offset-[#121215]'
                : 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90';
            } else if (isToday) {
              btnStyle = 'text-white font-black bg-[var(--primary)]/15 ring-1.5 ring-[var(--primary)] ring-offset-1 ring-offset-[#121215] hover:bg-[var(--primary)]/25';
            } else {
              btnStyle = 'text-white hover:bg-white/[0.08]';
            }

            return (
              <div key={dayNum} className="flex items-center justify-center">
                <button
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleToggleDay(dayNum)}
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold tabular-nums transition-all ${
                    isFuture ? '' : 'active:scale-85 duration-150 cursor-pointer'
                  } ${btnStyle}`}
                  title={isFuture ? 'Future day' : isToday ? 'Today' : dateStr}
                >
                  {dayNum}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleToggleToday}
          variant="default"
          size="xl"
          className="cursor-pointer active:scale-[0.98] transition-transform"
        >
          <Check size={18} strokeWidth={3} />
          <span>{isDoneToday ? t('status_done') : t('today')}</span>
        </Button>

        <Button
          onClick={() => {
            hapticMedium();
            onEditHabit(habit);
          }}
          variant="outline"
          size="xl"
        >
          <Edit3 size={15} />
          <span>{t('edit_habit')}</span>
        </Button>
      </div>
    </div>
  );
}
