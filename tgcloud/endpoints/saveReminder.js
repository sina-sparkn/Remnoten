import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { reminders } from '../schema.js';
import { parseTime, nextFireTimestamp } from '../lib/reminders.js';
import { getUserId, getUserTzOffset } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const text = (input?.text || '').trim();
  if (!text) {
    throw new EndpointError('Reminder text cannot be empty', { code: 'INVALID_TEXT' });
  }

  const timeHHMM = (input?.timeHHMM || '').trim();
  const parsed = parseTime(timeHHMM);
  if (!parsed) {
    throw new EndpointError('Invalid time format. Use HH:MM (e.g. 09:30 or 21:00)', {
      code: 'INVALID_TIME',
    });
  }

  const rawRepeatRate = input?.repeatRate;
  let repeatRate = 'daily';
  let repeat = true;

  if (rawRepeatRate) {
    if (rawRepeatRate === 'once' || rawRepeatRate === 'None') {
      repeat = false;
      repeatRate = 'once';
    } else {
      repeat = true;
      repeatRate = ['daily', '2_days', '3_days', 'weekly'].includes(rawRepeatRate) ? rawRepeatRate : 'daily';
    }
  } else if (input?.repeat !== undefined) {
    repeat = Boolean(input.repeat);
    repeatRate = repeat ? 'daily' : 'once';
  }

  const pInput = String(input?.priority || '').toLowerCase();
  const priority = (pInput === 'high' || pInput === 'urgent')
    ? 'High'
    : pInput === 'low'
    ? 'Low'
    : 'Medium';

  const icon = input?.icon || 'bell';
  const reminderId = input?.id ? Number(input.id) : null;
  const tzOffset = await getUserTzOffset(chatId);
  const nextFire = nextFireTimestamp(parsed, tzOffset);

  if (reminderId) {
    const existing = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, reminderId), eq(reminders.chatId, chatId)))
      .get();

    if (!existing) {
      throw new EndpointError('Reminder not found', { code: 'NOT_FOUND' });
    }

    await db
      .update(reminders)
      .set({
        text,
        timeHHMM,
        tzOffset,
        repeat,
        repeatRate,
        priority,
        nextFire,
        fired: false,
        pendingAck: false,
        enabled: true,
        icon,
      })
      .where(eq(reminders.id, reminderId))
      .run();

    return {
      ok: true,
      reminder: {
        id: reminderId,
        text,
        timeHHMM,
        repeat,
        repeatRate,
        priority,
        pendingAck: false,
        enabled: true,
        icon,
        nextFire,
        fired: false,
      },
    };
  }

  const rows = await db
    .insert(reminders)
    .values({
      chatId,
      text,
      timeHHMM,
      tzOffset,
      repeat,
      repeatRate,
      priority,
      nextFire,
      fired: false,
      pendingAck: false,
      enabled: true,
      icon,
    })
    .returning()
    .run();

  const created = rows[0];

  return {
    ok: true,
    reminder: {
      id: created.id,
      text: created.text,
      timeHHMM: created.timeHHMM,
      repeat: Boolean(created.repeat),
      repeatRate: created.repeatRate || repeatRate,
      priority: created.priority || priority,
      pendingAck: false,
      enabled: true,
      icon: created.icon || icon,
      nextFire: created.nextFire,
      fired: false,
    },
  };
}
