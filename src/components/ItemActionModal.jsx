import React from 'react';
import { Pencil, Trash2, X, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import HabitIcon from './Icons.jsx';
import AutoScrollText from './AutoScrollText.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { hapticMedium, hapticError, playDeleteSound } from '../api.js';

export default function ItemActionModal({
  target = null, // { type: 'habit'|'task'|'reminder', item: object }
  onClose,
  onEdit,
  onDelete,
}) {
  const { t, isRTL } = useI18n();
  const isOpen = Boolean(target?.item);
  const { type, item } = target || {};

  if (!item) {
    return (
      <Drawer open={false} onOpenChange={() => {}}>
        <DrawerContent className="hidden" />
      </Drawer>
    );
  }

  // Derive title & subtitle based on item type
  let title = '';
  let subtitle = '';
  let iconName = 'bell';

  if (type === 'habit') {
    title = item.name;
    iconName = item.icon || 'dumbbell';
    subtitle = item.frequency ? `${item.frequency}` : t('freq_daily');
    if (item.target) {
      subtitle += ` • ${item.target} ${item.unit || ''}`.trim();
    }
  } else if (type === 'task') {
    title = item.text;
    iconName = 'check';
    const remindTag = item.remindBefore && item.remindBefore !== 'none' ? ` • 🔔 ${t('task_reminder_title')}` : '';
    subtitle = `${item.dueDate || t('default_due')}${remindTag}`;
  } else if (type === 'reminder') {
    title = item.text;
    iconName = item.icon || 'bell';
    const repeatLabels = {
      once: t('repeat_once'),
      daily: t('repeat_daily'),
      '2_days': t('repeat_2_days'),
      '3_days': t('repeat_3_days'),
      weekly: t('repeat_weekly'),
    };
    const rep = repeatLabels[item.repeatRate] || (item.repeat ? t('repeat_every_day') : t('repeat_once'));
    const priorityLabels = {
      High: t('priority_high'),
      Medium: t('priority_medium'),
      Low: t('priority_low'),
    };
    const pri = item.priority ? ` • ${priorityLabels[item.priority] || item.priority}` : '';
    subtitle = `${rep}${pri} • ${item.timeHHMM || '08:00'}`;
  }

  const handleEditClick = () => {
    hapticMedium();
    onClose();
    if (onEdit) onEdit(item, type);
  };

  const handleDeleteClick = () => {
    playDeleteSound();
    hapticError();
    onClose();
    if (onDelete) onDelete(item, type);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-[#121215]/98 backdrop-blur-2xl border-t border-white/[0.12] rounded-t-[28px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_-12px_40px_rgba(0,0,0,0.7)] text-white max-w-[440px] mx-auto px-5 pb-8 pt-2">
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20 my-2.5" />

        {/* Modal Header with Close Button */}
        <DrawerHeader className="p-0 mb-4 flex flex-row items-center justify-between">
          <DrawerTitle className="text-base font-bold text-[#8E8E93] tracking-tight">
            {t('item_actions')}
          </DrawerTitle>
          <DrawerClose onClick={onClose} className="p-1 rounded-full text-[#8E8E93] hover:text-white transition-colors">
            <X size={18} />
          </DrawerClose>
        </DrawerHeader>

        {/* Item Preview Card */}
        <div className="p-3.5 mb-4 rounded-2xl bg-[#161619] border border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#1C1C22] flex items-center justify-center flex-shrink-0">
            <HabitIcon name={iconName} size={22} color="var(--primary, #FF2442)" />
          </div>
          <div className="min-w-0 flex-1">
            <AutoScrollText as="h3" className="text-[15px] font-bold text-white tracking-tight text-start">
              {title}
            </AutoScrollText>
            <AutoScrollText as="p" className="text-xs font-medium text-[#8E8E93] mt-0.5 text-start">
              {subtitle}
            </AutoScrollText>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-2.5 mb-3">
          {/* Edit Option */}
          <button
            type="button"
            onClick={handleEditClick}
            className="w-full p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] active:scale-[0.98] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex items-center justify-between transition-all cursor-pointer text-left rtl:text-right"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <Pencil size={18} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-white">{t('action_edit')}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#8E8E93] rtl:rotate-180" />
          </button>

          {/* Delete Option */}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="w-full p-4 rounded-2xl bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 active:scale-[0.98] border border-[var(--primary)]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex items-center justify-between transition-all cursor-pointer text-left rtl:text-right text-[var(--primary)]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)]">
                <Trash2 size={18} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-[var(--primary)]">{t('action_delete')}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--primary)] rtl:rotate-180" />
          </button>
        </div>

        {/* Cancel Button */}
        <Button
          type="button"
          variant="secondary"
          size="xl"
          onClick={onClose}
          className="border-[#2A2A30] text-[#8E8E93] hover:text-white"
        >
          {t('action_cancel')}
        </Button>
      </DrawerContent>
    </Drawer>
  );
}
