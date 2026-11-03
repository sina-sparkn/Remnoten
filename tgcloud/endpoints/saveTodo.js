import { db, EndpointError } from 'sdk';
import { eq, and } from 'sdk/db';
import { todos } from '../schema.js';
import { getUserId, getUserTzOffset } from '../lib/app_helpers.js';

export default async function (input, ctx) {
  const chatId = getUserId(ctx);
  const text = (input?.text || '').trim();
  if (!text) {
    throw new EndpointError('Task text cannot be empty', { code: 'INVALID_TEXT' });
  }

  let dueDate = (input?.dueDate || '').trim();
  const dueDateRaw = input?.dueDateRaw || null;
  const dueTime = input?.dueTime || null;
  let dueTimestamp = input?.dueTimestamp ? Number(input.dueTimestamp) : null;

  // Fallback: If dueTimestamp wasn't provided directly, compute from dueDateRaw and dueTime
  if (!dueTimestamp && dueDateRaw && dueTime) {
    const [y, m, d] = dueDateRaw.split('-').map(Number);
    const [h, min] = dueTime.split(':').map(Number);
    if (!isNaN(y) && !isNaN(h)) {
      const tzOffset = await getUserTzOffset(chatId);
      dueTimestamp = Math.floor((Date.UTC(y, m - 1, d, h, min, 0) - tzOffset * 60 * 1000) / 1000);
    }
  }

  if (!dueDate && dueDateRaw && dueTime) {
    dueDate = `${dueDateRaw} • ${dueTime}`;
  }

  const remindBefore = input?.remindBefore || 'none'; // 'none', 'at_due', '15m', '1h', '4h', '1d', 'custom'
  let remindTimestamp = null;

  if (remindBefore === 'at_due') {
    remindTimestamp = dueTimestamp;
  } else if (remindBefore === '15m') {
    remindTimestamp = dueTimestamp ? dueTimestamp - 15 * 60 : null;
  } else if (remindBefore === '1h') {
    remindTimestamp = dueTimestamp ? dueTimestamp - 60 * 60 : null;
  } else if (remindBefore === '4h') {
    remindTimestamp = dueTimestamp ? dueTimestamp - 4 * 3600 : null;
  } else if (remindBefore === '1d') {
    remindTimestamp = dueTimestamp ? dueTimestamp - 24 * 3600 : null;
  } else if (remindBefore === 'custom') {
    if (input?.remindTimestamp) {
      remindTimestamp = Number(input.remindTimestamp);
    } else if (input?.remindCustomDate && input?.remindCustomTime) {
      const [ry, rm, rd] = input.remindCustomDate.split('-').map(Number);
      const [rh, rmin] = input.remindCustomTime.split(':').map(Number);
      if (!isNaN(ry) && !isNaN(rh)) {
        const tzOffset = await getUserTzOffset(chatId);
        remindTimestamp = Math.floor((Date.UTC(ry, rm - 1, rd, rh, rmin, 0) - tzOffset * 60 * 1000) / 1000);
      }
    }
  }

  // Reminder cannot be set after the task's due date and time
  if (remindTimestamp && dueTimestamp && remindTimestamp > dueTimestamp) {
    remindTimestamp = dueTimestamp;
  }

  const priority = input?.priority || 'Medium';
  const repeat = input?.repeat || 'None';
  const todoId = input?.id ? Number(input.id) : null;
  const nowSec = Math.floor(Date.now() / 1000);

  if (todoId) {
    const existing = await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.chatId, chatId)))
      .get();

    if (!existing) {
      throw new EndpointError('Task not found', { code: 'NOT_FOUND' });
    }

    // Reset reminder flag if future reminder time is set or updated
    const isNewReminder = remindTimestamp && remindTimestamp > nowSec;

    await db
      .update(todos)
      .set({
        text,
        dueDate,
        dueDateRaw,
        dueTime,
        dueTimestamp,
        remindBefore,
        remindTimestamp,
        remindNotified: isNewReminder ? false : (remindBefore === 'none' ? false : existing.remindNotified),
        overdueNotified: false,
        priority,
        repeat,
      })
      .where(eq(todos.id, todoId))
      .run();

    return {
      ok: true,
      todo: {
        id: todoId,
        text,
        done: Boolean(existing.done),
        dueDate,
        dueDateRaw,
        dueTime,
        dueTimestamp,
        remindBefore,
        remindTimestamp,
        remindNotified: isNewReminder ? false : Boolean(existing.remindNotified),
        overdueNotified: false,
        priority,
        repeat,
        created: existing.created,
      },
    };
  }

  const rows = await db
    .insert(todos)
    .values({
      chatId,
      text,
      done: false,
      dueDate,
      dueDateRaw,
      dueTime,
      dueTimestamp,
      remindBefore,
      remindTimestamp,
      remindNotified: false,
      overdueNotified: false,
      priority,
      repeat,
    })
    .returning()
    .run();

  const created = rows[0];

  return {
    ok: true,
    todo: {
      id: created.id,
      text: created.text,
      done: false,
      dueDate: created.dueDate || dueDate,
      dueDateRaw: created.dueDateRaw || dueDateRaw,
      dueTime: created.dueTime || dueTime,
      dueTimestamp: created.dueTimestamp || dueTimestamp,
      remindBefore: created.remindBefore || remindBefore,
      remindTimestamp: created.remindTimestamp || remindTimestamp,
      remindNotified: false,
      overdueNotified: false,
      priority: created.priority || priority,
      repeat: created.repeat || repeat,
      created: created.created,
    },
  };
}
