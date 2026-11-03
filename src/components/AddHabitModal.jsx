import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
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
import { hapticMedium, hapticSuccess } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';

export default function AddHabitModal({
  open = false,
  initialHabit = null,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useI18n();
  const isEditing = Boolean(initialHabit?.id);

  const [name, setName] = useState(initialHabit?.name || '');
  const [icon, setIcon] = useState(initialHabit?.icon || 'dumbbell');
  const [target, setTarget] = useState(initialHabit?.target || 1);
  const [unit, setUnit] = useState(initialHabit?.unit || '');
  const [frequency, setFrequency] = useState(initialHabit?.frequency || 'Daily');

  useEffect(() => {
    if (open) {
      setName(initialHabit?.name || '');
      setIcon(initialHabit?.icon || 'dumbbell');
      setTarget(initialHabit?.target || 1);
      setUnit(initialHabit?.unit || '');
      setFrequency(initialHabit?.frequency || 'Daily');
    }
  }, [open, initialHabit]);

  const availableIcons = [
    { id: 'dumbbell', label: t('icon_dumbbell') },
    { id: 'book', label: t('icon_book') },
    { id: 'water', label: t('icon_water') },
    { id: 'meditate', label: t('icon_meditate') },
    { id: 'nosocial', label: t('icon_nosocial') },
    { id: 'coffee', label: t('icon_coffee') },
    { id: 'heart', label: t('icon_heart') },
    { id: 'zap', label: t('icon_zap') },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    hapticSuccess();
    onSave({
      id: initialHabit?.id,
      name: name.trim(),
      icon,
      target: Number(target) || 1,
      unit: unit.trim(),
      frequency,
    });
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="bg-[#121215]/98 backdrop-blur-2xl border-t border-white/[0.12] rounded-t-[28px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_-12px_40px_rgba(0,0,0,0.7)] text-white max-w-[440px] mx-auto px-5 pb-8 pt-2">
        <div className="mx-auto w-10 h-1 rounded-full bg-white/20 my-2.5" />

        {/* Top Header */}
        <DrawerHeader className="p-0 mb-5 flex flex-row items-center justify-between">
          <DrawerTitle className="text-xl font-extrabold text-white tracking-tight">
            {isEditing ? t('modal_edit_habit') : t('modal_add_habit')}
          </DrawerTitle>
          <DrawerClose onClick={onClose} className="p-1 rounded-full text-[#8E8E93] hover:text-white transition-colors">
            <X size={20} />
          </DrawerClose>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <Input
            type="text"
            placeholder={t('habit_name_placeholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-13 bg-[#161619] border-[#222226] text-white font-medium text-[15px]"
            autoFocus={open}
            required
          />

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-[#8E8E93] mb-2">{t('select_icon')}</label>
            <div className="grid grid-cols-4 gap-2">
              {availableIcons.map((item) => {
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      hapticMedium();
                      setIcon(item.id);
                    }}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all border ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-white shadow-sm'
                        : 'border-[#222226] bg-[#161619] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <HabitIcon name={item.id} size={22} color={isSelected ? 'var(--primary, #FF2442)' : '#ffffff'} />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-[#161619] border-[#222226] p-3">
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">{t('target_label')}</label>
              <input
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-transparent text-white font-bold text-sm outline-none"
              />
            </Card>
            <Card className="bg-[#161619] border-[#222226] p-3">
              <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">{t('unit_label')}</label>
              <input
                type="text"
                dir="auto"
                placeholder={t('unit_placeholder')}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-transparent text-white font-medium text-sm outline-none placeholder:text-[#545458] text-start"
              />
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <Button
              type="submit"
              disabled={!name.trim()}
              variant="default"
              size="xl"
            >
              {isEditing ? t('save_changes') : t('modal_add_habit')}
            </Button>

            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                size="xl"
                onClick={() => onDelete(initialHabit.id)}
              >
                <Trash2 size={16} />
                <span>{t('delete_habit_btn')}</span>
              </Button>
            )}
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
