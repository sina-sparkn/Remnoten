/**
 * Client API layer for Remnoten Mini App
 * Interfaces with tgcloud serverless endpoints via Telegram.WebApp.Serverless.call
 * Includes local fallback for standalone development/preview.
 */

import {
  playTapSound,
  playToggleSound,
  playCheckSound,
  playUncheckSound,
  playSuccessSound,
  playDeleteSound,
  playErrorSound,
  playTabSound,
  playWheelSound,
  isHapticsEnabled,
} from './lib/sound.js';

const tg = window.Telegram?.WebApp;

// Initialize Telegram WebApp viewport & theme
if (tg) {
  try {
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('#000000');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');
    if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
  } catch (e) {
    console.warn('WebApp initialization warning:', e);
  }
}

// Haptic & Audio Haptic feedback helpers
export function hapticLight() {
  if (isHapticsEnabled()) {
    try {
      tg?.HapticFeedback?.impactOccurred('light');
    } catch {}
  }
  playTapSound();
}

export function hapticMedium() {
  if (isHapticsEnabled()) {
    try {
      tg?.HapticFeedback?.impactOccurred('medium');
    } catch {}
  }
  playToggleSound(true);
}

export function hapticSuccess() {
  if (isHapticsEnabled()) {
    try {
      tg?.HapticFeedback?.notificationOccurred('success');
    } catch {}
  }
  playSuccessSound();
}

export function hapticError() {
  if (isHapticsEnabled()) {
    try {
      tg?.HapticFeedback?.notificationOccurred('error');
    } catch {}
  }
  playErrorSound();
}

export {
  playTapSound,
  playToggleSound,
  playCheckSound,
  playUncheckSound,
  playSuccessSound,
  playDeleteSound,
  playErrorSound,
  playTabSound,
  playWheelSound,
};

function generateMockCompletedDays(streakCount, probability, seed = 1) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < streakCount; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  for (let i = streakCount; i < 365; i++) {
    const pseudo = Math.sin(i * seed * 997 + seed * 101) * 10000;
    const r = pseudo - Math.floor(pseudo);
    if (r < probability) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
  }
  return days;
}

// Mock database for standalone browser testing outside Telegram
const mockState = {
  user: {
    id: 1,
    firstName: 'Alex',
    tzOffset: 0,
    todayStr: new Date().toISOString().slice(0, 10),
  },
  streak: 5,
  weekDays: [
    { dayName: 'Mon', date: '2026-10-26', isToday: true, isPastOrToday: true, completed: true },
    { dayName: 'Tue', date: '2026-10-27', isToday: false, isPastOrToday: false, completed: true },
    { dayName: 'Wed', date: '2026-10-28', isToday: false, isPastOrToday: false, completed: true },
    { dayName: 'Thu', date: '2026-10-29', isToday: false, isPastOrToday: false, completed: true },
    { dayName: 'Fri', date: '2026-10-30', isToday: false, isPastOrToday: false, completed: true },
    { dayName: 'Sat', date: '2026-10-31', isToday: false, isPastOrToday: false, completed: false },
    { dayName: 'Sun', date: '2026-11-01', isToday: false, isPastOrToday: false, completed: false },
  ],
  habits: [
    { id: 1, name: 'Workout', icon: 'dumbbell', target: 1, unit: '', frequency: 'Daily', isDoneToday: true, streak: 5, completedDays: generateMockCompletedDays(5, 0.65, 1) },
    { id: 2, name: 'Read', icon: 'book', target: 1, unit: '', frequency: 'Daily', isDoneToday: true, streak: 8, completedDays: generateMockCompletedDays(8, 0.75, 2) },
    { id: 3, name: 'Drink Water', icon: 'water', target: 8, unit: 'glasses', frequency: 'Daily', isDoneToday: true, streak: 12, completedDays: generateMockCompletedDays(12, 0.85, 3) },
    { id: 4, name: 'Meditate', icon: 'meditate', target: 1, unit: '', frequency: 'Daily', isDoneToday: false, streak: 3, completedDays: generateMockCompletedDays(3, 0.45, 4) },
    { id: 5, name: 'No Social Media', icon: 'nosocial', target: 1, unit: '', frequency: 'Daily', isDoneToday: false, streak: 1, completedDays: generateMockCompletedDays(1, 0.50, 5) },
  ],
  todos: [
    { id: 101, text: 'Finish project proposal', done: false, dueDate: 'Today, 10:00' },
    { id: 102, text: 'Buy groceries', done: false, dueDate: 'Today, 14:00' },
    { id: 103, text: 'Reply to emails', done: false, dueDate: 'Today, 16:00' },
    { id: 104, text: 'Plan tomorrow', done: false, dueDate: 'Today, 20:00' },
    { id: 105, text: 'Read a book', done: true, dueDate: 'Today, 21:00' },
  ],
  reminders: [
    { id: 201, text: 'Workout', timeHHMM: '07:00', repeat: true, enabled: true, icon: 'dumbbell' },
    { id: 202, text: 'Read', timeHHMM: '21:00', repeat: true, enabled: true, icon: 'book' },
    { id: 203, text: 'Drink Water', timeHHMM: '11:00', repeat: true, enabled: true, icon: 'water' },
    { id: 204, text: 'Meditate', timeHHMM: '20:00', repeat: true, enabled: true, icon: 'meditate' },
    { id: 205, text: 'No Social Media', timeHHMM: '21:00', repeat: true, enabled: true, icon: 'nosocial' },
  ],
};

