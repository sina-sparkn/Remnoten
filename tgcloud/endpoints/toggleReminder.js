import { api, db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { reminders } from '../schema.js';
import { parseTime, nextFireTimestamp } from '../lib/reminders.js';
import { getUserId, getUserTzOffset } from '../lib/app_helpers.js';

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

  const newEnabled = input?.enabled !== undefined ? Boolean(input.enabled) : existing.enabled === false;
  const isRepeating = Boolean(existing.repeat) || (existing.repeatRate && existing.repeatRate !== 'once');
  const isOneTime = !isRepeating;

  if (!newEnabled && isOneTime) {
    if (existing.lastMsgId) {
      try {
        await api.deleteMessage({ chat_id: existing.chatId, message_id: existing.lastMsgId });
      } catch {}
    }
    await db.delete(reminders).where(eq(reminders.id, reminderId)).run();
    return {
      ok: true,
      id: reminderId,
      deleted: true,
      enabled: false,
    };
  }

  const updateFields = {
    enabled: newEnabled,
  };

  if (newEnabled) {
    // Recalculate next fire time
    const tzOffset = await getUserTzOffset(chatId);
    const parsed = parseTime(existing.timeHHMM);
    if (parsed) {
      updateFields.nextFire = nextFireTimestamp(parsed, tzOffset);
      updateFields.fired = false;
      updateFields.pendingAck = false;
    }
  }

  await db
    .update(reminders)
    .set(updateFields)
    .where(eq(reminders.id, reminderId))
    .run();

  return {
    ok: true,
    id: reminderId,
    enabled: newEnabled,
  };
}
