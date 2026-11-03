import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import HabitsScreen from './components/HabitsScreen.jsx';
import HabitDetailScreen from './components/HabitDetailScreen.jsx';
import TasksScreen from './components/TasksScreen.jsx';
import AddTaskModal from './components/AddTaskModal.jsx';
import RemindersScreen from './components/RemindersScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import AddHabitModal from './components/AddHabitModal.jsx';
import AddReminderModal from './components/AddReminderModal.jsx';
import ItemActionModal from './components/ItemActionModal.jsx';
import ShareStoryModal from './components/ShareStoryModal.jsx';
import TutorialOverlay from './components/TutorialOverlay.jsx';
import { callEndpoint, hapticSuccess, hapticError } from './api.js';
import { I18nProvider, STRINGS } from './lib/i18n.jsx';
import { ThemeProvider } from './lib/theme.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [appState, setAppState] = useState(() => {
    const initialLang = typeof window !== 'undefined'
      ? localStorage.getItem('remnoten_lang') ||
        (window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code?.startsWith('fa') ? 'fa' : 'en')
      : 'en';
    return {
      user: null,
      lang: initialLang,
      streak: 0,
      weekDays: [],
      habits: [],
      todos: [],
      reminders: [],
    };
  });

  // Navigation states
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [showAddHabit, setShowAddHabit] = useState(false);

  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);

  const [reminderToEdit, setReminderToEdit] = useState(null);
  const [showAddReminder, setShowAddReminder] = useState(false);

  // Telegram Story & Status sharing config { open: boolean, habit: null | object }
  const [shareModalConfig, setShareModalConfig] = useState({ open: false, habit: null });

  // Long-press item action target { type: 'habit'|'task'|'reminder', item }
  const [actionTarget, setActionTarget] = useState(null);

  // Tutorial walkthrough overlay for new users
  const [showTutorial, setShowTutorial] = useState(false);

  // Auto-show tutorial overlay for fresh users who haven't completed it yet
  useEffect(() => {
    try {
      const isCompleted = localStorage.getItem('remnoten_tutorial_completed');
      if (!isCompleted) {
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 400);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadAppState();

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadAppState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close any open drawers or subviews when switching tabs
  useEffect(() => {
    setShowAddHabit(false);
    setHabitToEdit(null);
    setShowAddTask(false);
    setTaskToEdit(null);
    setShowAddReminder(false);
    setReminderToEdit(null);
    setSelectedHabit(null);
    setActionTarget(null);
    setShareModalConfig({ open: false, habit: null });
  }, [activeTab]);

  const loadAppState = () => {
    callEndpoint('getAppState')
      .then((data) => {
        if (data.ok) {
          // Server language is authoritative (e.g. changed via Telegram bot commands/menus)
          const savedLang = typeof window !== 'undefined' ? localStorage.getItem('remnoten_lang') : null;
          const effectiveLang = (data.lang && STRINGS[data.lang])
            ? data.lang
            : (savedLang && STRINGS[savedLang] ? savedLang : (data.user?.language_code?.startsWith('fa') ? 'fa' : 'en'));

          try {
            localStorage.setItem('remnoten_lang', effectiveLang);
          } catch (_) {}

          setAppState((prev) => ({
            ...prev,
            user: data.user,
            lang: effectiveLang,
            streak: data.streak ?? 0,
            weekDays: data.weekDays ?? [],
            habits: data.habits ?? [],
            todos: data.todos ?? [],
            reminders: data.reminders ?? [],
          }));
        }
      })
      .catch((err) => {
        console.error('Failed to load app state:', err);
      });
  };

  const handleLanguageChange = (newLang) => {
    setAppState((prev) => ({ ...prev, lang: newLang }));
    callEndpoint('setLanguage', { lang: newLang }).catch((err) => {
      console.warn('Failed to sync language to server:', err);
    });
  };

  // Telegram native BackButton integration
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton) return;

    const hasSubview = selectedHabit || showAddTask || showAddHabit || showAddReminder || actionTarget;

    if (hasSubview) {
      tg.BackButton.show();
      const handleBack = () => {
        if (actionTarget) {
          setActionTarget(null);
        } else if (showAddHabit) {
          setShowAddHabit(false);
          setHabitToEdit(null);
        } else if (showAddTask) {
          setShowAddTask(false);
          setTaskToEdit(null);
        } else if (showAddReminder) {
          setShowAddReminder(false);
          setReminderToEdit(null);
        } else if (selectedHabit) {
          setSelectedHabit(null);
        }
      };
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    } else {
      tg.BackButton.hide();
    }
  }, [selectedHabit, showAddTask, showAddHabit, showAddReminder, actionTarget]);

  // ─── Habit Actions ────────────────────────────────────────────────────────────

  const handleToggleHabit = async (habitId, day) => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const targetDay = day || localToday;
    const isTargetingToday = targetDay === localToday;

    setAppState((prev) => {
      const updated = prev.habits.map((h) => {
        if (h.id === habitId) {
          const nextDone = isTargetingToday ? !h.isDoneToday : h.isDoneToday;
          const currentDays = h.completedDays || [];
          const wasDoneOnTarget = currentDays.includes(targetDay);
          const nextDays = wasDoneOnTarget
            ? currentDays.filter((d) => d !== targetDay)
            : [...currentDays, targetDay];

          return {
            ...h,
            ...(isTargetingToday
              ? {
                  isDoneToday: nextDone,
                  streak: Math.max(0, h.streak + (nextDone ? 1 : -1)),
                }
              : {}),
            completedDays: nextDays,
          };
        }
        return h;
      });
      return { ...prev, habits: updated };
    });

    setSelectedHabit((prev) => {
      if (!prev || prev.id !== habitId) return prev;
      const nextDone = isTargetingToday ? !prev.isDoneToday : prev.isDoneToday;
      const currentDays = prev.completedDays || [];
      const wasDoneOnTarget = currentDays.includes(targetDay);
      const nextDays = wasDoneOnTarget
        ? currentDays.filter((d) => d !== targetDay)
        : [...currentDays, targetDay];
      return {
        ...prev,
        ...(isTargetingToday
          ? {
              isDoneToday: nextDone,
              streak: Math.max(0, prev.streak + (nextDone ? 1 : -1)),
            }
          : {}),
        completedDays: nextDays,
      };
    });

    try {
      const clientTzOffset = -new Date().getTimezoneOffset();
      const res = await callEndpoint('toggleCheckin', { habitId, day: targetDay, clientTzOffset });
      if (res.ok) {
        const effectiveDoneToday = res.isDoneToday ?? (isTargetingToday ? res.isDone : undefined);
        setAppState((prev) => ({
          ...prev,
          streak: res.overallStreak ?? prev.streak,
          weekDays: res.weekDays ?? prev.weekDays,
          habits: prev.habits.map((h) => {
            if (h.id !== habitId) return h;
            const currentDays = h.completedDays || [];
            let nextDays = currentDays;
            if (res.completedDays) {
              nextDays = res.completedDays;
            } else if (res.isDone !== undefined) {
              if (res.isDone && !currentDays.includes(targetDay)) {
                nextDays = [...currentDays, targetDay];
              } else if (!res.isDone && currentDays.includes(targetDay)) {
                nextDays = currentDays.filter((d) => d !== targetDay);
              }
            }
            return {
              ...h,
              ...(effectiveDoneToday !== undefined ? { isDoneToday: effectiveDoneToday } : {}),
              streak: res.habitStreak ?? h.streak,
              completedDays: nextDays,
            };
          }),
        }));

        setSelectedHabit((prev) => {
          if (!prev || prev.id !== habitId) return prev;
          const currentDays = prev.completedDays || [];
          let nextDays = currentDays;
          if (res.completedDays) {
            nextDays = res.completedDays;
          } else if (res.isDone !== undefined) {
            if (res.isDone && !currentDays.includes(targetDay)) {
              nextDays = [...currentDays, targetDay];
            } else if (!res.isDone && currentDays.includes(targetDay)) {
              nextDays = currentDays.filter((d) => d !== targetDay);
            }
          }
          return {
            ...prev,
            ...(effectiveDoneToday !== undefined ? { isDoneToday: effectiveDoneToday } : {}),
            streak: res.habitStreak ?? prev.streak,
            completedDays: nextDays,
          };
        });
      }
    } catch (err) {
      hapticError();
      loadAppState();
    }
  };

  const handleSaveHabit = async (habitData) => {
    try {
      const res = await callEndpoint('saveHabit', habitData);
      if (res.ok && res.habit) {
        hapticSuccess();
        setAppState((prev) => {
          const exists = prev.habits.some((h) => h.id === res.habit.id);
          const habits = exists
            ? prev.habits.map((h) => (h.id === res.habit.id ? { ...h, ...res.habit } : h))
            : [...prev.habits, res.habit];
          return { ...prev, habits };
        });
        if (selectedHabit && selectedHabit.id === res.habit.id) {
          setSelectedHabit((prev) => ({ ...prev, ...res.habit }));
        }
      }
    } catch (err) {
      hapticError();
    } finally {
      setShowAddHabit(false);
      setHabitToEdit(null);
    }
  };

  const getConfirmText = (key, fallback) => {
    const l = appState.lang || 'en';
    return STRINGS[l]?.[key] || STRINGS.en?.[key] || fallback;
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm(getConfirmText('confirm_delete_habit', 'Delete this habit?'))) return;
    try {
      const res = await callEndpoint('deleteHabit', { id: habitId });
      if (res.ok) {
        hapticSuccess();
        setAppState((prev) => ({
          ...prev,
          habits: prev.habits.filter((h) => h.id !== habitId),
          streak: res.overallStreak ?? prev.streak,
          weekDays: res.weekDays ?? prev.weekDays,
        }));
        setSelectedHabit(null);
      }
    } catch (err) {
      hapticError();
    }
  };

  // ─── Task Actions ─────────────────────────────────────────────────────────────

  const handleToggleTodo = async (todoId) => {
    setAppState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === todoId ? { ...t, done: !t.done } : t)),
    }));

    try {
      const res = await callEndpoint('toggleTodo', { id: todoId });
      if (res.ok) {
        setAppState((prev) => ({
          ...prev,
          todos: prev.todos.map((t) => (t.id === todoId ? { ...t, done: res.done } : t)),
        }));
      }
    } catch (err) {
      hapticError();
      loadAppState();
    }
  };

  const handleSaveTodo = async (todoData) => {
    try {
      const res = await callEndpoint('saveTodo', todoData);
      if (res.ok && res.todo) {
        hapticSuccess();
        setAppState((prev) => {
          const exists = prev.todos.some((t) => t.id === res.todo.id);
          const todos = exists
            ? prev.todos.map((t) => (t.id === res.todo.id ? res.todo : t))
            : [res.todo, ...prev.todos];
          return { ...prev, todos };
        });
      }
    } catch (err) {
      hapticError();
    } finally {
      setShowAddTask(false);
      setTaskToEdit(null);
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm(getConfirmText('confirm_delete_task', 'Delete this task?'))) return;
    try {
      const res = await callEndpoint('deleteTodo', { id: todoId });
      if (res.ok) {
        hapticSuccess();
        setAppState((prev) => ({
          ...prev,
          todos: prev.todos.filter((t) => t.id !== todoId),
        }));
      }
    } catch (err) {
      hapticError();
    } finally {
      setShowAddTask(false);
      setTaskToEdit(null);
    }
  };

  // ─── Reminder Actions ─────────────────────────────────────────────────────────

  const handleToggleReminder = async (reminderId, enabled) => {
    setAppState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === reminderId ? { ...r, enabled } : r
      ),
    }));

    try {
      const res = await callEndpoint('toggleReminder', { id: reminderId, enabled });
      if (res.ok) {
        setAppState((prev) => ({
          ...prev,
          reminders: res.deleted
            ? prev.reminders.filter((r) => r.id !== reminderId)
            : prev.reminders.map((r) =>
                r.id === reminderId ? { ...r, enabled: res.enabled } : r
              ),
        }));
      }
    } catch (err) {
      hapticError();
      loadAppState();
    }
  };

  const handleSaveReminder = async (reminderData) => {
    try {
      const res = await callEndpoint('saveReminder', reminderData);
      if (res.ok && res.reminder) {
        hapticSuccess();
        setAppState((prev) => {
          const exists = prev.reminders.some((r) => r.id === res.reminder.id);
          const reminders = exists
            ? prev.reminders.map((r) => (r.id === res.reminder.id ? res.reminder : r))
            : [...prev.reminders, res.reminder];
          return { ...prev, reminders };
        });
      }
    } catch (err) {
      hapticError();
    } finally {
      setShowAddReminder(false);
      setReminderToEdit(null);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm(getConfirmText('confirm_delete_reminder', 'Delete this reminder?'))) return;
    try {
      const res = await callEndpoint('deleteReminder', { id: reminderId });
      if (res.ok) {
        hapticSuccess();
        setAppState((prev) => ({
          ...prev,
          reminders: prev.reminders.filter((r) => r.id !== reminderId),
        }));
      }
    } catch (err) {
      hapticError();
    } finally {
      setShowAddReminder(false);
      setReminderToEdit(null);
    }
  };

  // Render Application Layout
  return (
    <I18nProvider lang={appState.lang} onLangChange={handleLanguageChange}>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen relative text-white bg-black">
          {selectedHabit ? (
            <HabitDetailScreen
              habit={selectedHabit}
              onBack={() => setSelectedHabit(null)}
              onToggleCheckin={handleToggleHabit}
              onEditHabit={(h) => {
                setHabitToEdit(h);
                setShowAddHabit(true);
              }}
              onOpenShareModal={(h) => setShareModalConfig({ open: true, habit: h || selectedHabit })}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  state={appState}
                  onToggleHabit={handleToggleHabit}
                  onOpenHabitDetail={(habit) => setSelectedHabit(habit)}
                  onOpenAddHabit={() => {
                    setHabitToEdit(null);
                    setShowAddHabit(true);
                  }}
                  onToggleTodo={handleToggleTodo}
                  onOpenAddTask={() => {
                    setTaskToEdit(null);
                    setShowAddTask(true);
                  }}
                  onEditTodo={(task) => {
                    setTaskToEdit(task);
                    setShowAddTask(true);
                  }}
                  onToggleReminder={handleToggleReminder}
                  onOpenAddReminder={() => {
                    setReminderToEdit(null);
                    setShowAddReminder(true);
                  }}
                  onEditReminder={(reminder) => {
                    setReminderToEdit(reminder);
                    setShowAddReminder(true);
                  }}
                  onSelectTab={(tab) => {
                    setActiveTab(tab);
                  }}
                  onItemLongPress={(target) => setActionTarget(target)}
                  onOpenShareModal={(h) => setShareModalConfig({ open: true, habit: h || null })}
                />
              )}

              {activeTab === 'habits' && (
                <HabitsScreen
                  habits={appState.habits}
                  onToggleHabit={handleToggleHabit}
                  onOpenHabitDetail={(habit) => setSelectedHabit(habit)}
                  onOpenAddHabit={() => {
                    setHabitToEdit(null);
                    setShowAddHabit(true);
                  }}
                  onItemLongPress={(target) => setActionTarget(target)}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksScreen
                  todos={appState.todos}
                  onToggleTodo={handleToggleTodo}
                  onOpenAddTask={() => {
                    setTaskToEdit(null);
                    setShowAddTask(true);
                  }}
                  onEditTodo={(task) => {
                    setTaskToEdit(task);
                    setShowAddTask(true);
                  }}
                  onItemLongPress={(target) => setActionTarget(target)}
                />
              )}

              {activeTab === 'reminders' && (
                <RemindersScreen
                  reminders={appState.reminders}
                  onToggleReminder={handleToggleReminder}
                  onOpenAddReminder={() => {
                    setReminderToEdit(null);
                    setShowAddReminder(true);
                  }}
                  onEditReminder={(reminder) => {
                    setReminderToEdit(reminder);
                    setShowAddReminder(true);
                  }}
                  onItemLongPress={(target) => setActionTarget(target)}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsScreen
                  state={appState}
                  onLanguageChange={handleLanguageChange}
                  onOpenTutorial={() => {
                    setActiveTab('home');
                    setSelectedHabit(null);
                    setTimeout(() => {
                      setShowTutorial(true);
                    }, 120);
                  }}
                />
              )}

              {/* Bottom Navigation */}
              <BottomNav
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setSelectedHabit(null);
                  setShowAddTask(false);
                  setTaskToEdit(null);
                  setShowAddHabit(false);
                  setHabitToEdit(null);
                  setShowAddReminder(false);
                  setReminderToEdit(null);
                  setActionTarget(null);
                  setActiveTab(tab);
                }}
              />
            </>
          )}

          {/* Persistent Drawers / Modals (Ensures smooth entrance & exit animations) */}
          <AddHabitModal
            open={showAddHabit}
            initialHabit={habitToEdit}
            onClose={() => {
              setShowAddHabit(false);
              setHabitToEdit(null);
            }}
            onSave={handleSaveHabit}
            onDelete={handleDeleteHabit}
          />

          <AddTaskModal
            open={showAddTask}
            initialTask={taskToEdit}
            onClose={() => {
              setShowAddTask(false);
              setTaskToEdit(null);
            }}
            onSave={handleSaveTodo}
            onDelete={handleDeleteTodo}
          />

          <AddReminderModal
            open={showAddReminder}
            initialReminder={reminderToEdit}
            onClose={() => {
              setShowAddReminder(false);
              setReminderToEdit(null);
            }}
            onSave={handleSaveReminder}
            onDelete={handleDeleteReminder}
          />

          {/* Long-press Action Sheet (Edit & Delete with Smooth Animation) */}
          <ItemActionModal
            target={actionTarget}
            onClose={() => setActionTarget(null)}
            onEdit={(item, type) => {
              setActionTarget(null);
              if (type === 'habit') {
                setHabitToEdit(item);
                setShowAddHabit(true);
              } else if (type === 'task') {
                setTaskToEdit(item);
                setShowAddTask(true);
              } else if (type === 'reminder') {
                setReminderToEdit(item);
                setShowAddReminder(true);
              }
            }}
            onDelete={(item, type) => {
              setActionTarget(null);
              if (type === 'habit') {
                handleDeleteHabit(item.id);
              } else if (type === 'task') {
                handleDeleteTodo(item.id);
              } else if (type === 'reminder') {
                handleDeleteReminder(item.id);
              }
            }}
          />
          {/* Telegram Story & Status Sharing Modal */}
          <ShareStoryModal
            open={shareModalConfig.open}
            habit={shareModalConfig.habit}
            streak={appState.streak}
            user={appState.user}
            habits={appState.habits}
            weekDays={appState.weekDays}
            onClose={() => setShareModalConfig({ open: false, habit: null })}
          />

          {/* New User Tutorial Walkthrough Overlay */}
          <TutorialOverlay
            open={showTutorial}
            activeTab={activeTab}
            onSwitchTab={setActiveTab}
            onClose={() => setShowTutorial(false)}
          />
        </div>
      </ThemeProvider>
    </I18nProvider>
  );
}
