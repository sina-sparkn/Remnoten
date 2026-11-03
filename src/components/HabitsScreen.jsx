import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import HabitIcon from './Icons.jsx';
import HabitContributionHeatmap from './HabitContributionHeatmap.jsx';
import AutoScrollText from './AutoScrollText.jsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { hapticMedium } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useLongPress } from '../lib/useLongPress.js';

function HabitRowCard({ habit, onToggleHabit, onOpenHabitDetail, onItemLongPress, t, currentTheme }) {
  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) {
        onItemLongPress({ type: 'habit', item: habit });
      }
    },
    () => {
      onOpenHabitDetail(habit);
    }
  );

  return (
    <Card className="p-4 flex flex-col select-none">
      {/* Clickable Header Row: opens habit detail or triggers long press */}
      <div
        {...longPressProps}
        className="flex flex-row items-center justify-between w-full cursor-pointer active:opacity-85 transition-opacity"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ backgroundColor: currentTheme.primarySubtle }}
          >
            <HabitIcon name={habit.icon || habit.name} size={22} color={currentTheme.primary} />
          </div>
          <div className="min-w-0 flex-1">
            <AutoScrollText as="h3" className="text-[15px] font-bold text-white tracking-tight text-start">
              {habit.name}
            </AutoScrollText>
            <AutoScrollText as="p" className="text-xs font-medium text-[#8E8E93] mt-0.5 text-start">
              {habit.frequency || t('freq_daily')}
            </AutoScrollText>
          </div>
        </div>

        <ChevronRight size={18} className="text-[#545458]" />
      </div>

      {/* 365 Days GitHub-Style Contribution Heatmap — Tapping opens Habit Details */}
      <div className="w-full mt-3 cursor-pointer">
        <HabitContributionHeatmap
          habit={habit}
          completedDays={habit.completedDays}
          onOpenDetail={() => onOpenHabitDetail(habit)}
        />
      </div>
    </Card>
  );
}

export default function HabitsScreen({
  habits = [],
  onToggleHabit,
  onOpenHabitDetail,
  onOpenAddHabit,
  onItemLongPress,
}) {
  const { t } = useI18n();
  const { currentTheme } = useTheme();

  return (
    <div className="flex-1 px-5 pt-3 pb-36">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white tracking-tight">{t('habits_title')}</h1>
        <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
          {t('habits_subtitle')}
        </p>
      </div>

      {/* Habit List */}
      <div id="tour-habits-feed" className="items-list">
        {habits.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm font-semibold text-white">{t('no_habits_created')}</p>
            <p className="text-xs text-[#8E8E93] mt-1">{t('no_habits_created_desc')}</p>
          </Card>
        )}
        {habits.map((habit) => (
          <HabitRowCard
            key={habit.id}
            habit={habit}
            onToggleHabit={onToggleHabit}
            onOpenHabitDetail={onOpenHabitDetail}
            onItemLongPress={onItemLongPress}
            t={t}
            currentTheme={currentTheme}
          />
        ))}
      </div>

      {/* Floating Action Button with Apple Pill Styling */}
      <div className="fixed bottom-[calc(92px+var(--safe-bottom))] left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 pointer-events-none z-40 flex justify-end rtl:justify-start">
        <button
          id="tour-add-habit"
          type="button"
          onClick={() => {
            hapticMedium();
            onOpenAddHabit();
          }}
          className="pointer-events-auto h-13 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-[14px] flex items-center gap-2.5 active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-[0_10px_28px_rgba(0,0,0,0.55),0_0_22px_var(--primary-subtle)] border border-white/20"
          title={t('modal_add_habit')}
        >
          <Plus size={22} color={currentTheme.primaryForeground} strokeWidth={2.8} />
          <span>{t('modal_add_habit')}</span>
        </button>
      </div>
    </div>
  );
}
