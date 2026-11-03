import React, { useState } from 'react';
import {
  Check,
  Plus,
  Flame,
  Send,
  ChevronRight,
  Bell,
  ListTodo,
} from 'lucide-react';
import HabitIcon from './Icons.jsx';
import AutoScrollText from './AutoScrollText.jsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  hapticLight,
  hapticMedium,
  hapticSuccess,
  playCheckSound,
  playUncheckSound,
} from '../api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useLongPress } from '../lib/useLongPress.js';

function formatDisplayTime(timeHHMM) {
  if (!timeHHMM || typeof timeHHMM !== 'string' || !timeHHMM.includes(':')) {
    return '08:00';
  }
  const parts = timeHHMM.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return '08:00';
  const m = (parts[1] || '00').slice(0, 2);
  return `${String(h).padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function getFormattedDate(lang) {
  try {
    const now = new Date();
    if (lang === 'fa') {
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(now);
    }
    if (lang === 'ru') {
      return new Intl.DateTimeFormat('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(now).toUpperCase();
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(now).toUpperCase();
  } catch (_) {
    return 'TODAY';
  }
}

/**
 * HabitGridWidgetTile — Minimal, Graphical iOS Widget Tile for Habits
 * Compact squircle card with icon badge, spring check button, and bottom progress bar.
 */
function HabitGridWidgetTile({
  habit,
  isFirst,
  onToggleHabit,
  onOpenHabitDetail,
  onItemLongPress,
  t,
  currentTheme,
}) {
  const isDone = habit.isDoneToday;
  const displayGoal = habit.unit
    ? `${habit.target} ${habit.unit}`
    : habit.target > 1
    ? `${habit.target}x`
    : '1x';

  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) {
        onItemLongPress({ type: 'habit', item: habit });
      }
    },
    () => {
      if (onOpenHabitDetail) {
        onOpenHabitDetail(habit);
      }
    }
  );

  return (
    <div
      {...longPressProps}
      id={isFirst ? 'tour-habit-item' : undefined}
      className={`relative p-3.5 rounded-[22px] flex flex-col justify-between min-h-[122px] border transition-all duration-200 cursor-pointer select-none overflow-hidden group ${
        isDone
          ? 'bg-[#151519]/95 border-white/[0.12] shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
          : 'bg-[#121215]/95 border-white/[0.07] hover:border-white/15 active:scale-[0.98]'
      }`}
      style={
        isDone
          ? {
              boxShadow: `0 4px 22px -2px ${currentTheme.primarySubtle}, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }
          : undefined
      }
    >
      {/* Top Row: Habit Icon + Spring Checkbox */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-active:scale-95"
          style={{
            backgroundColor: isDone ? currentTheme.primarySubtle : '#1C1C22',
            border: isDone
              ? `1px solid ${currentTheme.primarySubtleBorder}`
              : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <HabitIcon
            name={habit.icon || habit.name}
            size={18}
            color={isDone ? currentTheme.primary : '#ffffff'}
          />
        </div>

        <button
          id={isFirst ? 'tour-check-btn' : undefined}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isDone) {
              playUncheckSound();
              hapticMedium();
            } else {
              playCheckSound();
              hapticSuccess();
            }
            onToggleHabit(habit.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          className={`check-btn ${isDone ? 'checked' : ''}`}
          title={isDone ? t('status_done') : t('status_not_done')}
        >
          {isDone && <Check size={16} color={currentTheme.primaryForeground} strokeWidth={3} />}
        </button>
      </div>

      {/* Middle: Habit Name */}
      <div className="my-1.5 min-w-0">
        <AutoScrollText
          as="h3"
          dir="auto"
          className={`text-[14px] font-bold tracking-tight text-start leading-snug ${
            isDone ? 'text-white/80 line-through' : 'text-white'
          }`}
        >
          {habit.name}
        </AutoScrollText>
      </div>

      {/* Bottom: Goal / Streak info */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-[#8E8E93]">
        <span className="truncate">{displayGoal}</span>
        {habit.streak > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
            <Flame size={11} className="fill-amber-400" />
            {habit.streak}d
          </span>
        )}
      </div>

      {/* Bottom Visual Progress Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/[0.04]">
        <div
          className="h-full transition-all duration-500 rounded-r-full"
          style={{
            width: isDone ? '100%' : '0%',
            backgroundColor: currentTheme.primary,
            boxShadow: isDone ? `0 0 8px ${currentTheme.primary}` : 'none',
          }}
        />
      </div>
    </div>
  );
}

/**
 * ReminderRowItem — Minimal iOS Alarms & Schedule Row
 */
function ReminderRowItem({ reminder, isLast, onToggleReminder, onEditReminder, onItemLongPress, t, currentTheme }) {
  const isEnabled = reminder.enabled !== false;
  const formattedTime = formatDisplayTime(reminder.timeHHMM);

  const priorityKey = reminder.priority || 'Medium';
  const repeatRateKey = reminder.repeatRate || (reminder.repeat ? 'daily' : 'once');
  const repeatLabels = {
    once: t('repeat_once'),
    daily: t('repeat_daily'),
    '2_days': t('repeat_2_days'),
    '3_days': t('repeat_3_days'),
    weekly: t('repeat_weekly'),
  };
  const repeatLabel = repeatLabels[repeatRateKey] || (reminder.repeat ? t('repeat_every_day') : t('repeat_once'));

  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) {
        onItemLongPress({ type: 'reminder', item: reminder });
      }
    },
    () => {
      if (onEditReminder) {
        onEditReminder(reminder);
      }
    }
  );

  return (
    <div
      {...longPressProps}
      className={`p-3 flex items-center justify-between cursor-pointer active:bg-white/[0.04] transition-colors rounded-xl select-none ${
        !isLast ? 'border-b border-white/[0.06]' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ backgroundColor: currentTheme.primarySubtle }}
        >
          <HabitIcon name={reminder.icon || 'bell'} size={18} color={currentTheme.primary} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <AutoScrollText as="h3" dir="auto" className="text-[14px] font-bold text-white tracking-tight text-start flex-1 min-w-0">
              {reminder.text}
            </AutoScrollText>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-white tabular-nums tracking-tight">
              {formattedTime}
            </span>
            <span className="text-[10px] text-[#545458]">•</span>
            <span className="text-[11px] font-medium text-[#8E8E93]">
              {repeatLabel}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 shrink-0 pl-2 rtl:pl-0 rtl:pr-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => {
            hapticMedium();
            if (onToggleReminder) onToggleReminder(reminder.id, checked);
          }}
        />
      </div>
    </div>
  );
}

/**
 * HomeScreen — Minimal, Graph-Driven iOS Widget Dashboard
 */
export default function HomeScreen({
  state,
  onToggleHabit,
  onOpenHabitDetail,
  onOpenAddHabit,
  onToggleTodo,
  onOpenAddTask,
  onEditTodo,
  onToggleReminder,
  onOpenAddReminder,
  onEditReminder,
  onSelectTab,
  onItemLongPress,
  onOpenShareModal,
}) {
  const { t, lang } = useI18n();
  const { currentTheme } = useTheme();

  const [selectedDayIdx, setSelectedDayIdx] = useState(null);

  const { streak = 0, weekDays = [], habits = [], todos = [], reminders = [] } = state || {};

  // 1. Calculate Today's Tasks
  const todayRaw = new Date().toISOString().slice(0, 10);
  const isTodayTask = (todo) => {
    if (!todo) return false;
    if (todo.dueDateRaw) {
      if (todo.dueDateRaw === todayRaw) return true;
      if (!todo.done && todo.dueDateRaw < todayRaw) return true;
      return false;
    }
    if (todo.dueDate?.toLowerCase().includes('today')) return true;
    return !todo.dueDate;
  };
  const todayTasks = todos.filter(isTodayTask);

  // 2. Metrics for Dual Rings & Graphs
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.isDoneToday).length;
  const habitProgress = totalHabits > 0 ? completedHabits / totalHabits : 0;

  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter((t) => t.done).length;
  const remainingTasks = Math.max(0, totalTasks - completedTasks);
  const taskProgress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const totalItems = totalHabits + totalTasks;
  const totalDone = completedHabits + completedTasks;
  const overallPercent = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
  const allClosed = totalItems > 0 && totalDone === totalItems;

  // Next reminder
  const activeReminders = reminders.filter((r) => r.enabled !== false);
  const nextReminder = activeReminders[0] || reminders[0];

  // Outer ring (Habits): Radius = 32, Circumference = 201.06
  const habitCircumference = 201.06;
  const habitOffset = habitCircumference * (1 - Math.min(1, Math.max(0, habitProgress)));

  // Inner ring (Tasks): Radius = 23, Circumference = 144.51
  const taskCircumference = 144.51;
  const taskOffset = taskCircumference * (1 - Math.min(1, Math.max(0, taskProgress)));

  // Radial Gauge for Tasks Widget: Radius = 19, Circumference = 119.38
  const taskGaugeCircumference = 119.38;
  const taskGaugeOffset = taskGaugeCircumference * (1 - Math.min(1, Math.max(0, taskProgress)));

  const handleShare = () => {
    hapticMedium();
    if (onOpenShareModal) {
      onOpenShareModal();
      return;
    }
    const shareText = `🔥 I'm on a ${streak}-day habit streak on Remnoten! ${t('slogan')}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent('https://t.me/remnotenbot')}&text=${encodeURIComponent(shareText)}`
      );
    } else if (navigator.share) {
      navigator.share({ title: 'Remnoten', text: shareText }).catch(() => {});
    }
  };

  const daysShort = t('days_short');
  const days = weekDays.length === 7 ? weekDays.map((wd, i) => ({
    ...wd,
    displayName: Array.isArray(daysShort) && daysShort[i] ? daysShort[i] : wd.dayName
  })) : [
    { dayName: 'Mon', displayName: daysShort[0] || 'Mon', completed: false, isToday: false },
    { dayName: 'Tue', displayName: daysShort[1] || 'Tue', completed: false, isToday: false },
    { dayName: 'Wed', displayName: daysShort[2] || 'Wed', completed: false, isToday: false },
    { dayName: 'Thu', displayName: daysShort[3] || 'Thu', completed: false, isToday: false },
    { dayName: 'Fri', displayName: daysShort[4] || 'Fri', completed: false, isToday: false },
    { dayName: 'Sat', displayName: daysShort[5] || 'Sat', completed: false, isToday: false },
    { dayName: 'Sun', displayName: daysShort[6] || 'Sun', completed: false, isToday: false },
  ];

  const formattedDate = getFormattedDate(lang);
  const selectedDay = selectedDayIdx !== null ? days[selectedDayIdx] : null;

  return (
    <div className="flex-1 px-4 pt-3 pb-28">
      {/* ─── iOS Minimal Header ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#8E8E93]">
            {formattedDate}
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight mt-0.5">
            <span className="text-white">{t('app_name_rem')}</span>
            <span style={{ color: currentTheme.primary }}>{t('app_name_noten')}</span>
          </h1>
        </div>
        <Button
          onClick={handleShare}
          variant="ghost"
          size="icon-sm"
          className="text-white bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] rounded-full w-9 h-9 active:scale-95 transition-all shadow-sm"
          title={t('share_title')}
        >
          <Send size={16} color="#ffffff" className="-rotate-12 translate-x-[-1px] rtl:rotate-180" />
        </Button>
      </div>

      {/* ─── Hero Graph Widget: Activity Rings & Interactive 7-Day Bar Chart ── */}
      <Card
        id="tour-streak-section"
        className="p-4 mb-3.5 select-none relative overflow-hidden backdrop-blur-xl"
      >
        <div className="flex items-center gap-4">
          {/* Dual Activity Rings SVG */}
          <div
            onClick={handleShare}
            className="relative w-20 h-20 shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            title={t('share_title')}
          >
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              {/* Outer Ring: Habits Track */}
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6.5"
              />
              {/* Outer Ring: Habits Progress */}
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={currentTheme.primary}
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeDasharray={habitCircumference}
                strokeDashoffset={habitOffset}
                style={{
                  filter: `drop-shadow(0 0 6px ${currentTheme.primary}75)`,
                  transition: 'stroke-dashoffset 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />

              {/* Inner Ring: Tasks Track */}
              <circle
                cx="40"
                cy="40"
                r="23"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6.5"
              />
              {/* Inner Ring: Tasks Progress */}
              <circle
                cx="40"
                cy="40"
                r="23"
                fill="none"
                stroke="#30D158"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeDasharray={taskCircumference}
                strokeDashoffset={taskOffset}
                style={{
                  filter: 'drop-shadow(0 0 6px rgba(48, 209, 88, 0.75))',
                  transition: 'stroke-dashoffset 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
            </svg>

            {/* Center Percentage or Check */}
            <div className="absolute inset-0 flex items-center justify-center">
              {allClosed ? (
                <Check size={18} className="text-[#30D158]" strokeWidth={3.5} />
              ) : (
                <span className="text-sm font-black text-white tabular-nums">
                  {overallPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Streak Flame & Visual Activity Pills */}
          <div className="flex-1 min-w-0">
            <div
              onClick={handleShare}
              className="flex items-center justify-between mb-2 cursor-pointer active:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-1.5">
                <Flame
                  size={19}
                  style={{
                    color: currentTheme.primary,
                    fill: currentTheme.primary,
                    filter: `drop-shadow(0 0 6px ${currentTheme.primary}80)`,
                  }}
                />
                <span className="text-lg font-black text-white tabular-nums tracking-tight">
                  {streak} {t('streak_days')}
                </span>
              </div>
              <ChevronRight size={14} className="text-[#8E8E93] rtl:rotate-180" />
            </div>

            {/* Visual Ratio Mini Progress Bars */}
            <div className="flex items-center gap-2">
              {/* Habits Ratio */}
              <div
                className="flex-1 p-2 rounded-xl border flex flex-col gap-1"
                style={{
                  backgroundColor: currentTheme.primarySubtle,
                  borderColor: currentTheme.primarySubtleBorder,
                }}
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold" style={{ color: currentTheme.primary }}>
                  <span>{t('nav_habits')}</span>
                  <span className="tabular-nums">{completedHabits}/{totalHabits}</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${habitProgress * 100}%`,
                      backgroundColor: currentTheme.primary,
                    }}
                  />
                </div>
              </div>

              {/* Tasks Ratio */}
              <div className="flex-1 p-2 rounded-xl border border-[#30D158]/30 bg-[#30D158]/15 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-[#30D158]">
                  <span>{t('nav_tasks')}</span>
                  <span className="tabular-nums">{completedTasks}/{totalTasks}</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#30D158] transition-all duration-500"
                    style={{ width: `${taskProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Interactive 7-Day Performance Bar Chart ─────────────── */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.06]">
          <div className="grid grid-cols-7 gap-2 items-end">
            {days.map((day, idx) => {
              const isToday = day.isToday || idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
              const isSelected = selectedDayIdx === idx;
              const isDone = day.completed;

              // Bar height calculation for graphical visual
              let barHeight = isDone ? '100%' : isToday ? `${Math.max(25, habitProgress * 100)}%` : '18%';

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setSelectedDayIdx(selectedDayIdx === idx ? null : idx);
                  }}
                  className={`flex flex-col items-center gap-1.5 py-1 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Vertical Graph Bar */}
                  <div className="w-2.5 h-10 rounded-full bg-white/[0.07] flex items-end overflow-hidden relative">
                    <div
                      className="w-full rounded-full transition-all duration-500"
                      style={{
                        height: barHeight,
                        backgroundColor: isDone
                          ? currentTheme.primary
                          : isToday
                          ? '#30D158'
                          : 'rgba(255,255,255,0.18)',
                        boxShadow: isDone
                          ? `0 0 8px ${currentTheme.primary}80`
                          : isToday
                          ? '0 0 8px rgba(48,209,88,0.7)'
                          : 'none',
                      }}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[10px] font-bold tracking-tight transition-colors ${
                      isToday
                        ? 'text-white'
                        : isDone
                        ? 'text-white/80'
                        : 'text-[#8E8E93]'
                    }`}
                  >
                    {day.displayName || day.dayName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Day Inspection Tooltip */}
          {selectedDay && (
            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>{selectedDay.displayName || selectedDay.dayName}</span>
                <span className="text-[#8E8E93] font-normal">•</span>
                <span style={{ color: selectedDay.completed ? currentTheme.primary : '#8E8E93' }}>
                  {selectedDay.completed
                    ? t('status_done')
                    : selectedDay.isToday
                    ? `${overallPercent}% ${t('score_completed')}`
                    : t('status_not_done')}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#8E8E93]">
                {selectedDay.date}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ─── iOS 2-Column Glance Widgets (Mini Graphs & Interactive) ─── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Widget 1: Tasks Radial Gauge Widget */}
        <div
          onClick={() => {
            hapticLight();
            if (onSelectTab) onSelectTab('tasks');
          }}
          className="p-3.5 rounded-[22px] bg-[#121215]/95 border border-white/[0.08] flex items-center justify-between min-h-[104px] cursor-pointer hover:border-white/15 active:scale-[0.98] transition-all relative overflow-hidden group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.35)]"
        >
          <div className="flex flex-col justify-between h-full min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E8E93]">
              <ListTodo size={14} className="text-[#30D158]" />
              <span>{t('nav_tasks')}</span>
            </div>
            <div className="text-xl font-black text-white tracking-tight tabular-nums mt-1">
              {remainingTasks}{' '}
              <span className="text-[11px] font-semibold text-[#8E8E93]">
                {t('score_remaining')}
              </span>
            </div>
            <div className="text-[10px] font-semibold text-[#30D158] truncate mt-0.5">
              {completedTasks}/{totalTasks} {t('score_completed')}
            </div>
          </div>

          {/* Mini Radial Gauge Chart */}
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke="#30D158"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={taskGaugeCircumference}
                strokeDashoffset={taskGaugeOffset}
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(48, 209, 88, 0.6))',
                  transition: 'stroke-dashoffset 0.6s ease',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {remainingTasks === 0 && totalTasks > 0 ? (
                <Check size={14} className="text-[#30D158]" strokeWidth={3} />
              ) : (
                <span className="text-[11px] font-black text-white tabular-nums">
                  {Math.round(taskProgress * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Widget 2: Next Schedule / Interactive Switch Widget */}
        <div
          onClick={() => {
            hapticLight();
            if (onSelectTab) onSelectTab('reminders');
          }}
          className="p-3.5 rounded-[22px] bg-[#121215]/95 border border-white/[0.08] flex flex-col justify-between min-h-[104px] cursor-pointer hover:border-white/15 active:scale-[0.98] transition-all relative overflow-hidden group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_6px_20px_rgba(0,0,0,0.35)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E8E93]">
              <Bell size={14} className="text-amber-400" />
              <span>{t('nav_reminders')}</span>
            </div>
            {onOpenAddReminder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticMedium();
                  onOpenAddReminder();
                }}
                className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white flex items-center justify-center border border-white/10"
                title={t('quick_add_reminder')}
              >
                <Plus size={11} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="my-1 min-w-0">
            <div className="text-xl font-black text-white tracking-tight tabular-nums">
              {nextReminder ? formatDisplayTime(nextReminder.timeHHMM) : '—:—'}
            </div>
            <div className="text-[11px] font-medium text-[#8E8E93] truncate">
              {nextReminder ? nextReminder.text : t('no_reminders_today')}
            </div>
          </div>

          {nextReminder ? (
            <div
              className="flex items-center justify-between pt-1 border-t border-white/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[10px] font-semibold text-amber-400 truncate">
                {nextReminder.repeat ? t('repeat_daily') : t('repeat_once')}
              </span>
              <Switch
                checked={nextReminder.enabled !== false}
                onCheckedChange={(checked) => {
                  hapticMedium();
                  if (onToggleReminder) onToggleReminder(nextReminder.id, checked);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between text-[10px] font-semibold text-[#8E8E93] pt-1 border-t border-white/[0.06]">
              <span>{t('see_all')}</span>
              <ChevronRight size={12} className="rtl:rotate-180" />
            </div>
          )}
        </div>
      </div>

      {/* ─── Today's Habits: Interactive 2-Column Widget Grid ────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: currentTheme.primarySubtle }}
            >
              <Flame size={14} color={currentTheme.primary} />
            </div>
            <h2 className="text-[15px] font-bold text-white tracking-tight">
              {t('section_habits')}
            </h2>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: currentTheme.primarySubtle,
                color: currentTheme.primary,
                border: `1px solid ${currentTheme.primarySubtleBorder}`,
              }}
            >
              {completedHabits}/{totalHabits}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('habits')}
                className="text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors flex items-center gap-0.5"
              >
                <span>{t('see_all')}</span>
                <ChevronRight size={14} className="rtl:rotate-180" />
              </button>
            )}
            <button
              id="tour-add-habit"
              type="button"
              onClick={() => {
                hapticMedium();
                onOpenAddHabit();
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white border border-white/10"
              title={t('add_habit_btn')}
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Habits 2-Column Grid */}
        <div id="tour-habits-feed">
          {habits.length === 0 ? (
            <div
              onClick={() => {
                hapticMedium();
                onOpenAddHabit();
              }}
              className="p-5 rounded-[22px] bg-[#121215]/95 border border-dashed border-white/20 text-center cursor-pointer hover:border-white/30 active:scale-[0.99] transition-all flex flex-col items-center justify-center gap-2"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: currentTheme.primarySubtle }}
              >
                <Plus size={20} color={currentTheme.primary} strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold text-white">{t('no_habits')}</p>
              <p className="text-xs text-[#8E8E93]">{t('no_habits_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {habits.map((habit, idx) => (
                <HabitGridWidgetTile
                  key={habit.id}
                  isFirst={idx === 0}
                  habit={habit}
                  onToggleHabit={onToggleHabit}
                  onOpenHabitDetail={onOpenHabitDetail}
                  onItemLongPress={onItemLongPress}
                  t={t}
                  currentTheme={currentTheme}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Minimal Upcoming Reminders Widget (If Reminders Exist) ─── */}
      {reminders.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Bell size={14} className="text-amber-400" />
              <h2 className="text-[14px] font-bold text-white tracking-tight">
                {t('section_reminders')}
              </h2>
            </div>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('reminders')}
                className="text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors flex items-center gap-0.5"
              >
                <span>{t('see_all')}</span>
                <ChevronRight size={13} className="rtl:rotate-180" />
              </button>
            )}
          </div>

          <Card className="p-1 overflow-hidden">
            {reminders.slice(0, 3).map((reminder, idx) => (
              <ReminderRowItem
                key={reminder.id}
                isLast={idx === Math.min(reminders.length, 3) - 1}
                reminder={reminder}
                onToggleReminder={onToggleReminder}
                onEditReminder={onEditReminder}
                onItemLongPress={onItemLongPress}
                t={t}
                currentTheme={currentTheme}
              />
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
