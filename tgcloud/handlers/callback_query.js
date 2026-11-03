import { api, db } from 'sdk';
import { eq, and } from 'sdk/db';
import { todos, habits, checkins, reminders } from '../schema.js';
import {
  todoView,
  habitView,
  statsView,
  helpView,
  mainMenuView,
  languageMenuView,
  reminderListView,
  reminderWizardStep1View,
  reminderWizardStep2View,
  reminderWizardCustomTimeView,
  reminderWizardStep3PriorityView,
  reminderWizardStep4View,
  reminderWizardStep3View,
  timezoneMenuView,
  addTodoWizardView,
  todoCustomPromptView,
  formatTodoSuccess,
  addHabitWizardView,
  habitCustomPromptView,
  formatHabitSuccess,
  todoDetailView,
  habitDetailView,
  reminderDetailView,
  today,
} from '../lib/views.js';
import {
  fireDueReminders,
  parseTime,
  nextFireTimestamp,
  calcNextRegularFire,
  snoozeReminder,
  acknowledgeReminder,
  escMd,
} from '../lib/reminders.js';
import {
  getUserSettings,
  setUserTimezone,
  setUserLanguage,
  setUserState,
  clearUserState,
} from '../lib/settings.js';
import { getLocalHHMM, fmtDuration } from '../lib/reminder_parser.js';
import { t, normalizeLang } from '../lib/i18n.js';

/**
 * Safely render a view in response to a callback query.
 * If the original message was a photo (like the /start welcome screen),
 * delete it and send a new text message since Telegram does not allow
 * editMessageText on media messages.
 */
async function renderView(cb, view) {
  const chatId = cb.message.chat.id;
  const messageId = cb.message.message_id;

  if (cb.message?.photo) {
    try {
      await api.deleteMessage({ chat_id: chatId, message_id: messageId });
    } catch {
      await api.editMessageReplyMarkup({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] },
      }).catch(() => {});
    }
    return api.sendMessage({
      chat_id: chatId,
      text: view.text,
      parse_mode: view.parse_mode,
      reply_markup: view.reply_markup ?? { inline_keyboard: [] },
    });
  }

  return api.editMessageText({
    chat_id: chatId,
    message_id: messageId,
    text: view.text,
    parse_mode: view.parse_mode,
    reply_markup: view.reply_markup ?? { inline_keyboard: [] },
  });
}

