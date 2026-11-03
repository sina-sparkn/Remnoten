import React from 'react';
import { Home, Bell, Settings } from 'lucide-react';
import { HabitsNavIcon, TasksNavIcon } from './Icons.jsx';
import { hapticLight, playTabSound } from '../api.js';
import { useI18n } from '../lib/i18n.jsx';
import { useTheme } from '../lib/theme.jsx';

export default function BottomNav({ activeTab, onSelectTab }) {
  const { t } = useI18n();
  const { currentTheme } = useTheme();

  const tabs = [
    {
      id: 'home',
      label: t('nav_home'),
      renderIcon: (isActive) => (
        <Home
          size={21}
          color={isActive ? currentTheme.primary : '#8E8E93'}
          className={isActive ? 'fill-current' : ''}
          strokeWidth={2}
        />
      ),
    },
    {
      id: 'habits',
      label: t('nav_habits'),
      renderIcon: (isActive) => (
        <HabitsNavIcon size={21} color={isActive ? currentTheme.primary : '#8E8E93'} />
      ),
    },
    {
      id: 'tasks',
      label: t('nav_tasks'),
      renderIcon: (isActive) => (
        <TasksNavIcon size={21} color={isActive ? currentTheme.primary : '#8E8E93'} />
      ),
    },
    {
      id: 'reminders',
      label: t('nav_reminders'),
      renderIcon: (isActive) => (
        <Bell
          size={21}
          color={isActive ? currentTheme.primary : '#8E8E93'}
          className={isActive ? 'fill-current' : ''}
          strokeWidth={2}
        />
      ),
    },
    {
      id: 'settings',
      label: t('nav_settings'),
      renderIcon: (isActive) => (
        <Settings
          size={21}
          color={isActive ? currentTheme.primary : '#8E8E93'}
          strokeWidth={2}
        />
      ),
    },
  ];

  return (
    <nav id="tour-bottom-nav" className="bottom-nav backdrop-blur-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`tour-tab-${tab.id}`}
            type="button"
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (!isActive) {
                playTabSound();
                hapticLight();
              }
              onSelectTab(tab.id);
            }}
          >
            <div
              className="flex items-center justify-center transition-transform duration-200"
              style={{
                filter: isActive ? `drop-shadow(0 0 8px ${currentTheme.primary}75)` : 'none',
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
              }}
            >
              {tab.renderIcon(isActive)}
            </div>
            <span
              className="text-[10px] transition-all duration-150"
              style={{
                fontWeight: isActive ? 700 : 500,
                color: isActive ? currentTheme.primary : '#8E8E93',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
