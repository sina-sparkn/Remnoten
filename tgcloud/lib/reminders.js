import { api, db } from 'sdk';
import { eq, ne, and, lte, isNotNull, sql } from 'sdk/db';
import { reminders, userSettings, todos } from '../schema.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escape special characters for MarkdownV2 */
export function escMd(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, c => '\\' + c);
}

/** Escape special characters for HTML */
export function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse a "HH:MM" string. Returns { h, m } or null if invalid.
 */
export function parseTime(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

/**
 * Parse a UTC offset string like "+3:30", "-5", "+5:30", "0".
 * Returns offset in minutes or null if invalid.
 */
export function parseOffset(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/^([+-]?)(\d{1,2})(?::(\d{2}))?$/);
  if (!m) return null;
  const sign = m[1] === '-' ? -1 : 1;
  const hours = parseInt(m[2], 10);
  const mins = parseInt(m[3] ?? '0', 10);
  if (hours > 14 || mins > 59) return null;
  return sign * (hours * 60 + mins);
}

/**
 * Given a "HH:MM" local time and UTC offset (minutes), compute the next
 * Unix timestamp (UTC seconds) at which that local time will occur.
 * Accurately schedules today if upcoming or within the current minute.
 */
export function nextFireTimestamp(hhmm, tzOffsetMinutes, forceTomorrow = false) {
  const { h, m } = hhmm;
  const now = Math.floor(Date.now() / 1000); // current unix seconds

  // Local now according to the offset
  const localNowMs = Date.now() + tzOffsetMinutes * 60 * 1000;
  const localNow = new Date(localNowMs);

  // Midnight of local "today" in UTC seconds
  const localMidnightMs =
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate());
  const localMidnightUtc = localMidnightMs / 1000;

  // Fire time in UTC = local midnight (UTC) + (h*60+m)*60 - tzOffset*60
  let fire = localMidnightUtc + (h * 60 + m) * 60 - tzOffsetMinutes * 60;

  if (forceTomorrow) {
    fire += 86400;
  } else if (fire < now - 60) {
    // If this time passed earlier today by more than a minute, schedule for tomorrow
    fire += 86400;
  } else if (fire < now) {
    // If within the current minute (e.g. 10s past the minute), fire in 5 seconds
    fire = now + 5;
  }
  return fire;
}

/**
 * Create a new reminder record.
 */
export async function createReminder({
  chatId,
  text,
  timeHHMM,
  tzOffset,
  repeat,
  repeatRate = 'daily',
  priority = 'Medium',
  nextFire,
  icon = 'bell',
}) {
  const isRepeat = repeatRate && repeatRate !== 'once' ? true : Boolean(repeat);
  const rows = await db.insert(reminders).values({
    chatId,
    text,
    timeHHMM,
    tzOffset,
    repeat: isRepeat,
    repeatRate: isRepeat ? (repeatRate || 'daily') : 'once',
    priority: priority || 'Medium',
    nextFire,
    fired: false,
    enabled: true,
    icon,
  }).returning().run();
  return rows[0];
}

/**
 * Interval in seconds before reminding again if the user did not click any button.
 * High = 10 min (600s), Medium = 30 min (1800s), Low = 1 hour (3600s).
 */
export function getPriorityNagInterval(priority) {
  const p = String(priority || '').toLowerCase();
  if (p === 'high' || p === 'urgent') return 10 * 60; // 10 minutes
  if (p === 'low') return 60 * 60;                    // 1 hour
  return 30 * 60;                                     // Medium: 30 minutes
}

/**
 * Compute the next regular fire timestamp (UTC seconds) for a repeating reminder.
 */