/**
 * Universal call method for Telegram Serverless endpoint
 */
export function callEndpoint(endpoint, input = {}) {
  return new Promise((resolve, reject) => {
    // 1. If running inside Telegram with Serverless SDK
    if (tg?.Serverless?.call) {
      tg.Serverless.call(endpoint, input, (err, result) => {
        if (err) {
          console.error(`[API Error ${endpoint}]:`, err);
          return reject(err);
        }
        resolve(result);
      });
      return;
    }

    // 2. Direct fetch fallback for web preview if server is responding
    fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.description || `HTTP ${res.status}`);
        }
        const data = await res.json();
        resolve(data.result || data);
      })
      .catch(() => {
        // 3. Fallback to rich mock data in offline / dev standalone mode
        console.warn(`[Mock fallback for ${endpoint}]`, input);
        resolve(handleMockEndpoint(endpoint, input));
      });
  });
}

function handleMockEndpoint(endpoint, input) {
  switch (endpoint) {
    case 'getAppState':
      return { ok: true, ...mockState };

    case 'toggleCheckin': {
      const h = mockState.habits.find(x => x.id === Number(input.habitId));
      const targetDay = input.day || new Date().toISOString().slice(0, 10);
      let isDone = true;
      if (h) {
        if (!h.completedDays) h.completedDays = [];
        const isTodayTarget = targetDay === new Date().toISOString().slice(0, 10);
        if (h.completedDays.includes(targetDay)) {
          h.completedDays = h.completedDays.filter(d => d !== targetDay);
          isDone = false;
        } else {
          h.completedDays.push(targetDay);
          isDone = true;
        }
        if (isTodayTarget) {
          h.isDoneToday = isDone;
          h.streak += isDone ? 1 : -1;
        }
      }
      return {
        ok: true,
        habitId: input.habitId,
        day: targetDay,
        isDone,
        isDoneToday: h ? h.isDoneToday : isDone,
        habitStreak: h ? h.streak : 1,
        completedDays: h ? h.completedDays : [],
        overallStreak: mockState.streak,
        weekDays: mockState.weekDays,
      };
    }

    case 'saveHabit': {
      if (input.id) {
        const idx = mockState.habits.findIndex(x => x.id === Number(input.id));
        if (idx !== -1) {
          mockState.habits[idx] = { ...mockState.habits[idx], ...input };
          return { ok: true, habit: mockState.habits[idx] };
        }
      }
      const newHabit = {
        id: Date.now(),
        name: input.name,
        icon: input.icon || 'dumbbell',
        target: input.target || 1,
        unit: input.unit || '',
        frequency: input.frequency || 'Daily',
        isDoneToday: false,
        streak: 0,
      };
      mockState.habits.push(newHabit);
      return { ok: true, habit: newHabit };
    }

    case 'deleteHabit': {
      mockState.habits = mockState.habits.filter(x => x.id !== Number(input.id));
      return { ok: true, deletedId: input.id, overallStreak: mockState.streak, weekDays: mockState.weekDays };
    }

    case 'getHabitHistory': {
      const h = mockState.habits.find(x => x.id === Number(input.habitId));
      // Generate some mockup dates matching design (1,2,3,4,5,7,8,9,10,11,14,15 of April 2025)
      const days = [
        '2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-05',
        '2025-04-07', '2025-04-08', '2025-04-09', '2025-04-10', '2025-04-11',
        '2025-04-14', '2025-04-15'
      ];
      return {
        ok: true,
        habit: h || { id: input.habitId, name: 'Workout', icon: 'dumbbell', streak: 5, totalCheckins: 12 },
        completedDays: days,
      };
    }

    case 'toggleTodo': {
      const t = mockState.todos.find(x => x.id === Number(input.id));
      if (t) {
        t.done = input.done !== undefined ? input.done : !t.done;
      }
      return { ok: true, id: input.id, done: t ? t.done : true };
    }

    case 'saveTodo': {
      if (input.id) {
        const idx = mockState.todos.findIndex(x => x.id === Number(input.id));
        if (idx !== -1) {
          mockState.todos[idx] = { ...mockState.todos[idx], ...input };
          return { ok: true, todo: mockState.todos[idx] };
        }
      }
      const newTodo = {
        id: Date.now(),
        text: input.text,
        done: false,
        dueDate: input.dueDate || 'Today • 10:00',
        dueDateRaw: input.dueDateRaw || null,
        dueTime: input.dueTime || null,
        dueTimestamp: input.dueTimestamp || null,
        remindBefore: input.remindBefore || 'none',
        remindTimestamp: input.remindTimestamp || null,
        remindNotified: false,
        overdueNotified: false,
        created: Math.floor(Date.now() / 1000),
      };
      mockState.todos.unshift(newTodo);
      return { ok: true, todo: newTodo };
    }

    case 'deleteTodo': {
      mockState.todos = mockState.todos.filter(x => x.id !== Number(input.id));
      return { ok: true, deletedId: input.id };
    }

    case 'sendStoryPhoto':
      return { ok: true };

    case 'toggleReminder': {
      const r = mockState.reminders.find(x => x.id === Number(input.id));
      if (r) {
        const isOneTime = !r.repeat || r.repeatRate === 'once';
        const newEnabled = input.enabled !== undefined ? input.enabled : !r.enabled;
        if (!newEnabled && isOneTime) {
          mockState.reminders = mockState.reminders.filter(x => x.id !== Number(input.id));
          return { ok: true, id: input.id, deleted: true, enabled: false };
        }
        r.enabled = newEnabled;
        return { ok: true, id: input.id, enabled: r.enabled };
      }
      return { ok: true, id: input.id, enabled: true };
    }

    case 'saveReminder': {
      if (input.id) {
        const idx = mockState.reminders.findIndex(x => x.id === Number(input.id));
        if (idx !== -1) {
          mockState.reminders[idx] = { ...mockState.reminders[idx], ...input };
          return { ok: true, reminder: mockState.reminders[idx] };
        }
      }
      const newReminder = {
        id: Date.now(),
        text: input.text,
        timeHHMM: input.timeHHMM || '08:00',
        repeat: input.repeat !== undefined ? input.repeat : true,
        enabled: true,
        icon: input.icon || 'bell',
      };
      mockState.reminders.push(newReminder);
      return { ok: true, reminder: newReminder };
    }

    case 'deleteReminder': {
      mockState.reminders = mockState.reminders.filter(x => x.id !== Number(input.id));
      return { ok: true, deletedId: input.id };
    }

    case 'setLanguage': {
      mockState.lang = input?.lang || 'en';
      return { ok: true, lang: mockState.lang };
    }

    default:
      return { ok: true };
  }
}
