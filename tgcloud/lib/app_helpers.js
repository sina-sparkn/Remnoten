import { db, EndpointError } from 'sdk';
import { eq, and, desc, inArray } from 'sdk/db';
import { habits, checkins, userSettings } from '../schema.js';

export function getUserId(ctx) {
  const user = ctx?.initData?.user;
  if (!user || !user.id) {
    throw new EndpointError('Authentication required. Open this app inside Telegram.', {
      code: 'UNAUTHORIZED',
    });
  }
  return user.id;
}

export async function getUserTzOffset(chatId) {
  const row = await db.select().from(userSettings).where(eq(userSettings.chatId, chatId)).get();
  return row?.tzOffset ?? 0;
}

/**
 * Returns "YYYY-MM-DD" in user's local timezone.
 */
export function getLocalDateString(tzOffsetMinutes = 0, date = new Date()) {
  const localMs = date.getTime() + tzOffsetMinutes * 60 * 1000;
  const d = new Date(localMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Given a local date string "YYYY-MM-DD", returns Date object at local midnight UTC.
 */
function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateStr(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate streak for a single habit.
 */
export async function getHabitStreak(habitId, tzOffsetMinutes = 0) {
  const rows = await db
    .select()
    .from(checkins)
    .where(eq(checkins.habitId, habitId))
    .orderBy(desc(checkins.day))
    .limit(400)
    .all();

  const days = new Set(rows.map(r => r.day));
  const todayStr = getLocalDateString(tzOffsetMinutes);
  let d = parseLocalDate(todayStr);

  // If today isn't checked yet, streak could still be active from yesterday
  if (!days.has(formatDateStr(d))) {
    d.setUTCDate(d.getUTCDate() - 1);
  }

  let count = 0;
  while (days.has(formatDateStr(d))) {
    count++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  return count;
}

/**
 * Calculate overall streak for the user across all habits.
 * A day counts as active if ANY habit was completed on that day.
 */
export async function getUserOverallStreak(chatId, tzOffsetMinutes = 0) {
  const userHabits = await db.select().from(habits).where(eq(habits.chatId, chatId)).all();
  if (!userHabits.length) return 0;

  const habitIds = userHabits.map(h => h.id);
  const rows = await db
    .select()
    .from(checkins)
    .where(inArray(checkins.habitId, habitIds))
    .orderBy(desc(checkins.day))
    .limit(1000)
    .all();

  const days = new Set(rows.map(r => r.day));
  const todayStr = getLocalDateString(tzOffsetMinutes);
  let d = parseLocalDate(todayStr);

  if (!days.has(formatDateStr(d))) {
    d.setUTCDate(d.getUTCDate() - 1);
  }

  let count = 0;
  while (days.has(formatDateStr(d))) {
    count++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  return count;
}

/**
 * Returns the 7 days of the current week (Monday to Sunday)
 * along with their checked status.
 */
export async function getWeekStatus(chatId, tzOffsetMinutes = 0) {
  const todayStr = getLocalDateString(tzOffsetMinutes);
  const today = parseLocalDate(todayStr);

  // Calculate Monday of current week
  // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat
  const dayIndex = (today.getUTCDay() + 6) % 7; // 0=Mon, ..., 6=Sun
  const monday = new Date(today.getTime());
  monday.setUTCDate(monday.getUTCDate() - dayIndex);

  // Get all user habit IDs
  const userHabits = await db.select().from(habits).where(eq(habits.chatId, chatId)).all();
  const habitIds = userHabits.map(h => h.id);

  let checkedDays = new Set();
  if (habitIds.length) {
    const rows = await db
      .select()
      .from(checkins)
      .where(inArray(checkins.habitId, habitIds))
      .all();
    checkedDays = new Set(rows.map(r => r.day));
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const week = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = formatDateStr(d);
    week.push({
      dayName: dayNames[i],
      date: dateStr,
      isToday: dateStr === todayStr,
      isPastOrToday: dateStr <= todayStr,
      completed: checkedDays.has(dateStr),
    });
  }

  return week;
}
