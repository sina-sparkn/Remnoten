import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { habits, checkins } from '../schema.js';
import { getUserId, getUserTzOffset, getHabitStreak } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const habitId = Number(input?.habitId);
  if (!habitId) {
    throw new EndpointError('Habit ID is required', { code: 'INVALID_HABIT_ID' });
  }

  // Verify habit ownership
  const habit = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.chatId, chatId)))
    .get();

  if (!habit) {
    throw new EndpointError('Habit not found', { code: 'NOT_FOUND' });
  }

  const tzOffset = await getUserTzOffset(chatId);
  const streak = await getHabitStreak(habitId, tzOffset);

  // Fetch all checkins for this habit
  const rows = await db
    .select()
    .from(checkins)
    .where(eq(checkins.habitId, habitId))
    .all();

  const completedDays = rows.map(r => r.day);

  return {
    ok: true,
    habit: {
      id: habit.id,
      name: habit.name,
      icon: habit.icon || 'dumbbell',
      target: habit.target || 1,
      unit: habit.unit || '',
      frequency: habit.frequency || 'Daily',
      streak,
      totalCheckins: completedDays.length,
    },
    completedDays,
  };
}