export function calcNextRegularFire(r) {
  const parsed = parseTime(r.timeHHMM);
  if (!parsed) return Math.floor(Date.now() / 1000) + 86400;

  // Compute the regular timestamp for tomorrow at timeHHMM
  let baseNext = nextFireTimestamp(parsed, r.tzOffset, true);

  let stepDays = 1;
  if (r.repeatRate === '2_days') stepDays = 2;
  else if (r.repeatRate === '3_days') stepDays = 3;
  else if (r.repeatRate === 'weekly') stepDays = 7;

  if (stepDays > 1) {
    baseNext += (stepDays - 1) * 86400;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  while (baseNext <= nowSec) {
    baseNext += stepDays * 86400;
  }
  return baseNext;
}

/**
 * Acknowledge a reminder when user clicks "Got it" or converts to to-do.
 * Stops nagging and reschedules repeating reminders or marks one-time as completed.
 */
export async function acknowledgeReminder(reminderId, chatId) {
  const r = await db.select().from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.chatId, chatId)))
    .get();

  if (!r) return null;

  const isRepeating = Boolean(r.repeat) || (r.repeatRate && r.repeatRate !== 'once');

  if (isRepeating) {
    const next = calcNextRegularFire(r);
    await db.update(reminders).set({
      repeat: true,
      repeatRate: r.repeatRate && r.repeatRate !== 'once' ? r.repeatRate : 'daily',
      pendingAck: false,
      nextFire: next,
      fired: false,
      lastMsgId: null,
    }).where(eq(reminders.id, reminderId)).run();
    return { status: 'rescheduled', nextFire: next };
  } else {
    // One-time reminder: delete completely from database upon acknowledgement
    await db.delete(reminders).where(eq(reminders.id, reminderId)).run();
    return { status: 'deleted' };
  }
}

/**
 * Snooze a reminder by specified minutes from now.
 */
export async function snoozeReminder(reminderId, chatId, minutes = 15) {
  const nowSec = Math.floor(Date.now() / 1000);
  const nextFire = nowSec + minutes * 60;
  await db.update(reminders).set({
    nextFire,
    fired: false,
    enabled: true,
    pendingAck: false,
    lastMsgId: null,
  }).where(and(eq(reminders.id, reminderId), eq(reminders.chatId, chatId))).run();
  return nextFire;
}

/**
 * Fire all due reminders for everyone.
 */
