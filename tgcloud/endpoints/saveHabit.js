import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { habits } from '../schema.js';
import { getUserId, getUserTzOffset, getHabitStreak } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const name = (input?.name || '').trim();
  if (!name) {
    throw new EndpointError('Habit name cannot be empty', { code: 'INVALID_NAME' });
  }

  const icon = input?.icon || 'dumbbell';
  const target = Math.max(1, Number(input?.target) || 1);
  const unit = (input?.unit || '').trim();
  const frequency = input?.frequency || 'Daily';
  const habitId = input?.id ? Number(input.id) : null;

  if (habitId) {
    // Update existing
    const existing = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.chatId, chatId)))
      .get();

    if (!existing) {
      throw new EndpointError('Habit not found', { code: 'NOT_FOUND' });
    }

    await db
      .update(habits)
      .set({ name, icon, target, unit, frequency })
      .where(eq(habits.id, habitId))
      .run();

    const tzOffset = await getUserTzOffset(chatId);
    const streak = await getHabitStreak(habitId, tzOffset);

    return {
      ok: true,
      habit: {
        id: habitId,
        name,
        icon,
        target,
        unit,
        frequency,
        streak,
      },
    };
  }

  // Create new
  const rows = await db
    .insert(habits)
    .values({
      chatId,
      name,
      icon,
      target,
      unit,
      frequency,
    })
    .returning()
    .run();

  const created = rows[0];

  return {
    ok: true,
    habit: {
      id: created.id,
      name: created.name,
      icon: created.icon || icon,
      target: created.target || target,
      unit: created.unit || unit,
      frequency: created.frequency || frequency,
      isDoneToday: false,
      streak: 0,
    },
  };
}
