import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, Bell, ChevronRight, Check, X, Trash2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import TimeWheelPicker from './ui/TimeWheelPicker.jsx';
import AutoScrollText from './AutoScrollText.jsx';
import { hapticMedium, hapticSuccess } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';

const pad2 = (n) => String(n).padStart(2, '0');

function formatDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function getOffsetDateKey(days, baseDateStr = null) {
  let d;
  if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    const [y, m, day] = baseDateStr.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date();
  }
  d.setDate(d.getDate() + days);
  return formatDateKey(d);
}

function parseInitialTime(initialTask) {
  if (initialTask?.dueTime && /^\d{1,2}:\d{2}$/.test(initialTask.dueTime)) {
    const [h, m] = initialTask.dueTime.split(':');
    return `${pad2(h)}:${pad2(m)}`;
  }
  if (initialTask?.dueDate) {
    const m = initialTask.dueDate.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const ampm = m[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${pad2(h)}:${pad2(min)}`;
    }
  }
  return '10:00';
}

function parseInitialDate(initialTask) {
  if (initialTask?.dueDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(initialTask.dueDateRaw)) {
    return initialTask.dueDateRaw;
  }
  if (initialTask?.dueDate) {
    const lower = initialTask.dueDate.toLowerCase();
    if (lower.includes('tomorrow') || lower.includes('فردا') || lower.includes('завтра')) {
      return getOffsetDateKey(1);
    }
    const isoMatch = initialTask.dueDate.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];
  }
  return getTodayKey();
}

export default function AddTaskModal({
  open = false,
  initialTask = null,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useI18n();
  const isEditing = Boolean(initialTask?.id);

  const [text, setText] = useState(initialTask?.text || '');
  const [selectedDate, setSelectedDate] = useState(() => parseInitialDate(initialTask));
  const [timeHHMM, setTimeHHMM] = useState(() => parseInitialTime(initialTask));

  // Reminder state: toggle + choice ('4h', '1d', 'at_due', 'custom')
  const initialHasRemind = initialTask?.remindBefore && initialTask.remindBefore !== 'none';
  const [remindEnabled, setRemindEnabled] = useState(Boolean(initialHasRemind));
  const [remindBefore, setRemindBefore] = useState(initialHasRemind ? initialTask.remindBefore : '4h');
  const [remindCustomDate, setRemindCustomDate] = useState(() => initialTask?.remindCustomDate || initialTask?.dueDateRaw || getTodayKey());
  const [remindCustomTime, setRemindCustomTime] = useState(() => initialTask?.remindCustomTime || '09:00');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const dateInputRef = useRef(null);
  const remindDateInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setText(initialTask?.text || '');
      const parsedDate = parseInitialDate(initialTask);
      const parsedTime = parseInitialTime(initialTask);
      setSelectedDate(parsedDate);
      setTimeHHMM(parsedTime);
      const hasRemind = initialTask?.remindBefore && initialTask.remindBefore !== 'none';
      setRemindEnabled(Boolean(hasRemind));
      setRemindBefore(hasRemind ? initialTask.remindBefore : '4h');
      setRemindCustomDate(initialTask?.remindCustomDate || initialTask?.dueDateRaw || parsedDate || getTodayKey());
      setRemindCustomTime(initialTask?.remindCustomTime || '09:00');
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, [open, initialTask]);

  // Guarantee reminder date & time never exceed the task's due date & time
  useEffect(() => {
    if (remindCustomDate > selectedDate) {
      setRemindCustomDate(selectedDate);
    }
    if (remindCustomDate === selectedDate && remindCustomTime > timeHHMM) {
      setRemindCustomTime(timeHHMM);
    }
  }, [selectedDate, timeHHMM, remindCustomDate, remindCustomTime]);

  const todayKey = getTodayKey();
  const tomorrowKey = getOffsetDateKey(1);
  const in2DaysKey = getOffsetDateKey(2);
  const nextWeekKey = getOffsetDateKey(7);

  const isCustomDate =
    selectedDate !== todayKey &&
    selectedDate !== tomorrowKey &&
    selectedDate !== in2DaysKey &&
    selectedDate !== nextWeekKey;

  const getDateLabel = (dateKey) => {
    if (dateKey === todayKey) return t('date_today');
    if (dateKey === tomorrowKey) return t('date_tomorrow');
    if (dateKey === in2DaysKey) return t('date_in_2_days');
    if (dateKey === nextWeekKey) return t('date_next_week');
    return dateKey;
  };

  const currentDueDisplay = `${getDateLabel(selectedDate)} • ${timeHHMM}`;

  const datePresets = [
    { key: todayKey, label: t('date_today') },
    { key: tomorrowKey, label: t('date_tomorrow') },
    { key: in2DaysKey, label: t('date_in_2_days') },
    { key: nextWeekKey, label: t('date_next_week') },
  ];

  const presetTimes = ['09:00', '12:00', '15:00', '18:00', '21:00'];

  const presetOptions = [
    {
      key: '4h',
      title: t('remind_4h_before_title'),
      desc: t('remind_4h_before_desc'),
      icon: '⏳',
    },
    {
      key: '1d',
      title: t('remind_1d_before_title'),
      desc: t('remind_1d_before_desc'),
      icon: '📅',
    },
    {
      key: 'at_due',
      title: t('remind_at_due_title'),
      desc: t('remind_at_due_desc'),
      icon: '⏰',
    },
    {
      key: 'custom',
      title: t('remind_custom_title'),
      desc: t('remind_custom_desc'),
      icon: '⚙️',
    },
  ];

  const getCalculatedRemindTimePreview = () => {
    if (!remindEnabled) return '';
    const baseDate = selectedDate || todayKey;
    const baseTime = timeHHMM || '12:00';
    if (remindBefore === 'at_due') {
      return `${getDateLabel(baseDate)} • ${baseTime}`;
    }
    if (remindBefore === '4h') {
      try {
        const [y, m, d] = baseDate.split('-').map(Number);
        const [h, min] = baseTime.split(':').map(Number);
        const dateObj = new Date(y, m - 1, d, h, min, 0);
        const reminderDate = new Date(dateObj.getTime() - 4 * 3600 * 1000);
        const remDateKey = formatDateKey(reminderDate);
        const remTimeKey = `${pad2(reminderDate.getHours())}:${pad2(reminderDate.getMinutes())}`;
        return `${getDateLabel(remDateKey)} • ${remTimeKey}`;
      } catch {
        return `${getDateLabel(baseDate)} • ${baseTime}`;
      }
    }
    if (remindBefore === '1d') {
      const prevDayKey = getOffsetDateKey(-1, baseDate);
      return `${getDateLabel(prevDayKey)} • ${baseTime}`;
    }
    if (remindBefore === 'custom') {
      let custDate = remindCustomDate || baseDate;
      let custTime = remindCustomTime || '09:00';
      if (custDate > baseDate) {
        custDate = baseDate;
      }
      if (custDate === baseDate && custTime > baseTime) {
        custTime = baseTime;
      }
      return `${getDateLabel(custDate)} • ${custTime}`;
    }
    return '';
  };

  const getRemindSummaryText = () => {
    if (!remindEnabled) return t('task_reminder_off_hint');
    if (remindBefore === '4h') return t('remind_4h_before_title');
    if (remindBefore === '1d') return t('remind_1d_before_title');
    if (remindBefore === 'at_due') return t('remind_at_due_title');
    if (remindBefore === 'custom') {
      let safeDate = remindCustomDate;
      let safeTime = remindCustomTime;
      if (safeDate > selectedDate) safeDate = selectedDate;
      if (safeDate === selectedDate && safeTime > timeHHMM) safeTime = timeHHMM;
      return `${getDateLabel(safeDate)} • ${safeTime}`;
    }
    return t('task_reminder_title');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    hapticSuccess();

    // Standard formatted dueDate string for backward compatibility with existing views
    let formattedDueDate = '';
    if (selectedDate === todayKey) {
      formattedDueDate = `Today • ${timeHHMM}`;
    } else if (selectedDate === tomorrowKey) {
      formattedDueDate = `Tomorrow • ${timeHHMM}`;
    } else {
      formattedDueDate = `${selectedDate} • ${timeHHMM}`;
    }

    // Compute UTC Unix timestamp in seconds for due date
    const [y, m, d] = selectedDate.split('-').map(Number);
    const [h, min] = timeHHMM.split(':').map(Number);
    const localDate = new Date(y, m - 1, d, h, min, 0);
    const dueTimestamp = Math.floor(localDate.getTime() / 1000);

    // Compute reminder timestamp based on user selection
    const effectiveRemindBefore = remindEnabled ? remindBefore : 'none';
    let remindTimestamp = null;
    let safeCustomDate = remindCustomDate;
    let safeCustomTime = remindCustomTime;

    if (remindEnabled) {
      if (remindBefore === 'at_due') {
        remindTimestamp = dueTimestamp;
      } else if (remindBefore === '4h') {
        remindTimestamp = dueTimestamp ? dueTimestamp - 4 * 3600 : null;
      } else if (remindBefore === '1d') {
        remindTimestamp = dueTimestamp ? dueTimestamp - 24 * 3600 : null;
      } else if (remindBefore === 'custom') {
        if (safeCustomDate > selectedDate) {
          safeCustomDate = selectedDate;
        }
        if (safeCustomDate === selectedDate && safeCustomTime > timeHHMM) {
          safeCustomTime = timeHHMM;
        }
        const [ry, rm, rd] = safeCustomDate.split('-').map(Number);
        const [rh, rmin] = safeCustomTime.split(':').map(Number);
        const customRemindDate = new Date(ry, rm - 1, rd, rh, rmin, 0);
        let customTs = Math.floor(customRemindDate.getTime() / 1000);
        // Strictly prevent setting reminder timestamp past task due date/time
        if (dueTimestamp && customTs > dueTimestamp) {
          customTs = dueTimestamp;
        }
        remindTimestamp = customTs;
      }
    }

    onSave({
      id: initialTask?.id,
      text: text.trim(),
      dueDate: formattedDueDate,
      dueDateRaw: selectedDate,
      dueTime: timeHHMM,
      dueTimestamp,
      remindBefore: effectiveRemindBefore,
      remindTimestamp,
      remindCustomDate: effectiveRemindBefore === 'custom' ? safeCustomDate : null,
      remindCustomTime: effectiveRemindBefore === 'custom' ? safeCustomTime : null,
    });
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="bg-[#121215]/98 backdrop-blur-2xl border-t border-white/[0.12] rounded-t-[28px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_-12px_40px_rgba(0,0,0,0.7)] text-white max-w-[440px] mx-auto px-5 pb-8 pt-2 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20 my-2.5" />

        {/* Header */}
        <DrawerHeader className="p-0 mb-5 flex flex-row items-center justify-between">
          <DrawerTitle className="text-xl font-extrabold text-white tracking-tight">
            {isEditing ? t('modal_edit_task') : t('modal_add_task')}
          </DrawerTitle>
          <DrawerClose onClick={onClose} className="p-1 rounded-full text-[#8E8E93] hover:text-white transition-colors">
            <X size={20} />
          </DrawerClose>
        </DrawerHeader>

        <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title Input */}
          <Input
            type="text"
            placeholder={t('task_title_placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-13 bg-[#161619] border-[#222226] text-white font-medium text-[15px]"
            autoFocus={open}
            required
          />

          {/* Options Card */}
          <Card className="bg-[#161619] border-[#222226] divide-y divide-[#222228] p-0 overflow-hidden">
            {/* 1. Due Date row */}
            <div>
              <div
                onClick={() => {
                  hapticMedium();
                  setShowDatePicker(!showDatePicker);
                }}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-[#202026] flex items-center justify-center shrink-0">
                    <Calendar size={18} color="var(--primary, #FF2442)" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[14px] font-bold text-white tracking-tight block">
                      {t('task_due_date_title')}
                    </span>
                    <AutoScrollText className="text-[11.5px] font-semibold text-[#8E8E93] mt-0.5">
                      {getDateLabel(selectedDate)}
                    </AutoScrollText>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-[#202026] border border-[#2D2D35] text-white">
                    {getDateLabel(selectedDate)}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`text-[#545458] rtl:rotate-180 transition-transform ${
                      showDatePicker ? 'rotate-90 rtl:-rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {showDatePicker && (
                <div className="px-4 pb-4 space-y-3 bg-[#141417]/90 border-t border-[#202026] pt-3.5 animate-in fade-in duration-200">
                  {/* Quick Preset Pills + Dedicated Calendar Picker Pill */}
                  <div className="flex flex-wrap items-center gap-2">
                    {datePresets.map((dp) => (
                      <button
                        key={dp.key}
                        type="button"
                        onClick={() => {
                          hapticMedium();
                          setSelectedDate(dp.key);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                          selectedDate === dp.key
                            ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-bold shadow-sm'
                            : 'border-zinc-800 bg-zinc-900 text-gray-300 active:scale-95'
                        }`}
                      >
                        {dp.label}
                      </button>
                    ))}

                    {/* Native Calendar Picker Pill */}
                    <div className="relative inline-flex">
                      <button
                        type="button"
                        className={`text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition-all pointer-events-none ${
                          isCustomDate
                            ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-bold shadow-sm'
                            : 'border-zinc-800 bg-zinc-900 text-gray-300'
                        }`}
                      >
                        <Calendar size={13} color="var(--primary, #FF2442)" />
                        <span>{isCustomDate ? selectedDate : t('choose_date_calendar')}</span>
                      </button>
                      <input
                        ref={dateInputRef}
                        type="date"
                        min={todayKey}
                        value={selectedDate}
                        onChange={(e) => {
                          if (e.target.value) {
                            hapticMedium();
                            setSelectedDate(e.target.value);
                          }
                        }}
                        onClick={(e) => {
                          try {
                            if (typeof e.target.showPicker === 'function') {
                              e.target.showPicker();
                            }
                          } catch {}
                        }}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Due Time row */}
            <div>
              <div
                onClick={() => {
                  hapticMedium();
                  setShowTimePicker(!showTimePicker);
                }}
                className="p-4 flex items-center justify-between cursor-pointer active:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#202026] flex items-center justify-center shrink-0">
                    <Clock size={18} color="var(--primary, #FF2442)" strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[14px] font-bold text-white tracking-tight block">
                      {t('task_due_time_title')}
                    </span>
                    <span className="text-[11.5px] font-semibold text-[#8E8E93] block mt-0.5 truncate">
                      {timeHHMM}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* High-visibility 24h due time badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)]">
                    <Clock size={12} className="text-[var(--primary)]" />
                    <span className="text-xs font-mono font-black tracking-wide">
                      {timeHHMM}
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-[#545458] rtl:rotate-180 transition-transform ${
                      showTimePicker ? 'rotate-90 rtl:-rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {showTimePicker && (
                <div className="px-4 pb-4 space-y-3 bg-[#141417]/90 border-t border-[#202026] pt-3.5 animate-in fade-in duration-200">
                  {/* Apple Timer 2-slider wheel */}
                  <div className="mb-2">
                    <TimeWheelPicker compact value={timeHHMM} onChange={setTimeHHMM} />
                  </div>

                  {/* Quick time pills in 24h */}
                  <div className="flex flex-wrap gap-2">
                    {presetTimes.map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => {
                          hapticMedium();
                          setTimeHHMM(pt);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                          timeHHMM === pt
                            ? 'border-[var(--primary)] bg-[var(--primary)]/20 text-white font-bold shadow-sm'
                            : 'border-zinc-800 bg-zinc-900 text-gray-400 active:scale-95'
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Redesigned Reminder Section with Switch Toggle */}
            <div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      remindEnabled
                        ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                        : 'bg-[#202026] text-[#8E8E93]'
                    }`}
                  >
                    <Bell size={18} strokeWidth={2.4} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[14px] font-bold text-white tracking-tight block">
                      {t('task_reminder_title')}
                    </span>
                    <AutoScrollText className="text-[11px] font-medium text-[#8E8E93] mt-0.5">
                      {getRemindSummaryText()}
                    </AutoScrollText>
                  </div>
                </div>

                <Switch
                  checked={remindEnabled}
                  onCheckedChange={(checked) => {
                    hapticMedium();
                    setRemindEnabled(checked);
                    if (checked && (!remindBefore || remindBefore === 'none')) {
                      setRemindBefore('4h');
                    }
                  }}
                />
              </div>

              {/* Expanded options when Reminder toggle is ON */}
              {remindEnabled && (
                <div className="px-4 pb-4 space-y-3 bg-[#141417]/90 border-t border-[#202026] pt-3 animate-in fade-in duration-200">
                  {/* Minimalist 2x2 options grid (single-line pills, no bulky subtitle text) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {presetOptions.map((opt) => {
                      const isSelected = remindBefore === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            hapticMedium();
                            setRemindBefore(opt.key);
                          }}
                          className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer active:scale-98 select-none ${
                            isSelected
                              ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-white shadow-sm'
                              : 'bg-[#18181D]/60 border-[#26262C] text-[#8E8E93] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{opt.icon}</span>
                            <span className="truncate">{opt.title}</span>
                          </span>
                          {isSelected && (
                            <Check size={13} className="text-[var(--primary)] shrink-0" strokeWidth={2.5} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Flat Custom Date & Time section — NO nested container cards */}
                  {remindBefore === 'custom' && (
                    <div className="space-y-3 pt-2.5 border-t border-[#202026] animate-in fade-in duration-200">
                      {/* Date Row */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#8E8E93]">
                          {t('remind_custom_date')}
                        </span>
                        <div className="relative">
                          <button
                            type="button"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1C1C22] border border-[#2A2A32] text-white flex items-center gap-1.5 active:scale-95 transition-all pointer-events-none"
                          >
                            <Calendar size={13} className="text-[var(--primary)]" />
                            <span>{getDateLabel(remindCustomDate)}</span>
                          </button>
                          <input
                            ref={remindDateInputRef}
                            type="date"
                            min={todayKey}
                            max={selectedDate}
                            value={remindCustomDate}
                            onChange={(e) => {
                              if (e.target.value) {
                                hapticMedium();
                                let val = e.target.value;
                                if (val > selectedDate) val = selectedDate;
                                setRemindCustomDate(val);
                                if (val === selectedDate && remindCustomTime > timeHHMM) {
                                  setRemindCustomTime(timeHHMM);
                                }
                              }
                            }}
                            onClick={(e) => {
                              try {
                                if (typeof e.target.showPicker === 'function') {
                                  e.target.showPicker();
                                }
                              } catch {}
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Time Row + Compact Apple Wheel */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#8E8E93]">
                            {t('remind_custom_time')}
                          </span>
                          <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-[#1C1C22] border border-[#2A2A32]">
                            {remindCustomTime}
                          </span>
                        </div>

                        {/* Minimalist compact Apple-style Time Wheel (108px high, no headers, no clutter) */}
                        <TimeWheelPicker
                          compact
                          value={remindCustomTime}
                          onChange={setRemindCustomTime}
                          maxTime={remindCustomDate === selectedDate ? timeHHMM : null}
                        />
                      </div>
                    </div>
                  )}

                  {/* Minimalist subtle footnote indicator — NO heavy colored box */}
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-[#8E8E93]">
                    <Bell size={12} className="text-[var(--primary)] shrink-0" />
                    <span>{t('remind_scheduled_preview', { when: getCalculatedRemindTimePreview() })}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <Button
              type="submit"
              disabled={!text.trim()}
              variant="default"
              size="xl"
            >
              {isEditing ? t('save_changes') : t('modal_add_task')}
            </Button>

            {isEditing && (
              <Button
                type="button"
                onClick={() => {
                  hapticMedium();
                  onDelete(initialTask.id);
                }}
                variant="outline"
                size="xl"
                className="w-full h-12 rounded-2xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold cursor-pointer"
              >
                <Trash2 size={16} className="mr-1.5 rtl:ml-1.5 rtl:mr-0" />
                <span>{t('delete_task_btn')}</span>
              </Button>
            )}
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}