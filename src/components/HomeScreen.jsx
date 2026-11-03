import React from 'react';
import {
  Check,
  Flame,
  Send,
  ChevronRight,
  Calendar,
  Plus,
} from 'lucide-react';
import { HabitsNavIcon } from './Icons.jsx';
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

function formatHeroDate(lang) {
  try {
    const now = new Date();
    if (lang === 'fa') {
      return new Intl.DateTimeFormat('fa-IR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now);
    }
    if (lang === 'ru') {
      return new Intl.DateTimeFormat('ru-RU', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now);
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(now);
  } catch (_) {
    return 'Tue, Nov 3';
  }
}

/**
 * HomeScreen — Pixel-perfect recreation of the requested UI design:
 * - Clean "Remnoten" header with circular Send button
 * - Hero streak card with purple ambient glow, dynamic date, pink flame, dual stats (Habits / Tasks)
 * - "Today" section with unified tasks & habits, custom checkboxes, and pink activity bars icon
 * - "Upcoming" section with squircle calendar icon badge, title & schedule info
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

  const { streak = 0, habits = [], todos = [], reminders = [] } = state || {};

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

  // 2. Metrics for Dual Progress Bars
  const totalHabits = habits.length;
  const completedHabits = habits.filter((h) => h.isDoneToday).length;
  const habitProgress = totalHabits > 0 ? completedHabits / totalHabits : 0;

  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter((t) => t.done).length;
  const taskProgress = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // 3. Upcoming items (Reminders or upcoming tasks with dueDate > today)
  const upcomingTasks = todos.filter((t) => t.dueDateRaw && t.dueDateRaw > todayRaw && !t.done);
  const activeReminders = reminders.filter((r) => r.enabled !== false);

  const formattedDate = formatHeroDate(lang);

  const handleShare = () => {
    hapticMedium();
    if (onOpenShareModal) {
      onOpenShareModal();
      return;
    }
    const shareText = `🔥 I'm on a ${streak}-day streak on Remnoten! ${t('slogan')}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent('https://t.me/remnotenbot')}&text=${encodeURIComponent(shareText)}`
      );
    } else if (navigator.share) {
      navigator.share({ title: 'Remnoten', text: shareText }).catch(() => {});
    }
  };

  // Build upcoming items list
  const upcomingItems = [];
  if (activeReminders.length > 0) {
    activeReminders.slice(0, 2).forEach((r) => {
      const repeatLabel = r.repeat ? (r.repeatRate === 'weekly' ? 'Weekly' : 'Daily') : 'Once';
      upcomingItems.push({
        id: `reminder-${r.id}`,
        title: r.text,
        subtitle: `Tomorrow · ${repeatLabel}`,
        type: 'reminder',
        raw: r,
        onClick: () => {
          if (onEditReminder) onEditReminder(r);
          else if (onSelectTab) onSelectTab('reminders');
        },
      });
    });
  }

  if (upcomingTasks.length > 0) {
    upcomingTasks.slice(0, 2).forEach((task) => {
      upcomingItems.push({
        id: `task-${task.id}`,
        title: task.text,
        subtitle: `Tomorrow · ${task.dueTime || 'Task'}`,
        type: 'task',
        raw: task,
        onClick: () => {
          if (onEditTodo) onEditTodo(task);
          else if (onSelectTab) onSelectTab('tasks');
        },
      });
    });
  }

  return (
    <div className="flex-1 px-4 pt-3 pb-32 max-w-[440px] mx-auto w-full">
      {/* ─── Top Header: "Remnoten" + Send button ─────────────────────── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h1 className="text-[28px] font-bold tracking-tight text-white leading-none">
          Remnoten
        </h1>

        <button
          type="button"
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-[#18181f] border border-white/[0.06] flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm cursor-pointer"
          title={t('share_title')}
        >
          <Send size={18} className="text-white -rotate-12 translate-x-[-1px] rtl:rotate-180" />
        </button>
      </div>

      {/* ─── Hero Streak Card ────────────────────────────────────────── */}
      <div
        id="tour-streak-section"
        className="rounded-[28px] p-6 relative overflow-hidden border border-white/[0.05] shadow-xl select-none"
        style={{
          background:
            'radial-gradient(circle at 85% 25%, rgba(147, 51, 234, 0.22) 0%, rgba(126, 34, 206, 0.08) 45%, transparent 75%), #141419',
        }}
      >
        {/* Top Row: Date + Pink Flame Badge */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[#8e8e93] text-[15px] font-medium tracking-tight">
            {formattedDate}
          </span>

          <div
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-[#27172c] border border-[#ec4899]/20 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-transform shadow-[0_0_15px_rgba(236,72,153,0.15)]"
          >
            <Flame size={20} className="text-[#ec4899] fill-[#ec4899]" />
          </div>
        </div>

        {/* Streak Headline */}
        <h2 className="text-[32px] font-bold text-white tracking-tight mt-1 mb-6 leading-tight">
          {streak || 0} {t('streak_days')}
        </h2>

        {/* Dual Progress Stats (Habits & Tasks) */}
        <div className="flex items-center">
          {/* Habits Column */}
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-[13px] text-[#8e8e93] font-normal mb-1">
              {t('nav_habits')}
            </div>
            <div className="text-[21px] font-bold text-white tracking-tight mb-2.5 tabular-nums">
              {completedHabits} / {totalHabits}
            </div>
            <div className="h-[5px] w-full bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#ec4899]"
                style={{
                  width: totalHabits > 0 ? `${Math.min(100, Math.max(0, habitProgress * 100))}%` : '0%',
                  boxShadow: habitProgress > 0 ? '0 0 8px rgba(236, 72, 153, 0.5)' : 'none',
                }}
              />
            </div>
          </div>

          {/* Thin Vertical Divider */}
          <div className="w-[1px] bg-white/[0.08] self-stretch mx-3 my-0.5" />

          {/* Tasks Column */}
          <div className="flex-1 min-w-0 pl-3">
            <div className="text-[13px] text-[#8e8e93] font-normal mb-1">
              {t('nav_tasks')}
            </div>
            <div className="text-[21px] font-bold text-white tracking-tight mb-2.5 tabular-nums">
              {completedTasks} / {totalTasks}
            </div>
            <div className="h-[5px] w-full bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 bg-[#22c55e]"
                style={{
                  width: totalTasks > 0 ? `${Math.min(100, Math.max(0, taskProgress * 100))}%` : '0%',
                  boxShadow: taskProgress > 0 ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── "Today" Section ─────────────────────────────────────────── */}
      <div className="mt-7 mb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[24px] font-bold text-white tracking-tight">
            {t('today')}
          </h2>
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('tasks')}
            className="text-[15px] font-medium text-[#8e8e93] hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t('see_all')}</span>
            <ChevronRight size={16} className="rtl:rotate-180" />
          </button>
        </div>

        {/* Grouped Card for Today's Items */}
        <div className="rounded-[26px] bg-[#141419] border border-white/[0.04] overflow-hidden">
          {todayTasks.length === 0 && habits.length === 0 ? (
            /* Empty State for Today */
            <div className="p-6 text-center select-none">
              <p className="text-[15px] font-semibold text-white mb-1">
                {t('no_tasks_today')}
              </p>
              <p className="text-[13px] text-[#8e8e93] mb-4">
                {t('no_habits_desc')}
              </p>
              <div className="flex items-center justify-center gap-3">
                {onOpenAddTask && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticMedium();
                      onOpenAddTask();
                    }}
                    className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold hover:bg-white/15 transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{t('quick_add_task')}</span>
                  </button>
                )}
                {onOpenAddHabit && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticMedium();
                      onOpenAddHabit();
                    }}
                    className="px-4 py-2 rounded-full bg-[#ec4899] text-white text-xs font-semibold hover:bg-[#db2777] transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>{t('add_habit_btn')}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* 1. Today's Tasks */}
              {todayTasks.map((todo, idx) => (
                <TodayTaskRow
                  key={`task-${todo.id}`}
                  todo={todo}
                  isFirst={idx === 0}
                  onToggleTodo={onToggleTodo}
                  onEditTodo={onEditTodo}
                  onItemLongPress={onItemLongPress}
                />
              ))}

              {/* Divider between tasks and habits if both exist */}
              {todayTasks.length > 0 && habits.length > 0 && (
                <div className="border-t border-white/[0.06] ml-14 mr-4" />
              )}

              {/* 2. Today's Habits */}
              {habits.map((habit, idx) => (
                <React.Fragment key={`habit-${habit.id}`}>
                  {idx > 0 && <div className="border-t border-white/[0.06] ml-14 mr-4" />}
                  <TodayHabitRow
                    habit={habit}
                    onToggleHabit={onToggleHabit}
                    onOpenHabitDetail={onOpenHabitDetail}
                    onItemLongPress={onItemLongPress}
                  />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── "Upcoming" Section ──────────────────────────────────────── */}
      <div className="mt-7 mb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[24px] font-bold text-white tracking-tight">
            {t('filter_upcoming') || 'Upcoming'}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (onSelectTab) {
                if (reminders.length > 0) onSelectTab('reminders');
                else onSelectTab('tasks');
              }
            }}
            className="text-[15px] font-medium text-[#8e8e93] hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t('see_all')}</span>
            <ChevronRight size={16} className="rtl:rotate-180" />
          </button>
        </div>

        {/* Grouped Card for Upcoming Items */}
        <div className="rounded-[26px] bg-[#141419] border border-white/[0.04] overflow-hidden">
          {upcomingItems.length > 0 ? (
            upcomingItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <div className="border-t border-white/[0.06] ml-16 mr-4" />}
                <div
                  onClick={item.onClick}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#23182e] border border-[#a855f7]/20 flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-[#c084fc]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] font-medium text-white leading-snug truncate">
                        {item.title}
                      </div>
                      <div className="text-[13px] text-[#8e8e93] mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#545458] shrink-0 rtl:rotate-180" />
                </div>
              </React.Fragment>
            ))
          ) : (
            /* Default fallback item matching design layout: "Workout", "Tomorrow · Daily" */
            <div
              onClick={() => {
                if (onOpenAddReminder) onOpenAddReminder();
                else if (onSelectTab) onSelectTab('reminders');
              }}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors select-none"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                <div className="w-10 h-10 rounded-2xl bg-[#23182e] border border-[#a855f7]/20 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-[#c084fc]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-medium text-white leading-snug truncate">
                    Workout
                  </div>
                  <div className="text-[13px] text-[#8e8e93] mt-0.5">
                    Tomorrow · Daily
                  </div>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#545458] shrink-0 rtl:rotate-180" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * TodayTaskRow — Row item for a task in the "Today" list
 */
function TodayTaskRow({ todo, isFirst, onToggleTodo, onEditTodo, onItemLongPress }) {
  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) onItemLongPress({ type: 'task', item: todo });
    },
    () => {
      if (onEditTodo) onEditTodo(todo);
    }
  );

  return (
    <div
      {...longPressProps}
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors select-none group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        {/* Circular Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (todo.done) {
              playUncheckSound();
              hapticMedium();
            } else {
              playCheckSound();
              hapticSuccess();
            }
            if (onToggleTodo) onToggleTodo(todo.id);
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            todo.done
              ? 'bg-[#ec4899] text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
              : 'border-2 border-[#545458] hover:border-zinc-400'
          }`}
        >
          {todo.done && <Check size={14} strokeWidth={3} className="text-white" />}
        </button>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div
            className={`text-[16px] font-medium leading-snug truncate ${
              todo.done ? 'text-white/50 line-through' : 'text-white'
            }`}
          >
            {todo.text}
          </div>
          <div className="text-[13px] text-[#8e8e93] mt-0.5">
            Task · Today
          </div>
        </div>
      </div>

      <ChevronRight size={18} className="text-[#545458] shrink-0 rtl:rotate-180" />
    </div>
  );
}

/**
 * TodayHabitRow — Row item for a habit in the "Today" list
 */
function TodayHabitRow({ habit, onToggleHabit, onOpenHabitDetail, onItemLongPress }) {
  const isDone = habit.isDoneToday;

  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) onItemLongPress({ type: 'habit', item: habit });
    },
    () => {
      if (onOpenHabitDetail) onOpenHabitDetail(habit);
    }
  );

  return (
    <div
      {...longPressProps}
      className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors select-none group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        {/* Circular Checkbox (Solid pink with checkmark when done) */}
        <button
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
            if (onToggleHabit) onToggleHabit(habit.id);
          }}
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            isDone
              ? 'bg-[#ec4899] text-white shadow-[0_0_10px_rgba(236,72,153,0.4)]'
              : 'border-2 border-[#545458] hover:border-zinc-400'
          }`}
        >
          {isDone && <Check size={14} strokeWidth={3} className="text-white" />}
        </button>

        {/* Text Details */}
        <div className="min-w-0 flex-1">
          <div
            className={`text-[16px] font-medium leading-snug truncate ${
              isDone ? 'text-white/50 line-through' : 'text-white'
            }`}
          >
            {habit.name}
          </div>
          <div className="text-[13px] text-[#8e8e93] mt-0.5">
            Habit · Today
          </div>
        </div>
      </div>

      {/* Right: 3-bar streak icon in pink matching the design */}
      <div className="shrink-0 flex items-center pl-2">
        <HabitsNavIcon size={18} color="#ec4899" />
      </div>
    </div>
  );
}
