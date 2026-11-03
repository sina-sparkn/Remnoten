import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { reminders } from '../schema.js';
import { getUserId } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const reminderId = Number(input?.id);
  if (!reminderId) {
    throw new EndpointError('Reminder ID is required', { code: 'INVALID_ID' });
  }

  const existing = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.chatId, chatId)))
    .get();

  if (!existing) {
    throw new EndpointError('Reminder not found', { code: 'NOT_FOUND' });
  }

  await db.delete(reminders).where(eq(reminders.id, reminderId)).run();

  return {
    ok: true,
    deletedId: reminderId,
  };
}