export async function fireDueReminders() {
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Auto-heal any repeating reminders that were mistakenly left in fired=true or with ancient nextFire
  try {
    const stuckRepeating = await db.select().from(reminders)
      .where(and(
        sql`(${reminders.repeat} = 1 OR ${reminders.repeat} = true OR (${reminders.repeatRate} IS NOT NULL AND ${reminders.repeatRate} != 'once'))`,
        sql`(${reminders.fired} = 1 OR ${reminders.fired} = true OR ${reminders.nextFire} < ${nowSec - 86400} OR (${reminders.pendingAck} = 1 AND ${reminders.nextFire} < ${nowSec - 7200}))`
      ))
      .all();

    for (const sr of stuckRepeating) {
      const next = calcNextRegularFire(sr);
      await db.update(reminders).set({
        repeat: true,
        repeatRate: sr.repeatRate && sr.repeatRate !== 'once' ? sr.repeatRate : 'daily',
        fired: false,
        pendingAck: false,
        lastMsgId: null,
        nextFire: next,
      }).where(eq(reminders.id, sr.id)).run();
      console.log(`[reminders] Auto-healed stuck repeating reminder ${sr.id} for chat ${sr.chatId}, nextFire: ${next}`);
    }
  } catch (err) {
    console.warn('[reminders] Auto-heal check notice:', err?.message || err);
  }

  // 2. Fetch all non-fired, enabled reminders whose nextFire is due
  const due = await db.select().from(reminders)
    .where(and(
      sql`(${reminders.fired} IS NULL OR ${reminders.fired} = 0 OR ${reminders.fired} = false)`,
      sql`(${reminders.enabled} IS NULL OR ${reminders.enabled} = 1 OR ${reminders.enabled} = true)`,
      lte(reminders.nextFire, nowSec)
    ))
    .all();

  let sentCount = 0;
  for (const r of due) {
    let sentMsg = null;
    try {
      const uSetting = await db.select().from(userSettings).where(eq(userSettings.chatId, r.chatId)).get();
      const lang = uSetting?.lang || 'en';

      const isRepeating = Boolean(r.repeat) || (r.repeatRate && r.repeatRate !== 'once');
      const isNag = Boolean(r.pendingAck);
      const priority = r.priority || 'Medium';
      const pLower = String(priority).toLowerCase();

      // If user ignored the previous reminder notification, delete the old message first
      if (isNag && r.lastMsgId) {
        try {
          await api.deleteMessage({ chat_id: r.chatId, message_id: r.lastMsgId });
        } catch {
          // Message may have already been deleted or expired — safely ignore
        }
      }

      let priorityTag = '';
      if (pLower === 'high' || pLower === 'urgent') {
        priorityTag = lang === 'fa' ? '🔴 اولویت بالا' : lang === 'ru' ? '🔴 Высокий приоритет' : '🔴 High priority';
      } else if (pLower === 'low') {
        priorityTag = lang === 'fa' ? '🔵 اولویت کم' : lang === 'ru' ? '🔵 Низкий приоритет' : '🔵 Low priority';
      } else {
        priorityTag = lang === 'fa' ? '🟡 اولویت متوسط' : lang === 'ru' ? '🟡 Средний приоритет' : '🟡 Medium priority';
      }

      let repeatLabel = '';
      if (isRepeating) {
        if (r.repeatRate === '2_days') {
          repeatLabel = lang === 'fa' ? '🔁 هر ۲ روز یکبار' : lang === 'ru' ? '🔁 Каждые 2 дня' : '🔁 Every 2 days';
        } else if (r.repeatRate === '3_days') {
          repeatLabel = lang === 'fa' ? '🔁 هر ۳ روز یکبار' : lang === 'ru' ? '🔁 Каждые 3 дня' : '🔁 Every 3 days';
        } else if (r.repeatRate === 'weekly') {
          repeatLabel = lang === 'fa' ? '🔁 یادآور هفتگی' : lang === 'ru' ? '🔁 Еженедельное напоминание' : '🔁 Weekly reminder';
        } else {
          repeatLabel = lang === 'fa' ? '🔁 یادآور روزانه' : lang === 'ru' ? '🔁 Ежедневное напоминание' : '🔁 Daily reminder';
        }
      } else {
        repeatLabel = lang === 'fa' ? '⏰ یادآوری' : lang === 'ru' ? '⏰ Напоминание' : '⏰ Reminder';
      }

      const isRtl = lang === 'fa' || /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(r.text);
      const rlm = isRtl ? '\u200F' : '';

      let headerText = '';
      if (isNag) {
        const nagIntervalMins = Math.round(getPriorityNagInterval(priority) / 60);
        if (lang === 'fa') {
          const intervalText = nagIntervalMins >= 60 ? '۱ ساعت' : `${nagIntervalMins} دقیقه`;
          headerText = `\u200F⚠️ <b>یادآوری مجدد (${priorityTag})</b>\n\u200F<i>لطفاً دکمه زیر را برای تأیید بزنید (هر ${intervalText} تکرار می‌شود)</i>`;
        } else if (lang === 'ru') {
          const intervalText = nagIntervalMins >= 60 ? '1 час' : `${nagIntervalMins} мин`;
          headerText = `⚠️ <b>Повторное напоминание (${priorityTag})</b>\n<i>Пожалуйста, подтвердите получение (повтор каждые ${intervalText})</i>`;
        } else {
          const intervalText = nagIntervalMins >= 60 ? '1 hour' : `${nagIntervalMins}m`;
          headerText = `⚠️ <b>Follow-up Reminder (${priorityTag})</b>\n<i>Please tap a button below to confirm (repeats every ${intervalText})</i>`;
        }
      } else {
        headerText = `${rlm}<b>${repeatLabel}</b> • <b>${priorityTag}</b>`;
      }

      const gotItBtn = lang === 'fa' ? '✅ متوجه شدم' : lang === 'ru' ? '✅ Понятно' : '✅ Got it';
      const saveTodo = lang === 'fa' ? '📝 ذخیره در کارها' : lang === 'ru' ? '📝 В задачи' : '📝 Save to To-Dos';

      sentMsg = await api.sendMessage({
        chat_id: r.chatId,
        text:
          `${headerText}\n\n` +
          `${rlm}🔔 <b>${escHtml(r.text)}</b>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: gotItBtn, callback_data: `remind_ack:${r.id}` }],
            [{ text: saveTodo, callback_data: `remind_to_todo:${r.id}` }],
          ],
        },
      });
      sentCount++;
    } catch (err) {
      console.error(`[reminders] Failed to send reminder ${r.id} to chat ${r.chatId}:`, err?.message || err);
      // If user blocked bot (403) or chat not found (400), disable reminder to prevent endless failing retries
      if (err?.code === 403 || err?.code === 400) {
        await db.update(reminders).set({ enabled: false, fired: true }).where(eq(reminders.id, r.id)).run();
      }
    }

    if (sentMsg) {
      const isRepeating = Boolean(r.repeat) || (r.repeatRate && r.repeatRate !== 'once');
      const nagInterval = getPriorityNagInterval(r.priority);
      const nextNag = nowSec + nagInterval;

      if (isRepeating) {
        const nextRegular = calcNextRegularFire(r);
        // After sending, if the nag window has completed (e.g. within 30 min of next regular or after max window),
        // automatically advance to nextRegular so repeating reminders NEVER get lost or stuck!
        const maxNagWindowSec = (String(r.priority).toLowerCase() === 'high' || String(r.priority).toLowerCase() === 'urgent')
          ? 2 * 3600
          : 3 * 3600;
        const nagWindowExceeded = Boolean(r.pendingAck) && (nextNag >= nextRegular - 1800 || (r.nextFire && nowSec - (r.nextFire - nagInterval) >= maxNagWindowSec));

        if (nagWindowExceeded) {
          // Conclude follow-up loop and schedule for tomorrow's regular time
          await db.update(reminders).set({
            repeat: true,
            repeatRate: r.repeatRate && r.repeatRate !== 'once' ? r.repeatRate : 'daily',
            pendingAck: false,
            fired: false,
            lastMsgId: null,
            nextFire: nextRegular,
          }).where(eq(reminders.id, r.id)).run();
          console.log(`[reminders] Repeating reminder ${r.id} auto-advanced to next cycle (${nextRegular})`);
        } else {
          // Schedule next nag follow-up
          await db.update(reminders).set({
            repeat: true,
            repeatRate: r.repeatRate && r.repeatRate !== 'once' ? r.repeatRate : 'daily',
            pendingAck: true,
            nextFire: nextNag,
            lastMsgId: sentMsg.message_id,
          }).where(eq(reminders.id, r.id)).run();
        }
      } else {
        // One-time reminder
        // Allow up to 3 hours of follow-up reminders, then mark completed/fired
        const maxOneTimeWindow = 3 * 3600;
        const oneTimeNagExceeded = Boolean(r.pendingAck) && (r.nextFire && nowSec - (r.nextFire - nagInterval) >= maxOneTimeWindow);

        if (oneTimeNagExceeded) {
          await db.update(reminders).set({
            pendingAck: false,
            fired: true,
            lastMsgId: null,
          }).where(eq(reminders.id, r.id)).run();
        } else {
          await db.update(reminders).set({
            pendingAck: true,
            nextFire: nextNag,
            lastMsgId: sentMsg.message_id,
          }).where(eq(reminders.id, r.id)).run();
        }
      }
    }
  }

  // Also check and notify for any upcoming task reminders
  await fireUpcomingTaskReminders().catch(err => {
    console.error('[reminders] fireUpcomingTaskReminders error:', err?.message || err);
  });

  return sentCount;
}

/**
 * Fire upcoming task reminders for tasks where user selected to be reminded before the due date.
 * (e.g. 4h before, 1 day before, at due time, or custom calendar date & time).
 */
export async function fireUpcomingTaskReminders() {
  const nowSec = Math.floor(Date.now() / 1000);

  // Fetch all tasks where remindTimestamp <= nowSec, not done, and not yet notified
  const tasksToRemind = await db.select().from(todos)
    .where(and(
      sql`(${todos.done} IS NULL OR ${todos.done} = 0 OR ${todos.done} = false)`,
      sql`(${todos.remindNotified} IS NULL OR ${todos.remindNotified} = 0 OR ${todos.remindNotified} = false)`,
      isNotNull(todos.remindTimestamp),
      lte(todos.remindTimestamp, nowSec)
    ))
    .all();

  let sentCount = 0;
  for (const t of tasksToRemind) {
    if (!t.chatId || !t.remindTimestamp) continue;
    try {
      const uSetting = await db.select().from(userSettings).where(eq(userSettings.chatId, t.chatId)).get();
      const lang = uSetting?.lang || 'en';

      // Compute friendly remaining time until task due date
      const diffSec = (t.dueTimestamp || t.remindTimestamp) - nowSec;
      let remainingText = '';
      if (diffSec <= 60) {
        remainingText = lang === 'fa' ? 'اکنون' : lang === 'ru' ? 'сейчас' : 'now';
      } else if (diffSec < 3600) {
        const mins = Math.max(1, Math.round(diffSec / 60));
        remainingText = lang === 'fa' ? `${mins} دقیقه دیگر` : lang === 'ru' ? `через ${mins} мин` : `in ${mins} minutes`;
      } else if (diffSec < 86400) {
        const hrs = Math.max(1, Math.round(diffSec / 3600));
        remainingText = lang === 'fa' ? `${hrs} ساعت دیگر` : lang === 'ru' ? `через ${hrs} ч` : `in ${hrs} hours`;
      } else {
        const days = Math.max(1, Math.round(diffSec / 86400));
        remainingText = lang === 'fa' ? `${days} روز دیگر` : lang === 'ru' ? `через ${days} дн` : `in ${days} days`;
      }

      let textMsg = '';
      let btnDone = '';
      let btnApp = '';

      const dueStr = t.dueDate || (t.dueDateRaw ? `${t.dueDateRaw} • ${t.dueTime || ''}` : '');

      if (lang === 'fa') {
        textMsg =
          `🔔 <b>یادآوری کار در پیش‌رو</b>\n\n` +
          `📌 <b>${escHtml(t.text)}</b>\n\n` +
          (dueStr ? `⏰ <b>سررسید:</b> ${escHtml(dueStr)}\n` : '') +
          `⏳ <b>زمان باقیمانده:</b> ${remainingText}\n\n` +
          `<i>برای تکمیل کار یا مشاهده جزئیات، گزینه‌های زیر را لمس کنید:</i>`;
        btnDone = '✅ انجام شد';
        btnApp = '🚀 باز کردن برنامه';
      } else if (lang === 'ru') {
        textMsg =
          `🔔 <b>Напоминание о задаче</b>\n\n` +
          `📌 <b>${escHtml(t.text)}</b>\n\n` +
          (dueStr ? `⏰ <b>Срок:</b> ${escHtml(dueStr)}\n` : '') +
          `⏳ <b>Осталось времени:</b> ${remainingText}\n\n` +
          `<i>Используйте кнопки ниже для отметки или открытия:</i>`;
        btnDone = '✅ Выполнено';
        btnApp = '🚀 Открыть Mini App';
      } else {
        textMsg =
          `🔔 <b>Upcoming Task Reminder</b>\n\n` +
          `📌 <b>${escHtml(t.text)}</b>\n\n` +
          (dueStr ? `⏰ <b>Due:</b> ${escHtml(dueStr)}\n` : '') +
          `⏳ <b>Time remaining:</b> ${remainingText}\n\n` +
          `<i>Use the buttons below to mark as done or open the app:</i>`;
        btnDone = '✅ Mark as Done';
        btnApp = '🚀 Open Mini App';
      }

      await api.sendMessage({
        chat_id: t.chatId,
        text: textMsg,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: btnDone, callback_data: `todo:${t.id}` },
              { text: btnApp, web_app: { url: 'https://app8837501303.tgcloud.ai' } },
            ],
          ],
        },
      });

      // Mark remindNotified = true so we don't repeat this notification
      await db.update(todos).set({ remindNotified: true }).where(eq(todos.id, t.id)).run();
      sentCount++;
    } catch (err) {
      console.error(`[upcomingTasks] Failed to send task reminder for task ${t.id} to chat ${t.chatId}:`, err?.message || err);
      if (err?.code === 403 || err?.code === 400) {
        await db.update(todos).set({ remindNotified: true }).where(eq(todos.id, t.id)).run();
      }
    }
  }

  return sentCount;
}

/** Stub for backwards compatibility */
export async function fireOverdueTasks() {
  return 0;
}

/**
 * Format a UTC offset in minutes to a human-readable string like "UTC+3:30".
 */
export function fmtOffset(tzOffset) {
  const sign = tzOffset >= 0 ? '+' : '-';
  const abs = Math.abs(tzOffset);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m > 0 ? `UTC${sign}${h}:${String(m).padStart(2, '0')}` : `UTC${sign}${h}`;
}
