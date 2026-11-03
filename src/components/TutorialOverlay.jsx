import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Flame,
  Check,
  Calendar,
  Plus,
  Compass,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ListFilter,
  CheckSquare,
  Bell,
  AlarmClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';
import { hapticLight, hapticMedium, hapticSuccess, playCheckSound, playTabSound } from '../api.js';

export default function TutorialOverlay({ open, activeTab, onSwitchTab, onClose }) {
  const { t } = useI18n();
  const { currentTheme } = useTheme();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  // Define steps dynamically across Home, Tasks, and Reminders
  const steps = useMemo(() => {
    const list = [
      // 1. Home - Streak & Story
      {
        id: 'streak',
        tab: 'home',
        selector: '#tour-streak-section',
        title: t('tour_streak_title'),
        desc: t('tour_streak_desc'),
        icon: Flame,
      },
      // 2. Home - Habit Check-in
      {
        id: 'habits',
        tab: 'home',
        selector: document.querySelector('#tour-habit-item')
          ? '#tour-habit-item'
          : '#tour-habits-feed',
        title: t('tour_habits_title'),
        desc: t('tour_habits_desc'),
        icon: Check,
      },
    ];

    // 3. Home - Heatmap (if a habit card exists)
    if (document.querySelector('#tour-heatmap')) {
      list.push({
        id: 'heatmap',
        tab: 'home',
        selector: '#tour-heatmap',
        title: t('tour_heatmap_title'),
        desc: t('tour_heatmap_desc'),
        icon: Calendar,
      });
    }

    list.push(
      // 4. Home - Add Habit Button
      {
        id: 'add_habit',
        tab: 'home',
        selector: '#tour-add-habit',
        title: t('tour_add_title'),
        desc: t('tour_add_desc'),
        icon: Plus,
      },
      // 5. Tasks - Filter Tabs
      {
        id: 'tasks_filters',
        tab: 'tasks',
        selector: '#tour-tasks-filters',
        title: t('tour_tasks_filters_title'),
        desc: t('tour_tasks_filters_desc'),
        icon: ListFilter,
      },
      // 6. Tasks - To-Do List Feed
      {
        id: 'tasks_feed',
        tab: 'tasks',
        selector: '#tour-tasks-feed',
        title: t('tour_tasks_feed_title'),
        desc: t('tour_tasks_feed_desc'),
        icon: CheckSquare,
      },
      // 7. Tasks - Floating Add Task Button
      {
        id: 'add_task',
        tab: 'tasks',
        selector: '#tour-add-task',
        title: t('tour_tasks_add_title'),
        desc: t('tour_tasks_add_desc'),
        icon: Plus,
      },
      // 8. Reminders - Smart Alarms Feed
      {
        id: 'reminders_feed',
        tab: 'reminders',
        selector: '#tour-reminders-feed',
        title: t('tour_reminders_feed_title'),
        desc: t('tour_reminders_feed_desc'),
        icon: Bell,
      },
      // 9. Reminders - Floating Add Reminder Button
      {
        id: 'add_reminder',
        tab: 'reminders',
        selector: '#tour-add-reminder',
        title: t('tour_reminders_add_title'),
        desc: t('tour_reminders_add_desc'),
        icon: AlarmClock,
      },
      // 10. Bottom Navigation & Completion
      {
        id: 'nav',
        tab: 'home',
        selector: '#tour-bottom-nav',
        title: t('tour_nav_title'),
        desc: t('tour_nav_desc'),
        icon: Compass,
      }
    );

    return list;
  }, [open, t]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Measure and update target element bounding box
  const updateTargetRect = useCallback(() => {
    if (!open || !currentStep?.selector) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });
    } else {
      setTargetRect(null);
    }
  }, [open, currentStep]);

  // Handle tab switching and target positioning on step change
  useEffect(() => {
    if (!open || !currentStep) return;

    // Switch tab if target belongs to another screen
    if (currentStep.tab && onSwitchTab && activeTab !== currentStep.tab) {
      playTabSound();
      onSwitchTab(currentStep.tab);
    }

    // Allow DOM of new screen to render before measuring
    const timer = setTimeout(() => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
      updateTargetRect();
    }, 220);

    const retryTimer = setTimeout(updateTargetRect, 450);

    return () => {
      clearTimeout(timer);
      clearTimeout(retryTimer);
    };
  }, [open, currentStepIndex, currentStep, activeTab, onSwitchTab, updateTargetRect]);

  // Keep target rect aligned on window scroll or resize
  useEffect(() => {
    if (!open) return;

    window.addEventListener('scroll', updateTargetRect, true);
    window.addEventListener('resize', updateTargetRect);

    return () => {
      window.removeEventListener('scroll', updateTargetRect, true);
      window.removeEventListener('resize', updateTargetRect);
    };
  }, [open, updateTargetRect]);

  // Reset to first step on open
  useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
    }
  }, [open]);

  if (!open || !currentStep) return null;

  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      hapticMedium();
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      hapticLight();
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    hapticSuccess();
    playCheckSound();
    if (onSwitchTab && activeTab !== 'home') {
      onSwitchTab('home');
    }
    try {
      localStorage.setItem('remnoten_tutorial_completed', 'true');
    } catch (_) {}
    onClose();
  };

  // Spotlight dimensions with generous padding
  const pad = 6;
  const spotX = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const spotY = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const spotWidth = targetRect ? targetRect.width + pad * 2 : 0;
  const spotHeight = targetRect ? targetRect.height + pad * 2 : 0;
  const spotRadius = 16;

  // Tooltip position calculation (above or below the element)
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const spaceBelow = targetRect ? windowHeight - targetRect.bottom : 300;
  const placeAbove = targetRect && spaceBelow < 230 && targetRect.top > 230;

  let tooltipStyle = {};
  if (targetRect) {
    if (placeAbove) {
      tooltipStyle = {
        bottom: `${windowHeight - targetRect.top + 14}px`,
        left: '16px',
        right: '16px',
      };
    } else {
      tooltipStyle = {
        top: `${targetRect.bottom + 14}px`,
        left: '16px',
        right: '16px',
      };
    }
  } else {
    // Fallback centered
    tooltipStyle = {
      top: '50%',
      left: '16px',
      right: '16px',
      transform: 'translateY(-50%)',
    };
  }

  const StepIcon = currentStep.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fade-in pointer-events-auto">
      {/* SVG Dimmed Backdrop with Transparent Cutout Mask for Target Element */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 51 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White exposes the dark backdrop */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight area transparently so real element shows through */}
            {targetRect && (
              <rect
                x={spotX}
                y={spotY}
                width={spotWidth}
                height={spotHeight}
                rx={spotRadius}
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dark Dimmed Screen Backdrop */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Click backdrop to skip tour */}
      <div
        className="fixed inset-0 cursor-pointer"
        style={{ zIndex: 52 }}
        onClick={handleComplete}
      />

      {/* Animated Glowing Accent Border around Target Spotlight */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out animate-pulse"
          style={{
            zIndex: 53,
            top: spotY,
            left: spotX,
            width: spotWidth,
            height: spotHeight,
            borderRadius: spotRadius,
            border: `2px solid ${currentTheme.primary}`,
            boxShadow: `0 0 20px ${currentTheme.primary}45`,
          }}
        />
      )}

      {/* Floating On-Screen Tooltip Card */}
      <div
        className="fixed max-w-[390px] mx-auto transition-all duration-300 ease-out"
        style={{ ...tooltipStyle, zIndex: 54 }}
      >
        <div className="relative rounded-2xl bg-[#141418] border border-[#282830] shadow-2xl p-4 flex flex-col text-start">
          {/* Pointer Triangle Arrow pointing to the highlighted element */}
          {targetRect && (
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent ${
                placeAbove
                  ? '-bottom-2 border-t-8 border-t-[#282830]'
                  : '-top-2 border-b-8 border-b-[#282830]'
              }`}
            />
          )}

          {/* Card Top Header: Step Counter & Skip Button */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
              <StepIcon size={12} color={currentTheme.primary} />
              <span className="text-[11px] font-bold text-[#AEAEB2]">
                {t('tutorial_step_of', `Step ${currentStepIndex + 1} of ${totalSteps}`)
                  .replace('{current}', String(currentStepIndex + 1))
                  .replace('{total}', String(totalSteps))}
              </span>
            </div>

            <button
              type="button"
              onClick={handleComplete}
              className="text-[11px] font-semibold text-[#8E8E93] hover:text-white px-2 py-0.5 rounded-full bg-white/5 active:scale-95 transition-all"
            >
              {t('tutorial_skip')}
            </button>
          </div>

          {/* Step Title */}
          <h3 className="text-sm font-bold text-white tracking-tight mb-1">
            {currentStep.title}
          </h3>

          {/* Step Description */}
          <p className="text-xs text-[#AEAEB2] leading-relaxed mb-4">
            {currentStep.desc}
          </p>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            {/* Step Dots Indicator */}
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: idx === currentStepIndex ? '14px' : '5px',
                    backgroundColor:
                      idx === currentStepIndex
                        ? currentTheme.primary
                        : 'rgba(255, 255, 255, 0.15)',
                  }}
                />
              ))}
            </div>

            {/* Back & Next Navigation */}
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 px-3 rounded-xl border-[#2C2C32] text-[#AEAEB2] hover:text-white text-xs font-semibold"
                >
                  <ChevronLeft size={14} className="rtl:rotate-180 mr-0.5" />
                  <span>{t('tutorial_back')}</span>
                </Button>
              )}

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleNext}
                className="h-8 px-3.5 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-transform flex items-center gap-1"
              >
                <span>{isLastStep ? t('tutorial_finish') : t('tutorial_next')}</span>
                {isLastStep ? (
                  <Sparkles size={13} />
                ) : (
                  <ChevronRight size={14} className="rtl:rotate-180" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
