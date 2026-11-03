import React, { useState, useEffect } from 'react';
import { Clock, Repeat, Flag, ChevronRight, X, Trash2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import HabitIcon from './Icons.jsx';
import TimeWheelPicker from './ui/TimeWheelPicker.jsx';
import { hapticMedium, hapticSuccess } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';

export default function AddReminderModal({
  open = false,
  initialReminder = null,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useI18n();
  const isEditing = Boolean(initialReminder?.id);

  const initialRepeatRate = initialReminder?.repeatRate || (initialReminder?.repeat === false ? 'once' : 'daily');
  const [text, setText] = useState(initialReminder?.text || '');
  const [timeHHMM, setTimeHHMM] = useState(initialReminder?.timeHHMM || '08:00');
  const [repeatRate, setRepeatRate] = useState(initialRepeatRate);
  const [priority, setPriority] = useState(initialReminder?.priority || 'Medium');
  const [icon, setIcon] = useState(initialReminder?.icon || 'bell');

  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialReminder?.text || '');
      setTimeHHMM(initialReminder?.timeHHMM || '08:00');
      const rRate = initialReminder?.repeatRate || (initialReminder?.repeat === false ? 'once' : 'daily');
      setRepeatRate(rRate);
      setPriority(initialReminder?.priority || 'Medium');
      setIcon(initialReminder?.icon || 'bell');
      setShowRepeatPicker(false);
      setShowPriorityPicker(false);
    }
  }, [open, initialReminder]);

  const presetTimes = ['07:00', '08:00', '09:00', '11:00', '14:00', '18:00', '20:00', '21:00'];
  const icons = [
    'bell',
    'alarm',
    'calendar',
    'pill',
    'droplets',
    'dumbbell',
    'book',
    'coffee',
    'heart',
    'briefcase',
    'shopping',
    'todo',
    'phone',
    'mail',
    'utensils',
    'zap',
    'moon',
    'sun',
    'smile',
    'car',
    'home',
    'sparkles',
    'card',
    'flame',
    'target',
    'music',
    'laptop',
    'apple',
  ];

  const repeatRates = [
    { key: 'once', label: t('repeat_once') },
    { key: 'daily', label: t('repeat_daily') },
    { key: '2_days', label: t('repeat_2_days') },
    { key: '3_days', label: t('repeat_3_days') },
    { key: 'weekly', label: t('repeat_weekly') },
  ];

  const priorities = [
    { key: 'Low', label: t('priority_low'), color: 'text-blue-400' },
    { key: 'Medium', label: t('priority_medium'), color: 'text-amber-400' },
    { key: 'High', label: t('priority_high'), color: 'text-[#FF2442]' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !timeHHMM) return;

    hapticSuccess();
    onSave({
      id: initialReminder?.id,
      text: text.trim(),
      timeHHMM,
      repeat: repeatRate !== 'once',
      repeatRate,
      priority,
      icon,
    });
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="bg-[#121215]/98 backdrop-blur-2xl border-t border-white/[0.12] rounded-t-[28px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_-12px_40px_rgba(0,0,0,0.7)] text-white max-w-[440px] mx-auto px-5 pb-8 pt-2">
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20 my-2.5" />

        {/* Top Header */}
        <DrawerHeader className="p-0 mb-5 flex flex-row items-center justify-between">
          <DrawerTitle className="text-xl font-extrabold text-white tracking-tight">
            {isEditing ? t('modal_edit_reminder') : t('modal_add_reminder')}
          </DrawerTitle>
          <DrawerClose onClick={onClose} className="p-1 rounded-full text-[#8E8E93] hover:text-white transition-colors">
            <X size={20} />
          </DrawerClose>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reminder title input */}
          <Input
            type="text"
            placeholder={t('reminder_text_placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-13 bg-[#161619] border-[#222226] text-white font-medium text-[15px]"
            autoFocus={open}
            required
          />

          {/* Time Picker Card */}
          <Card className="bg-[#161619] border-[#222226] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Clock size={17} color="var(--primary, #FF2442)" strokeWidth={2.2} />
                <span>{t('reminder_time_label')}</span>
              </div>
              <div className="flex items-center px-2.5 py-1 rounded-xl bg-[#1C1C22] border border-[#2A2A30]">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  {timeHHMM}
                </span>
              </div>
            </div>

            {/* Apple Timer animated 2-slider wheel */}
            <div className="mb-3">
              <TimeWheelPicker value={timeHHMM} onChange={setTimeHHMM} />
            </div>

            {/* Quick time pills */}
            <div className="flex flex-wrap gap-2">
              {presetTimes.map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => {
                    hapticMedium();
                    setTimeHHMM(pt);
                  }}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all ${
                    timeHHMM === pt
                      ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-bold shadow-sm'
                      : 'border-zinc-800 bg-zinc-900 text-gray-400 active:scale-95'
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </Card>

          {/* Repeat Rate & Priority Options Card */}
          <Card className="bg-[#161619] border-[#222226] divide-y divide-[#222228] p-0 overflow-hidden">
            {/* Repeat Rate row */}
            <div>
              <div
                onClick={() => {
                  hapticMedium();
                  setShowRepeatPicker(!showRepeatPicker);
                }}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Repeat size={19} color="var(--primary, #FF2442)" strokeWidth={2.2} />
                  <span className="text-[15px] font-semibold text-white">{t('reminder_repeat_rate')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#8E8E93]">
                    {repeatRates.find((r) => r.key === repeatRate)?.label || repeatRate}
                  </span>
                  <ChevronRight size={16} className="text-[#545458] rtl:rotate-180" />
                </div>
              </div>
              {showRepeatPicker && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {repeatRates.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setRepeatRate(r.key);
                        setShowRepeatPicker(false);
                      }}
                      className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
                        repeatRate === r.key
                          ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-bold'
                          : 'border-zinc-800 bg-zinc-900 text-gray-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority row */}
            <div>
              <div
                onClick={() => {
                  hapticMedium();
                  setShowPriorityPicker(!showPriorityPicker);
                }}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Flag size={19} color="var(--primary, #FF2442)" strokeWidth={2.2} />
                  <span className="text-[15px] font-semibold text-white">{t('reminder_priority')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      priorities.find((p) => p.key === priority)?.color || 'text-[#8E8E93]'
                    }`}
                  >
                    {priorities.find((p) => p.key === priority)?.label || priority}
                  </span>
                  <ChevronRight size={16} className="text-[#545458] rtl:rotate-180" />
                </div>
              </div>
              {showPriorityPicker && (
                <div className="px-4 pb-3 space-y-2">
                  <div className="flex gap-2">
                    {priorities.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setPriority(p.key);
                          setShowPriorityPicker(false);
                        }}
                        className={`flex-1 text-xs py-2 rounded-xl border font-medium text-center transition-all ${
                          priority === p.key
                            ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-bold'
                            : 'border-zinc-800 bg-zinc-900 text-gray-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] font-medium text-[#8E8E93] pt-0.5">
                    {priority === 'High' && t('priority_high_hint')}
                    {priority === 'Medium' && t('priority_medium_hint')}
                    {priority === 'Low' && t('priority_low_hint')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#8E8E93]">{t('select_icon')}</label>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#161619] border border-[#222226]">
                <HabitIcon name={icon} size={14} color="var(--primary, #FF2442)" />
                <span className="text-[11px] font-mono text-gray-300 capitalize">{icon}</span>
              </div>
            </div>
            <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
              {icons.map((ic) => {
                const isSelected = icon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => {
                      hapticMedium();
                      setIcon(ic);
                    }}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all border ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white shadow-sm scale-105'
                        : 'border-[#222226] bg-[#161619] text-[#8E8E93] hover:border-[#33333A] active:scale-95'
                    }`}
                  >
                    <HabitIcon name={ic} size={20} color={isSelected ? 'var(--primary, #FF2442)' : '#ffffff'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <Button
              type="submit"
              disabled={!text.trim()}
              variant="default"
              size="xl"
            >
              {isEditing ? t('save_changes') : t('modal_add_reminder')}
            </Button>

            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                size="xl"
                onClick={() => onDelete(initialReminder.id)}
              >
                <Trash2 size={16} />
                <span>{t('delete_reminder_btn')}</span>
              </Button>
            )}
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
