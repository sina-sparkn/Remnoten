import { db } from 'sdk';
import { eq, desc, inArray } from 'sdk/db';
import { habits, checkins, todos, reminders, userSettings } from '../schema.js';
import {
  getUserId,
  getUserTzOffset,
  getLocalDateString,
  getHabitStreak,
  getUserOverallStreak,
  getWeekStatus,
} from '../lib/app_helpers.js';
import { fireDueReminders } from '../lib/reminders.js';
import { normalizeLang } from '../lib/i18n.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const tzOffset = await getUserTzOffset(chatId);
  const todayStr = getLocalDateString(tzOffset);

  // Fetch user language from settings or telegram initData
  const userRow = await db.select().from(userSettings).where(eq(userSettings.chatId, chatId)).get();
  const lang = userRow?.lang || normalizeLang(ctx?.initData?.user?.language_code) || 'en';

  // Trigger any due reminders when app is opened (piggyback delivery channel)
  fireDueReminders().catch(() => {});

  // 1. Fetch user habits (clean real data only, NO mock seeding)
  const userHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.chatId, chatId))
    .orderBy(desc(habits.id))
    .all();

  const habitIds = userHabits.map(h => h.id);
  const todayCheckinsSet = new Set();
  const habitStreaks = {};
  const habitCheckinDays = {};

  if (habitIds.length > 0) {
    const allCheckinRows = await db
      .select()
      .from(checkins)
      .where(inArray(checkins.habitId, habitIds))
      .all();

    for (const r of allCheckinRows) {
      if (!habitCheckinDays[r.habitId]) {
        habitCheckinDays[r.habitId] = [];
      }
      habitCheckinDays[r.habitId].push(r.day);
      if (r.day === todayStr) {
        todayCheckinsSet.add(r.habitId);
      }
    }

    for (const h of userHabits) {
      const s = await getHabitStreak(h.id, tzOffset);
      habitStreaks[h.id] = s;
    }
  }

  const enrichedHabits = userHabits.map(h => ({
    id: h.id,
    name: h.name,
    icon: h.icon || 'dumbbell',
    target: h.target || 1,
    unit: h.unit || '',
    frequency: h.frequency || 'Daily',
    isDoneToday: todayCheckinsSet.has(h.id),
    streak: habitStreaks[h.id] || 0,
    completedDays: habitCheckinDays[h.id] || [],
  }));

  // 2. Real overall streak and week days status
  const streak = await getUserOverallStreak(chatId, tzOffset);
  const weekDays = await getWeekStatus(chatId, tzOffset);

  // 3. Fetch user todos (clean real data only, NO mock seeding)
  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.chatId, chatId))
    .orderBy(desc(todos.id))
    .all();

  const formattedTodos = userTodos.map(t => ({
    id: t.id,
    text: t.text,
    done: Boolean(t.done),
    dueDate: t.dueDate || 'Today • 10:00',
    dueDateRaw: t.dueDateRaw,
    dueTime: t.dueTime,
    dueTimestamp: t.dueTimestamp,
    remindBefore: t.remindBefore || 'none',
    remindTimestamp: t.remindTimestamp,
    remindNotified: Boolean(t.remindNotified),
    overdueNotified: Boolean(t.overdueNotified),
    priority: t.priority || 'Medium',
    repeat: t.repeat || 'None',
    created: t.created,
  }));

  // 4. Fetch user reminders (clean real data only, NO mock seeding)
  const userReminders = await db
    .select()
    .from(reminders)
    .where(eq(reminders.chatId, chatId))
    .orderBy(desc(reminders.id))
    .all();

  const formattedReminders = userReminders.map(r => ({
    id: r.id,
    text: r.text,
    timeHHMM: r.timeHHMM || '08:00',
    repeat: Boolean(r.repeat),
    repeatRate: r.repeatRate || (r.repeat ? 'daily' : 'once'),
    priority: r.priority || 'Medium',
    pendingAck: Boolean(r.pendingAck),
    enabled: r.enabled !== false,
    icon: r.icon || 'bell',
    nextFire: r.nextFire,
    fired: Boolean(r.fired),
  }));

  return {
    ok: true,
    user: ctx?.initData?.user || { id: chatId, first_name: 'User' },
    lang,
    streak,
    weekDays,
    habits: enrichedHabits,
    todos: formattedTodos,
    reminders: formattedReminders,
  };
}
