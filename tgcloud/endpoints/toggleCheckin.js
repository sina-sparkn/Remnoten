import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { habits, checkins } from '../schema.js';
import {
  getUserId,
  getUserTzOffset,
  getLocalDateString,
  getHabitStreak,
  getUserOverallStreak,
  getWeekStatus,
} from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const habitId = Number(input?.habitId);
  if (!habitId) {
    throw new EndpointError('Habit ID is required', { code: 'INVALID_HABIT_ID' });
  }

  // Verify ownership
  const habit = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.chatId, chatId)))
    .get();

  if (!habit) {
    throw new EndpointError('Habit not found', { code: 'NOT_FOUND' });
  }

  const dbTzOffset = await getUserTzOffset(chatId);
  const clientTz = typeof input?.clientTzOffset === 'number' ? input.clientTzOffset : null;
  const tzOffset = clientTz ?? dbTzOffset;
  const today = getLocalDateString(tzOffset);
  const targetDay = input?.day || today;

  // Prevent checkin for future days relative to user's local day
  if (targetDay > today) {
    throw new EndpointError('Cannot check in for future days', { code: 'FUTURE_DATE_NOT_ALLOWED' });
  }

  // Check if checkin already exists for this day
  const existing = await db
    .select()
    .from(checkins)
    .where(and(eq(checkins.habitId, habitId), eq(checkins.day, targetDay)))
    .get();

  let isDone = false;
  if (existing) {
    await db.delete(checkins).where(eq(checkins.id, existing.id)).run();
    isDone = false;
  } else {
    await db.insert(checkins).values({ habitId, day: targetDay }).run();
    isDone = true;
  }

  const todayCheckin = targetDay === today
    ? isDone
    : Boolean(await db.select().from(checkins).where(and(eq(checkins.habitId, habitId), eq(checkins.day, today))).get());

  const habitStreak = await getHabitStreak(habitId, tzOffset);
  const overallStreak = await getUserOverallStreak(chatId, tzOffset);
  const weekDays = await getWeekStatus(chatId, tzOffset);

  return {
    ok: true,
    habitId,
    day: targetDay,
    isDone,
    isDoneToday: todayCheckin,
    habitStreak,
    overallStreak,
    weekDays,
  };
}