export default async function (cb) {
  // ── Fire any pending reminders on every callback (piggyback delivery)
  await fireDueReminders();

  const chatId = cb.message.chat.id;
  const clientLangCode = cb.from?.language_code;
  const settings = await getUserSettings(chatId, clientLangCode);
  const lang = settings.lang || 'en';

  const data = cb.data ?? '';
  const parts = data.split(':');
  const kind = parts[0];

  // ── Navigation menu callbacks ────────────────────────────────────────────────
  if (kind === 'menu') {
    const idStr = parts[1];
    let view;
    if (idStr === 'main')        view = mainMenuView(lang);
    else if (idStr === 'todos')  view = await todoView(chatId, lang);
    else if (idStr === 'habits') view = await habitView(chatId, lang);
    else if (idStr === 'stats')  view = await statsView(chatId, lang);
    else if (idStr === 'help')   view = helpView(lang);
    else if (idStr === 'lang')   view = languageMenuView(lang);
    else if (idStr === 'reminders') {
      await clearUserState(chatId);
      view = await reminderListView(chatId, lang);
    }

    await api.answerCallbackQuery({ callback_query_id: cb.id });
    if (view) {
      await renderView(cb, view);
    }
    return;
  }

  // ── Language selection callback ──────────────────────────────────────────────
  if (kind === 'lang') {
    if (parts[1] === 'set') {
      const newLang = parts[2] || 'en';
      await setUserLanguage(chatId, newLang);
      await api.answerCallbackQuery({
        callback_query_id: cb.id,
        text: t(newLang, 'lang_changed'),
      });
      const view = mainMenuView(newLang);
      return renderView(cb, view);
    }
  }

  // ── Start Reminder Wizard (Step 1) ───────────────────────────────────────────
  if (kind === 'remind' && parts[1] === 'add') {
    await setUserState(chatId, { step: 1 });
    const view = reminderWizardStep1View(lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  // ── Timezone menu from reminders ─────────────────────────────────────────────
  if (kind === 'remind' && parts[1] === 'tz_menu') {
    const view = await timezoneMenuView(chatId, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  // ── Set timezone offset ──────────────────────────────────────────────────────
  if (kind === 'remind' && parts[1] === 'tz_set') {
    const offsetMinutes = parseInt(parts[2], 10);
    await setUserTimezone(chatId, offsetMinutes);
    const updated = await getUserSettings(chatId);
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: `✅ Timezone: ${updated.tzName}`,
    });
    const view = await reminderListView(chatId, lang);
    return renderView(cb, view);
  }

  // ── 4-Step Reminder Wizard Flow (Repeat -> Time -> Priority -> Text) ────────
  if (kind === 'remind_wizard') {
    const subAction = parts[1];

    // Step 1 -> Step 2: User selected repeat rate
    if (subAction === 'rate' || subAction === 'type') {
      const rate = parts[2];
      const repeatRate = rate === 'daily' ? 'daily' : rate === 'once' ? 'once' : rate;
      const repeat = repeatRate !== 'once';
      await setUserState(chatId, { step: 2, repeatRate, repeat });
      const view = reminderWizardStep2View(repeatRate, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Step 2 -> Step 3: Quick timer preset selected (e.g. 15m, 30m, 1h, 2h)
    if (subAction === 'quick') {
      const sec = parseInt(parts[2], 10);
      const nowSec = Math.floor(Date.now() / 1000);
      const nextFire = nowSec + sec;
      const timeHHMM = getLocalHHMM(nextFire, settings.tzOffset);
      const label = fmtDuration(sec);
      const repeatRate = settings.state?.repeatRate || 'once';

      await setUserState(chatId, {
        step: 3,
        repeat: false,
        repeatRate: 'once',
        timeHHMM,
        nextFire,
        label,
        tzOffset: settings.tzOffset,
      });

      const view = reminderWizardStep3PriorityView('once', label, timeHHMM, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Step 2 -> Step 3: Preset time selected (Tonight or Tomorrow)
    if (subAction === 'preset') {
      const preset = parts[2];
      let hhmm, nextFire, label;

      if (preset === 'tonight') {
        hhmm = { h: 21, m: 0 };
        nextFire = nextFireTimestamp(hhmm, settings.tzOffset);
        label = lang === 'fa' ? 'امشب ساعت ۲۱:۰۰' : lang === 'ru' ? 'Сегодня в 21:00' : 'Tonight at 21:00';
      } else {
        hhmm = { h: 9, m: 0 };
        nextFire = nextFireTimestamp(hhmm, settings.tzOffset, true);
        label = lang === 'fa' ? 'فردا ساعت ۰۹:۰۰' : lang === 'ru' ? 'Завтра в 09:00' : 'Tomorrow at 09:00';
      }

      const timeHHMM = `${String(hhmm.h).padStart(2, '0')}:${String(hhmm.m).padStart(2, '0')}`;
      const repeatRate = settings.state?.repeatRate || 'once';

      await setUserState(chatId, {
        step: 3,
        repeat: false,
        repeatRate: 'once',
        timeHHMM,
        nextFire,
        label,
        tzOffset: settings.tzOffset,
      });

      const view = reminderWizardStep3PriorityView('once', label, timeHHMM, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Step 2 -> Step 3: Daily/recurring time preset selected (e.g. 08:00, 12:00, 18:00, 21:00)
    if (subAction === 'daily_time') {
      const hhmmStr = `${parts[2]}:${parts[3]}`;
      const hhmm = parseTime(hhmmStr);
      const nextFire = nextFireTimestamp(hhmm, settings.tzOffset);
      const repeatRate = settings.state?.repeatRate || 'daily';
      const label = lang === 'fa' ? `ساعت ${hhmmStr}` : lang === 'ru' ? `в ${hhmmStr}` : `at ${hhmmStr}`;

      await setUserState(chatId, {
        step: 3,
        repeat: true,
        repeatRate,
        timeHHMM: hhmmStr,
        nextFire,
        label,
        tzOffset: settings.tzOffset,
      });

      const view = reminderWizardStep3PriorityView(repeatRate, label, hhmmStr, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Step 3 -> Step 4: Priority selected (High, Medium, Low)
    if (subAction === 'priority') {
      const priority = parts[2] || 'Medium';
      const repeatRate = settings.state?.repeatRate || 'once';
      const timeHHMM = settings.state?.timeHHMM || '08:00';
      const label = settings.state?.label || '';

      await setUserState(chatId, {
        ...settings.state,
        step: 4,
        priority,
      });

      const view = reminderWizardStep4View(repeatRate, priority, label, timeHHMM, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Step 2: User wants to type a custom time
    if (subAction === 'custom_time') {
      const repeatRate = settings.state?.repeatRate || 'once';
      await setUserState(chatId, { ...settings.state, step: 2, awaitingTime: true });
      const view = reminderWizardCustomTimeView(repeatRate, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Step 2: Back from custom time prompt to presets
    if (subAction === 'back_to_presets') {
      const repeatRate = settings.state?.repeatRate || 'once';
      await setUserState(chatId, { ...settings.state, step: 2, awaitingTime: false });
      const view = reminderWizardStep2View(repeatRate, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Back to Step 2 (from Step 3 Priority)
    if (subAction === 'back_to_step2') {
      const repeatRate = settings.state?.repeatRate || 'once';
      await setUserState(chatId, { ...settings.state, step: 2 });
      const view = reminderWizardStep2View(repeatRate, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Back to Step 3 Priority (from Step 4 Text)
    if (subAction === 'back_to_priority') {
      const repeatRate = settings.state?.repeatRate || 'once';
      const label = settings.state?.label || '';
      const timeHHMM = settings.state?.timeHHMM || '08:00';
      await setUserState(chatId, { ...settings.state, step: 3 });
      const view = reminderWizardStep3PriorityView(repeatRate, label, timeHHMM, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Back to Step 1
    if (subAction === 'step1') {
      await setUserState(chatId, { step: 1 });
      const view = reminderWizardStep1View(lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id });
      return renderView(cb, view);
    }

    // Cancel wizard
    if (subAction === 'cancel') {
      await clearUserState(chatId);
      const view = await reminderListView(chatId, lang);
      await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'btn_cancel') });
      return renderView(cb, view);
    }
  }

  // ── Snooze a reminder: remind_snooze:<id>:<minutes> ──────────────────────────
  if (kind === 'remind_snooze') {
    const remindId = Number(parts[1]);
    const minutes = Number(parts[2] || 15);
    await snoozeReminder(remindId, chatId, minutes);
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: t(lang, 'toast_snoozed', { min: minutes }),
    });
    try {
      await api.editMessageText({
        chat_id: chatId,
        message_id: cb.message.message_id,
        text: `💤 *${t(lang, 'toast_snoozed', { min: minutes })}*`,
        parse_mode: 'MarkdownV2',
        reply_markup: { inline_keyboard: [] },
      });
    } catch {
      // Ignore if edit fails
    }
    return;
  }

  // ── Convert reminder to a to-do: remind_to_todo:<id> ────────────────────────
  if (kind === 'remind_to_todo') {
    const remindId = Number(parts[1]);
    const r = await db.select().from(reminders)
      .where(and(eq(reminders.id, remindId), eq(reminders.chatId, chatId)))
      .get();
    if (r) {
      await db.insert(todos).values({ chatId, text: r.text }).run();
      await acknowledgeReminder(remindId, chatId);
      await api.answerCallbackQuery({
        callback_query_id: cb.id,
        text: t(lang, 'todo_added', { task: r.text }),
      });
      try {
        await api.editMessageText({
          chat_id: chatId,
          message_id: cb.message.message_id,
          text: `📝 *${t(lang, 'btn_todos')}:*\n🔔 ${escMd(r.text)}`,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: t(lang, 'btn_todos'), callback_data: 'menu:todos', style: 'danger' }],
            ],
          },
        });
      } catch {
        // Ignore if edit fails
      }
    } else {
      await api.answerCallbackQuery({ callback_query_id: cb.id, text: 'Not found.' });
    }
    return;
  }

  // ── To-Do Wizard & Actions ──────────────────────────────────────────────────
  if (kind === 'todo' && parts[1] === 'add') {
    await setUserState(chatId, { mode: 'todo_add' });
    const view = addTodoWizardView(lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  if (kind === 'todo_preset') {
    const taskText = data.slice('todo_preset:'.length);
    await db.insert(todos).values({ chatId, text: taskText }).run();
    await clearUserState(chatId);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'toast_task_done') });
    return renderView(cb, formatTodoSuccess(taskText, lang));
  }

  if (kind === 'todo_custom') {
    await setUserState(chatId, { mode: 'todo_add', awaitingText: true });
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, todoCustomPromptView(lang));
  }

  if (kind === 'todo_cancel') {
    await clearUserState(chatId);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'btn_cancel') });
    return renderView(cb, await todoView(chatId, lang));
  }

  // ── Habit Wizard & Actions ───────────────────────────────────────────────────
  if (kind === 'habit' && parts[1] === 'add') {
    await setUserState(chatId, { mode: 'habit_add' });
    const view = addHabitWizardView(lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  if (kind === 'habit_preset') {
    const habitName = data.slice('habit_preset:'.length);
    await db.insert(habits).values({ chatId, name: habitName }).run();
    await clearUserState(chatId);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'toast_habit_checked') });
    return renderView(cb, formatHabitSuccess(habitName, lang));
  }

  if (kind === 'habit_custom') {
    await setUserState(chatId, { mode: 'habit_add', awaitingText: true });
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, habitCustomPromptView(lang));
  }

  if (kind === 'habit_cancel') {
    await clearUserState(chatId);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'btn_cancel') });
    return renderView(cb, await habitView(chatId, lang));
  }

  // ── Show To-Do Details: tododetail:<id> ─────────────────────────────────────
  if (kind === 'tododetail') {
    const id = Number(parts[1]);
    const view = await todoDetailView(chatId, id, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  // ── Toggle To-Do Status from Detail View: todotoggledetail:<id> ─────────────
  if (kind === 'todotoggledetail') {
    const id = Number(parts[1]);
    const existing = await db.select().from(todos)
      .where(and(eq(todos.id, id), eq(todos.chatId, chatId))).get();
    if (!existing) {
      await api.answerCallbackQuery({ callback_query_id: cb.id, text: 'Not found.' });
      return;
    }
    const wasDone = Boolean(existing.done);
    await db.update(todos).set({ done: !wasDone }).where(eq(todos.id, id)).run();
    const view = await todoDetailView(chatId, id, lang);
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: wasDone
        ? (lang === 'fa' ? '⬜ کار دوباره باز شد' : lang === 'ru' ? '⬜ Задача снова открыта' : '⬜ Task reopened')
        : t(lang, 'toast_task_done'),
    });
    return renderView(cb, view);
  }

  // ── Complete / uncheck a to-do ──────────────────────────────────────────────
  if (kind === 'todo' && !isNaN(Number(parts[1]))) {
    const id = Number(parts[1]);
    const existing = await db.select().from(todos)
      .where(and(eq(todos.id, id), eq(todos.chatId, chatId))).get();
    if (!existing) {
      await api.answerCallbackQuery({ callback_query_id: cb.id, text: 'Not found.' });
      return;
    }

    const wasDone = Boolean(existing.done);
    await db.update(todos).set({ done: !wasDone })
      .where(eq(todos.id, id)).run();

    const view = await todoView(chatId, lang);
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: wasDone
        ? (lang === 'fa' ? '⬜ کار دوباره باز شد' : lang === 'ru' ? '⬜ Задача снова открыта' : '⬜ Task reopened')
        : t(lang, 'toast_task_done'),
    });
    return renderView(cb, view);
  }

  // ── Delete a to-do ───────────────────────────────────────────────────────────
  if (kind === 'deltodo') {
    const id = Number(parts[1]);
    await db.delete(todos).where(and(eq(todos.id, id), eq(todos.chatId, chatId))).run();
    const view = await todoView(chatId, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'toast_task_deleted') });
    return renderView(cb, view);
  }

  // ── Show Habit Details: habitdetail:<id> ───────────────────────────────────
  if (kind === 'habitdetail') {
    const id = Number(parts[1]);
    const view = await habitDetailView(chatId, id, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  // ── Toggle Habit from Detail View: habittoggledetail:<id> ───────────────────
  if (kind === 'habittoggledetail') {
    const id = Number(parts[1]);
    const exists = await db.select().from(checkins)
      .where(and(eq(checkins.habitId, id), eq(checkins.day, today()))).get();
    const alreadyDone = !!exists;
    if (alreadyDone) {
      await db.delete(checkins).where(eq(checkins.id, exists.id)).run();
    } else {
      await db.insert(checkins).values({ habitId: id, day: today() }).run();
    }
    const view = await habitDetailView(chatId, id, lang);
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: alreadyDone
        ? (lang === 'fa' ? '⬜ ثبت امروز لغو شد' : lang === 'ru' ? '⬜ Отметка снята' : '⬜ Unchecked')
        : (lang === 'fa' ? '✅ برای امروز ثبت شد!' : lang === 'ru' ? '✅ Отмечено за сегодня!' : '✅ Checked in!'),
    });
    return renderView(cb, view);
  }

  // ── Check in / uncheck a habit ───────────────────────────────────────────────
  if (kind === 'habit') {
    const id = Number(parts[1]);
    const exists = await db.select().from(checkins)
      .where(and(eq(checkins.habitId, id), eq(checkins.day, today()))).get();
    const alreadyDone = !!exists;
    if (alreadyDone) {
      await db.delete(checkins).where(eq(checkins.id, exists.id)).run();
    } else {
      await db.insert(checkins).values({ habitId: id, day: today() }).run();
    }
    const view = await habitView(chatId, lang);
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: alreadyDone
        ? (lang === 'fa' ? '⬜ ثبت امروز لغو شد' : lang === 'ru' ? '⬜ Отметка снята' : '⬜ Unchecked')
        : (lang === 'fa' ? '✅ برای امروز ثبت شد!' : lang === 'ru' ? '✅ Отмечено за сегодня!' : '✅ Checked in!'),
    });
    return renderView(cb, view);
  }

  // ── Delete a habit ───────────────────────────────────────────────────────────
  if (kind === 'delhabit') {
    const id = Number(parts[1]);
    await db.delete(checkins).where(eq(checkins.habitId, id)).run();
    await db.delete(habits).where(and(eq(habits.id, id), eq(habits.chatId, chatId))).run();
    const view = await habitView(chatId, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'toast_habit_deleted') });
    return renderView(cb, view);
  }

  // ── Show Reminder Details: reminddetail:<id> ───────────────────────────────
  if (kind === 'reminddetail') {
    const id = Number(parts[1]);
    const view = await reminderDetailView(chatId, id, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return renderView(cb, view);
  }

  // ── Toggle Reminder from Detail View: remindertoggledetail:<id> ─────────────
  if (kind === 'remindertoggledetail') {
    const id = Number(parts[1]);
    const r = await db.select().from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.chatId, chatId)))
      .get();
    if (!r) {
      await api.answerCallbackQuery({ callback_query_id: cb.id, text: 'Not found.' });
      return;
    }

    const wasFired = Boolean(r.fired);
    if (!wasFired) {
      if (r.lastMsgId) {
        try {
          await api.deleteMessage({ chat_id: r.chatId, message_id: r.lastMsgId });
        } catch {}
      }
      const isRepeating = Boolean(r.repeat) || (r.repeatRate && r.repeatRate !== 'once');
      const isOneTime = !isRepeating;
      if (isOneTime) {
        // One-time reminder: delete completely and return to reminders list
        await db.delete(reminders).where(eq(reminders.id, id)).run();
        const view = await reminderListView(chatId, lang);
        await api.answerCallbackQuery({
          callback_query_id: cb.id,
          text: lang === 'fa' ? '✅ انجام و حذف شد!' : lang === 'ru' ? '✅ Выполнено и удалено!' : '✅ Completed & deleted!',
        });
        return renderView(cb, view);
      }

      // Repeating reminder: advance to next regular occurrence
      const next = calcNextRegularFire(r);
      await db.update(reminders).set({
        repeat: true,
        repeatRate: r.repeatRate && r.repeatRate !== 'once' ? r.repeatRate : 'daily',
        fired: false,
        pendingAck: false,
        lastMsgId: null,
        nextFire: next,
      }).where(eq(reminders.id, id)).run();

      const view = await reminderDetailView(chatId, id, lang);
      await api.answerCallbackQuery({
        callback_query_id: cb.id,
        text: lang === 'fa' ? '✅ انجام شد!' : lang === 'ru' ? '✅ Выполнено!' : '✅ Done!',
      });
      return renderView(cb, view);
    } else {
      // Reactivate
      const nowSec = Math.floor(Date.now() / 1000);
      let nextFire = r.nextFire;
      if (nextFire <= nowSec) {
        const parsed = parseTime(r.timeHHMM);
        if (parsed) {
          nextFire = nextFireTimestamp(parsed, r.tzOffset);
        } else {
          nextFire = nowSec + 3600;
        }
      }
      await db.update(reminders).set({
        fired: false,
        enabled: true,
        pendingAck: false,
        lastMsgId: null,
        nextFire,
      }).where(eq(reminders.id, id)).run();

      const view = await reminderDetailView(chatId, id, lang);
      await api.answerCallbackQuery({
        callback_query_id: cb.id,
        text: lang === 'fa' ? '⬜ یادآور دوباره فعال شد' : lang === 'ru' ? '⬜ Напоминание снова активно' : '⬜ Reminder reopened',
      });
      return renderView(cb, view);
    }
  }

  // ── Check in / uncheck a reminder ────────────────────────────────────────────
  if (kind === 'checkremind') {
    const id = Number(parts[1]);
    const r = await db.select().from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.chatId, chatId)))
      .get();
    if (!r) {
      await api.answerCallbackQuery({ callback_query_id: cb.id, text: 'Not found.' });
      return;
    }

    const wasFired = Boolean(r.fired);
    if (!wasFired) {
      // If there is an active reminder notification message, delete it
      if (r.lastMsgId) {
        try {
          await api.deleteMessage({ chat_id: r.chatId, message_id: r.lastMsgId });
        } catch {}
      }

      const isRepeating = Boolean(r.repeat) || (r.repeatRate && r.repeatRate !== 'once');
      const isOneTime = !isRepeating;
      if (isOneTime) {
        // One-time reminder: DELETE IT completely when user checks it off!
        await db.delete(reminders).where(eq(reminders.id, id)).run();

        const view = await reminderListView(chatId, lang);
        await api.answerCallbackQuery({
          callback_query_id: cb.id,
          text: lang === 'fa' ? '✅ انجام و حذف شد!' : lang === 'ru' ? '✅ Выполнено и удалено!' : '✅ Completed & deleted!',
        });
        return renderView(cb, view);
      }

      // Repeating reminder: mark done / checked for this cycle
      // Repeating reminder: advance to next regular occurrence
      const next = calcNextRegularFire(r);
      await db.update(reminders).set({
        repeat: true,
        repeatRate: r.repeatRate && r.repeatRate !== 'once' ? r.repeatRate : 'daily',
        fired: false,
        pendingAck: false,
        lastMsgId: null,
        nextFire: next,
      }).where(eq(reminders.id, id)).run();

      const view = await reminderListView(chatId, lang);
      await api.answerCallbackQuery({
        callback_query_id: cb.id,
        text: lang === 'fa' ? '✅ انجام شد!' : lang === 'ru' ? '✅ Выполнено!' : '✅ Done!',
      });
      return renderView(cb, view);
    } else {
      // Reopen / uncheck ⬜
      const nowSec = Math.floor(Date.now() / 1000);
      let nextFire = r.nextFire;
      if (nextFire <= nowSec) {
        const parsed = parseTime(r.timeHHMM);
        if (parsed) {
          nextFire = nextFireTimestamp(parsed, r.tzOffset);
        } else {
          nextFire = nowSec + 3600;
        }
      }
      await db.update(reminders).set({
        fired: false,
        enabled: true,
        pendingAck: false,
        lastMsgId: null,
        nextFire,
      }).where(eq(reminders.id, id)).run();

      const view = await reminderListView(chatId, lang);
      await api.answerCallbackQuery({
        callback_query_id: cb.id,
        text: lang === 'fa' ? '⬜ یادآور دوباره فعال شد' : lang === 'ru' ? '⬜ Напоминание снова активно' : '⬜ Reminder reopened',
      });
      return renderView(cb, view);
    }
  }

  // ── Acknowledge a reminder ──────────────────────────────────────────────────
  if (kind === 'remind_ack') {
    const remindId = Number(parts[1]);
    let result = null;
    if (remindId) {
      result = await acknowledgeReminder(remindId, chatId);
    }
    const ackToast = result?.status === 'deleted'
      ? (lang === 'fa' ? '✅ انجام شد و یادآور حذف گردید!' : lang === 'ru' ? '✅ Напоминание выполнено и удалено!' : '✅ Completed & deleted!')
      : t(lang, 'toast_reminder_ack');
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: ackToast });
    try {
      await api.editMessageReplyMarkup({
        chat_id: chatId,
        message_id: cb.message.message_id,
        reply_markup: { inline_keyboard: [] },
      });
    } catch {
      // Message may already be edited or too old — ignore
    }
    return;
  }

  // ── Delete a reminder ────────────────────────────────────────────────────────
  if (kind === 'delremind') {
    const id = Number(parts[1]);
    const r = await db.select().from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.chatId, chatId))).get();
    if (r?.lastMsgId) {
      try {
        await api.deleteMessage({ chat_id: r.chatId, message_id: r.lastMsgId });
      } catch {}
    }
    await db.delete(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.chatId, chatId))).run();
    const view = await reminderListView(chatId, lang);
    await api.answerCallbackQuery({ callback_query_id: cb.id, text: t(lang, 'toast_reminder_deleted') });
    return renderView(cb, view);
  }

  // ── No-op ────────────────────────────────────────────────────────────────────
  if (kind === 'noop') {
    await api.answerCallbackQuery({ callback_query_id: cb.id });
    return;
  }

  // ── Fallback ─────────────────────────────────────────────────────────────────
  await api.answerCallbackQuery({ callback_query_id: cb.id });
}
