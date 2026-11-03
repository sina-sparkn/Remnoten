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
    { id: 'home', label: t('nav_home'), renderIcon: (c) => <Home size={22} color={c} strokeWidth={2} /> },
    { id: 'habits', label: t('nav_habits'), renderIcon: (c) => <HabitsNavIcon size={22} color={c} /> },
    { id: 'tasks', label: t('nav_tasks'), renderIcon: (c) => <TasksNavIcon size={22} color={c} /> },
    { id: 'reminders', label: t('nav_reminders'), renderIcon: (c) => <Bell size={22} color={c} strokeWidth={2} /> },
    { id: 'settings', label: t('nav_settings'), renderIcon: (c) => <Settings size={22} color={c} strokeWidth={2} /> },
  ];

  return (
    <nav id="tour-bottom-nav" className="bottom-nav backdrop-blur-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? currentTheme.primary : '#8E8E93';

        return (
          <button
            key={tab.id}
            id={`tour-tab-${tab.id}`}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            style={
              isActive
                ? {
                    backgroundColor: currentTheme.primarySubtle,
                  }
                : undefined
            }
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
              {tab.renderIcon(color)}
            </div>
            <span
              className={`transition-all duration-150 ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
