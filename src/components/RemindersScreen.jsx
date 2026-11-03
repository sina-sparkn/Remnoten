import React from 'react';
import { Plus } from 'lucide-react';
import HabitIcon from './Icons.jsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AutoScrollText from './AutoScrollText.jsx';
import { hapticMedium, hapticSuccess } from '../api.js';
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

function ReminderRowCard({ reminder, isFirst, onToggleReminder, onEditReminder, onItemLongPress, t, currentTheme }) {
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

  const priorityLabels = {
    High: t('priority_high'),
    Medium: t('priority_medium'),
    Low: t('priority_low'),
  };

  const longPressProps = useLongPress(
    () => {
      if (onItemLongPress) {
        onItemLongPress({ type: 'reminder', item: reminder });
      }
    },
    () => {
      onEditReminder(reminder);
    }
  );

  return (
    <Card
      {...longPressProps}
      id={isFirst ? "tour-reminder-item" : undefined}
      className="p-4 flex flex-row items-center justify-between cursor-pointer transition-transform active:scale-[0.98] select-none"
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ backgroundColor: currentTheme.primarySubtle }}
        >
          <HabitIcon name={reminder.icon || 'bell'} size={22} color={currentTheme.primary} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <AutoScrollText as="h3" dir="auto" className="text-[15px] font-bold text-white tracking-tight text-start flex-1 min-w-0">
              {reminder.text}
            </AutoScrollText>
            {priorityKey === 'High' && (
              <span
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border shrink-0 transition-colors"
                style={{
                  borderColor: currentTheme.primarySubtleBorder,
                  backgroundColor: currentTheme.primarySubtle,
                  color: currentTheme.primary,
                }}
              >
                {priorityLabels.High}
              </span>
            )}
            {priorityKey === 'Medium' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/15 text-amber-400 shrink-0">
                {priorityLabels.Medium}
              </span>
            )}
            {priorityKey === 'Low' && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border border-blue-500/30 bg-blue-500/15 text-blue-400 shrink-0">
                {priorityLabels.Low}
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#8E8E93] mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>{repeatLabel} • {formattedTime}</span>
            {reminder.pendingAck && (
              <span
                className="font-semibold inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                style={{
                  backgroundColor: currentTheme.primarySubtle,
                  color: currentTheme.primary,
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: currentTheme.primary }}
                />
                {t('status_pending_ack')}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Switch */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <Switch
          checked={isEnabled}
          onCheckedChange={(checked) => {
            hapticSuccess();
            onToggleReminder(reminder.id, checked);
          }}
        />
      </div>
    </Card>
  );
}

export default function RemindersScreen({
  reminders = [],
  onToggleReminder,
  onOpenAddReminder,
  onEditReminder,
  onItemLongPress,
}) {
  const { t } = useI18n();
  const { currentTheme } = useTheme();

  return (
    <div className="flex-1 px-5 pt-3 pb-32">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-white tracking-tight">{t('reminders_title')}</h1>
        <p className="text-xs font-medium text-[#8E8E93] mt-0.5">
          {t('reminders_subtitle')}
        </p>
      </div>

      {/* Reminder List */}
      <div id="tour-reminders-feed" className="items-list">
        {reminders.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm font-semibold text-white">{t('no_reminders')}</p>
            <p className="text-xs text-[#8E8E93] mt-1">{t('no_reminders_desc')}</p>
          </Card>
        )}
        {reminders.map((reminder, idx) => (
          <ReminderRowCard
            key={reminder.id}
            isFirst={idx === 0}
            reminder={reminder}
            onToggleReminder={onToggleReminder}
            onEditReminder={onEditReminder}
            onItemLongPress={onItemLongPress}
            t={t}
            currentTheme={currentTheme}
          />
        ))}
      </div>

      {/* Floating Action Button with Apple Pill Styling */}
      <div className="fixed bottom-[78px] left-1/2 -translate-x-1/2 w-full max-w-[440px] px-5 pointer-events-none z-30 flex justify-end rtl:justify-start">
        <button
          id="tour-add-reminder"
          type="button"
          onClick={() => {
            hapticMedium();
            onOpenAddReminder();
          }}
          className="pointer-events-auto h-13 px-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-[14px] flex items-center gap-2.5 active:scale-90 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer shadow-[0_10px_28px_rgba(0,0,0,0.55),0_0_22px_var(--primary-subtle)] border border-white/20"
          title={t('modal_add_reminder')}
        >
          <Plus size={22} color={currentTheme.primaryForeground} strokeWidth={2.8} />
          <span>{t('modal_add_reminder')}</span>
        </button>
      </div>
    </div>
  );
}
