import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { habits, checkins } from '../schema.js';
import { getUserId, getUserTzOffset, getUserOverallStreak, getWeekStatus } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const habitId = Number(input?.id);
  if (!habitId) {
    throw new EndpointError('Habit ID is required', { code: 'INVALID_ID' });
  }

  const existing = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.chatId, chatId)))
    .get();

  if (!existing) {
    throw new EndpointError('Habit not found', { code: 'NOT_FOUND' });
  }

  // Delete children checkins first
  await db.delete(checkins).where(eq(checkins.habitId, habitId)).run();
  // Delete habit
  await db.delete(habits).where(eq(habits.id, habitId)).run();

  const tzOffset = await getUserTzOffset(chatId);
  const overallStreak = await getUserOverallStreak(chatId, tzOffset);
  const weekDays = await getWeekStatus(chatId, tzOffset);

  return {
    ok: true,
    deletedId: habitId,
    overallStreak,
    weekDays,
  };
}
