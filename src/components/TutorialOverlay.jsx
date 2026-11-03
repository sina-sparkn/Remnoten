import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Flame,
  Check,
  Calendar,
  Plus,
  Compass,
  ChevronRight,
  ChevronLeft,
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

  // Define steps dynamically matching the new redesigned UI across Home, Habits, Tasks, and Reminders
  const steps = useMemo(() => {
    return [
      // 1. Home - Hero Streak & Dual Progress Bars
      {
        id: 'streak',
        tab: 'home',
        selector: '#tour-streak-section',
        title: t('tour_streak_title'),
        desc: t('tour_streak_desc'),
        icon: Flame,
      },
      // 2. Home - Today's Unified Action Feed
      {
        id: 'today',
        tab: 'home',
        selector: '#tour-today-section',
        title: t('tour_today_title'),
        desc: t('tour_today_desc'),
        icon: Check,
      },
      // 3. Home - Upcoming Schedule & Reminders
      {
        id: 'upcoming',
        tab: 'home',
        selector: '#tour-upcoming-section',
        title: t('tour_upcoming_title'),
        desc: t('tour_upcoming_desc'),
        icon: Calendar,
      },
      // 4. Habits - 365-Day Activity Heatmaps
      {
        id: 'habits',
        tab: 'habits',
        selector: '#tour-habits-feed',
        title: t('tour_habits_title'),
        desc: t('tour_habits_desc'),
        icon: Calendar,
      },
      // 5. Habits - Floating Add Habit Button
      {
        id: 'add_habit',
        tab: 'habits',
        selector: '#tour-add-habit',
        title: t('tour_add_title'),
        desc: t('tour_add_desc'),
        icon: Plus,
      },
      // 6. Tasks - Smart Filter Tabs
      {
        id: 'tasks_filters',
        tab: 'tasks',
        selector: '#tour-tasks-filters',
        title: t('tour_tasks_filters_title'),
        desc: t('tour_tasks_filters_desc'),
        icon: ListFilter,
      },
      // 7. Tasks - To-Do List Feed
      {
        id: 'tasks_feed',
        tab: 'tasks',
        selector: '#tour-tasks-feed',
        title: t('tour_tasks_feed_title'),
        desc: t('tour_tasks_feed_desc'),
        icon: CheckSquare,
      },
      // 8. Tasks - Floating Add Task Button
      {
        id: 'add_task',
        tab: 'tasks',
        selector: '#tour-add-task',
        title: t('tour_tasks_add_title'),
        desc: t('tour_tasks_add_desc'),
        icon: Plus,
      },
      // 9. Reminders - Smart Alarms Feed
      {
        id: 'reminders_feed',
        tab: 'reminders',
        selector: '#tour-reminders-feed',
        title: t('tour_reminders_feed_title'),
        desc: t('tour_reminders_feed_desc'),
        icon: Bell,
      },
      // 10. Reminders - Floating Add Reminder Button
      {
        id: 'add_reminder',
        tab: 'reminders',
        selector: '#tour-add-reminder',
        title: t('tour_reminders_add_title'),
        desc: t('tour_reminders_add_desc'),
        icon: AlarmClock,
      },
      // 11. Bottom Floating Navigation Dock
      {
        id: 'nav',
        tab: 'home',
        selector: '#tour-bottom-nav',
        title: t('tour_nav_title'),
        desc: t('tour_nav_desc'),
        icon: Compass,
      },
    ];
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
    }, 240);

    const retryTimer = setTimeout(updateTargetRect, 480);

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
  const spotRadius = targetRect && targetRect.height > 55 ? 26 : 18;

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
    <div className="fixed inset-0 z-[100] overflow-hidden select-none animate-fade-in pointer-events-auto">
      {/* SVG Dimmed Backdrop with Transparent Cutout Mask for Target Element */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 101 }}
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
        style={{ zIndex: 102 }}
        onClick={handleComplete}
      />

      {/* Animated Glowing Accent Border around Target Spotlight */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 ease-out animate-pulse"
          style={{
            zIndex: 103,
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
        style={{ ...tooltipStyle, zIndex: 104 }}
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
              className="text-[11px] font-semibold text-[#8E8E93] hover:text-white px-2 py-0.5 rounded-full bg-white/5 active:scale-95 transition-all cursor-pointer"
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
                  className="h-8 px-3 rounded-xl border-[#2C2C32] text-[#AEAEB2] hover:text-white text-xs font-semibold cursor-pointer"
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
                style={{
                  backgroundColor: currentTheme.primary,
                  color: currentTheme.primaryForeground,
                }}
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
