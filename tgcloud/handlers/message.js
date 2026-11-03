import { api, db } from 'sdk';
import { eq } from 'sdk/db';
import { todos, habits, reminders } from '../schema.js';
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
  formatReminderSuccess,
  redKeyboard,
} from '../lib/views.js';
import {
  fireDueReminders,
  parseOffset,
  fmtOffset,
  createReminder,
  escMd,
} from '../lib/reminders.js';
import {
  getUserSettings,
  setUserTimezone,
  setUserState,
  clearUserState,
} from '../lib/settings.js';
import { parseReminderInput, parseTimeOnly, getLocalHHMM } from '../lib/reminder_parser.js';
import { getTimezoneFromCoords } from '../lib/geo_timezone.js';
import { getWelcomePhoto, rememberWelcomePhotoFileId } from '../lib/logo.js';
import { ensureBotConfigured } from '../lib/setup.js';
import { t, normalizeLang } from '../lib/i18n.js';

export default async function (message) {
  // ── Ensure bot pre-start welcome description & command menu are configured
  ensureBotConfigured().catch(() => {});

  const chatId = message.chat.id;

  // ── Ensure user's chat Menu Button is set to Web App "Open" button
  if (message.chat?.type === 'private') {
    api.setChatMenuButton({
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: 'Open',
        web_app: { url: 'https://app8837501303.tgcloud.ai' },
      },
    }).catch(() => {});
  }

  // ── Fire any pending reminders on every incoming message (piggyback delivery)
  await fireDueReminders();

  const firstName = message.from?.first_name ?? 'there';
  const rawText = (message.text ?? '').trim();
  const [rawCmd = '', ...rest] = rawText.split(' ');
  const cmd = rawCmd.split('@')[0];
  const arg = rest.join(' ').trim();

  // Load user settings (with fallback to Telegram client language)
  const clientLangCode = message.from?.language_code;
  const settings = await getUserSettings(chatId, clientLangCode);
  const lang = settings.lang || 'en';

  // ── Handle location share (Auto-set timezone) ──────────────────────────────
  if (message.location) {
    const { latitude, longitude } = message.location;
    const { offsetMinutes, tzName } = getTimezoneFromCoords(latitude, longitude);
    await setUserTimezone(chatId, offsetMinutes, tzName, lang);
    const nowSec = Math.floor(Date.now() / 1000);
    const localTime = getLocalHHMM(nowSec, offsetMinutes);

    await api.sendMessage({
      chat_id: chatId,
      text: t(lang, 'loc_received', { tzName: escMd(tzName), localTime: escMd(localTime) }),
      parse_mode: 'MarkdownV2',
      reply_markup: {
        remove_keyboard: true,
      },
    });

    return api.sendMessage({
      chat_id: chatId,
      ...mainMenuView(lang),
    });
  }

  // ── Handle skip or back from location prompt ─────────────────────────────────
  const isSkip = rawText.includes('Skip') || rawText.includes('رد شدن') || rawText.includes('Пропустить');
  if (isSkip) {
    await setUserTimezone(chatId, settings.tzOffset, settings.tzName, lang);
    await api.sendMessage({
      chat_id: chatId,
      text: t(lang, 'loc_skipped', { tzName: escMd(settings.tzName) }),
      parse_mode: 'MarkdownV2',
      reply_markup: {
        remove_keyboard: true,
      },
    });

    return api.sendMessage({
      chat_id: chatId,
      ...mainMenuView(lang),
    });
  }

  const isBack =
    rawText.includes('Back') ||
    rawText.includes('بازگشت') ||
    rawText.includes('Назад') ||
    rawText.includes('Cancel') ||
    rawText.includes('لغو') ||
    rawText.includes('Отмена');

  if (isBack) {
    await api.sendMessage({
      chat_id: chatId,
      text: '🏠 *' + (lang === 'fa' ? 'منوی اصلی' : lang === 'ru' ? 'Главное меню' : 'Main Menu') + '*',
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true,
      },
    });

    return api.sendMessage({
      chat_id: chatId,
      ...mainMenuView(lang),
    });
  }

  // ── Handle active wizard state ───────────────────────────────────────────────
  if (settings.state) {
    if (cmd === '/cancel' || rawText.toLowerCase() === 'cancel' || rawText === 'لغو' || rawText.toLowerCase() === 'отмена') {
      const mode = settings.state.mode;
      await clearUserState(chatId);
      if (mode === 'todo_add') {
        return api.sendMessage({
          chat_id: chatId,
          text: t(lang, 'todo_cancelled'),
          parse_mode: 'MarkdownV2',
          reply_markup: redKeyboard([
            [{ text: t(lang, 'btn_todos'), callback_data: 'menu:todos' }],
            [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
          ]),
        });
      }
      if (mode === 'habit_add') {
        return api.sendMessage({
          chat_id: chatId,
          text: t(lang, 'habit_cancelled'),
          parse_mode: 'MarkdownV2',
          reply_markup: redKeyboard([
            [{ text: t(lang, 'btn_habits'), callback_data: 'menu:habits' }],
            [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
          ]),
        });
      }
      return api.sendMessage({
        chat_id: chatId,
        text: t(lang, 'reminder_cancelled'),
        parse_mode: 'MarkdownV2',
        reply_markup: redKeyboard([
          [{ text: t(lang, 'btn_reminders'), callback_data: 'menu:reminders' }],
          [{ text: t(lang, 'btn_main_menu'), callback_data: 'menu:main' }],
        ]),
      });
    }

    // If user sent another command like /start, /menu, clear state and proceed
    if (cmd.startsWith('/') && cmd !== '/remind' && cmd !== '/add' && cmd !== '/habit') {
      await clearUserState(chatId);
    } else if (settings.state.mode === 'todo_add') {
      // User typed their custom to-do text!
      const taskText = rawText;
      if (taskText) {
        await db.insert(todos).values({ chatId, text: taskText }).run();
        await clearUserState(chatId);
        return api.sendMessage({
          chat_id: chatId,
          ...formatTodoSuccess(taskText, lang),
        });
      }
    } else if (settings.state.mode === 'habit_add') {
      // User typed their custom habit name!
      const habitName = rawText;
      if (habitName) {
        await db.insert(habits).values({ chatId, name: habitName }).run();
        await clearUserState(chatId);
        return api.sendMessage({
          chat_id: chatId,
          ...formatHabitSuccess(habitName, lang),
        });
      }
    } else if (settings.state.step === 2) {
      // User is at Step 2 and typed a time in chat!
      const repeatRate = settings.state.repeatRate || (settings.state.repeat ? 'daily' : 'once');
      const repeat = repeatRate !== 'once';
      const parsedTime = parseTimeOnly(rawText, settings.tzOffset, repeat);
      if (parsedTime) {
        await setUserState(chatId, {
          ...settings.state,
          step: 3,
          repeat,
          repeatRate,
          timeHHMM: parsedTime.timeHHMM,
          nextFire: parsedTime.nextFire,
          label: parsedTime.label,
          awaitingTime: false,
        });

        return api.sendMessage({
          chat_id: chatId,
          ...reminderWizardStep3PriorityView(repeatRate, parsedTime.label, parsedTime.timeHHMM, lang),
        });
      }

      return api.sendMessage({
        chat_id: chatId,
        text:
          '❌ ' + (lang === 'fa' ? 'زمان وارد شده نامعتبر است\\.\nلطفاً از دکمه‌های بالا انتخاب کنید یا مثلاً بنویسید `18:30`\\.' : lang === 'ru' ? 'Не удалось распознать время\\.\nИспользуйте кнопки выше или введите, например, `18:30`\\.' : 'Could not understand that time\\. Please use buttons above or type e\\.g\\. `18:30`\\.') +
          '\n\n' +
          (repeat
            ? '• `08:00`\n• `18:30`\n• `21:00`\n'
            : '• `30m`\n• `1h`\n• `18:30`\n• `tomorrow 10am`\n'),
        parse_mode: 'MarkdownV2',
        reply_markup: redKeyboard([
          [{ text: t(lang, 'btn_cancel'), callback_data: 'remind_wizard:cancel' }],
        ]),
      });
    } else if (settings.state.step === 3 || settings.state.step === 4) {
      // User is at final Step and typed the reminder text!
      const reminderText = rawText;
      if (!reminderText) {
        return api.sendMessage({
          chat_id: chatId,
          text: '❌ ' + (lang === 'fa' ? 'لطفاً متن یادآور خود را بنویسید\\.' : lang === 'ru' ? 'Пожалуйста, введите текст напоминания\\.' : 'Please send a message describing what to be reminded about\\.'),
          parse_mode: 'MarkdownV2',
        });
      }

      const {
        timeHHMM,
        nextFire,
        repeat,
        repeatRate = (repeat ? 'daily' : 'once'),
        priority = 'Medium',
        label,
      } = settings.state;

      await createReminder({
        chatId,
        text: reminderText,
        timeHHMM,
        tzOffset: settings.tzOffset,
        repeat: repeatRate !== 'once',
        repeatRate,
        priority,
        nextFire,
      });
      await clearUserState(chatId);

      // Check if newly created reminder is already due (e.g. user took time typing text)
      await fireDueReminders();

      return api.sendMessage({
        chat_id: chatId,
        ...formatReminderSuccess(reminderText, timeHHMM, settings.tzOffset, repeatRate, priority, label, lang),
      });
    }
  }

  // ── /start — Welcome screen ─────────────────────────────────────────────────
  if (cmd === '/start') {
    const isNewUser = !settings.onboarded;

    if (isNewUser) {
      // Mark user as started with default timezone immediately so subsequent /start never asks again
      await setUserTimezone(chatId, settings.tzOffset, settings.tzName, lang);

      const nameGreeting = lang === 'fa'
        ? `خوش آمدید، ${escMd(firstName)}\\!`
        : lang === 'ru'
        ? `Добро пожаловать, ${escMd(firstName)}\\!`
        : `Welcome, ${escMd(firstName)}\\!`;

      const welcomeText =
        `👋 *${nameGreeting}*\n\n` +
        t(lang, 'welcome_title') +
        `\n\n` +
        t(lang, 'welcome_prompt_loc');

      const locationKeyboard = {
        keyboard: [
          [{ text: t(lang, 'btn_share_loc'), request_location: true, style: 'danger' }],
          [{ text: t(lang, 'btn_skip'), style: 'danger' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      };

      try {
        const photo = await getWelcomePhoto();
        const sent = await api.sendPhoto({
          chat_id: chatId,
          photo,
          caption: welcomeText,
          parse_mode: 'MarkdownV2',
          reply_markup: locationKeyboard,
        });
        if (sent?.photo?.length) {
          const fileId = sent.photo[sent.photo.length - 1].file_id;
          await rememberWelcomePhotoFileId(fileId);
        }
        return sent;
      } catch {
        return api.sendMessage({
          chat_id: chatId,
          text: welcomeText,
          parse_mode: 'MarkdownV2',
          reply_markup: locationKeyboard,
        });
      }
    }

    // ── Returning user (location already configured or asked once) ─────────────
    // Directly show the main menu without the welcome photo or intro text
    return api.sendMessage({
      chat_id: chatId,
      ...mainMenuView(lang),
    });
  }

  // ── /app — Launch Mini App ───────────────────────────────────────────────────
  if (cmd === '/app') {
    const text =
      lang === 'fa'
        ? 'برای اجرای Remnoten روی دکمه زیر کلیک کنید!'
        : lang === 'ru'
        ? '🚀 Нажмите на кнопку ниже, чтобы открыть Remnoten:'
        : '🚀 Tap the button below to launch your Remnoten Mini App:';
    const btnText =
      lang === 'fa'
        ? '🔥 باز کردن Remnoten'
        : lang === 'ru'
        ? '🔥 Открыть Remnoten'
        : '🔥 Open Remnoten';

    return api.sendMessage({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [
          [{ text: btnText, web_app: { url: 'https://app8837501303.tgcloud.ai' } }],
        ],
      },
    });
  }

  // ── /menu — Main menu ────────────────────────────────────────────────────────
  if (cmd === '/menu') {
    return api.sendMessage({ chat_id: chatId, ...mainMenuView(lang) });
  }

  // ── /language or /lang — Toggle language ─────────────────────────────────────
  if (cmd === '/language' || cmd === '/lang') {
    return api.sendMessage({ chat_id: chatId, ...languageMenuView(lang) });
  }

  // ── /add — Add a to-do ───────────────────────────────────────────────────────
  if (cmd === '/add') {
    if (!arg) {
      await setUserState(chatId, { mode: 'todo_add' });
      return api.sendMessage({ chat_id: chatId, ...addTodoWizardView(lang) });
    }
    await db.insert(todos).values({ chatId, text: arg }).run();
    return api.sendMessage({
      chat_id: chatId,
      ...formatTodoSuccess(arg, lang),
    });
  }

  // ── /list or /todos — Show to-dos ───────────────────────────────────────────
  if (cmd === '/list' || cmd === '/todos') {
    return api.sendMessage({ chat_id: chatId, ...(await todoView(chatId, lang)) });
  }

  // ── /habit — Add a habit ─────────────────────────────────────────────────────
  if (cmd === '/habit') {
    if (!arg) {
      await setUserState(chatId, { mode: 'habit_add' });
      return api.sendMessage({ chat_id: chatId, ...addHabitWizardView(lang) });
    }
    await db.insert(habits).values({ chatId, name: arg }).run();
    return api.sendMessage({
      chat_id: chatId,
      ...formatHabitSuccess(arg, lang),
    });
  }

  // ── /habits — Show habits ────────────────────────────────────────────────────
  if (cmd === '/habits') {
    return api.sendMessage({ chat_id: chatId, ...(await habitView(chatId, lang)) });
  }

  // ── /stats — Stats ───────────────────────────────────────────────────────────
  if (cmd === '/stats') {
    return api.sendMessage({ chat_id: chatId, ...(await statsView(chatId, lang)) });
  }

  // ── /help — Help ─────────────────────────────────────────────────────────────
  if (cmd === '/help') {
    return api.sendMessage({ chat_id: chatId, ...helpView(lang) });
  }

  // ── /setup — Configure bot profile & menu commands ──────────────────────────
  if (cmd === '/setup') {
    await ensureBotConfigured();
    return api.sendMessage({
      chat_id: chatId,
      text: '✅ Bot command menu and descriptions have been updated in English, Persian, and Russian\\!',
      parse_mode: 'MarkdownV2',
    });
  }

  // ── /reminders — List reminders ──────────────────────────────────────────────
  if (cmd === '/reminders') {
    return api.sendMessage({ chat_id: chatId, ...(await reminderListView(chatId, lang)) });
  }

  // ── /timezone — Timezone management ──────────────────────────────────────────
  if (cmd === '/timezone' || cmd === '/tz') {
    if (arg) {
      const parsedOffset = parseOffset(arg);
      if (parsedOffset !== null) {
        await setUserTimezone(chatId, parsedOffset, null, lang);
        const updated = await getUserSettings(chatId);
        return api.sendMessage({
          chat_id: chatId,
          text: `✅ *Timezone updated to ${escMd(updated.tzName)}\\!*`,
          parse_mode: 'MarkdownV2',
          reply_markup: {
            remove_keyboard: true,
          },
        }).then(() => api.sendMessage({
          chat_id: chatId,
          ...mainMenuView(lang),
        }));
      }
      return api.sendMessage({
        chat_id: chatId,
        text: `❌ Invalid UTC offset: \`${escMd(arg)}\`\\. Use e\\.g\\. \`\\+3:30\`, \`\\-5\`, \`0\`\\.`,
        parse_mode: 'MarkdownV2',
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const localTime = getLocalHHMM(nowSec, settings.tzOffset);

    return api.sendMessage({
      chat_id: chatId,
      text:
        `🌍 *${t(lang, 'btn_timezone')}*\n\n` +
        `Current timezone: *${escMd(settings.tzName)}*\n` +
        `Current local time: \`${escMd(localTime)}\`\n\n` +
        `📍 Tap *Share Location* below to update your timezone automatically, or type:\n` +
        `\`/timezone ±offset\` \\(e\\.g\\. \`/timezone +3:30\` or \`/timezone -5\`\\)`,
      parse_mode: 'MarkdownV2',
      reply_markup: {
        keyboard: [
          [{ text: t(lang, 'btn_share_loc'), request_location: true, style: 'danger' }],
          [{ text: t(lang, 'btn_main_menu'), style: 'danger' }],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  }

  // ── /remind — Set a reminder ─────────────────────────────────────────────────
  if (cmd === '/remind') {
    if (!arg) {
      await setUserState(chatId, { step: 1 });
      return api.sendMessage({ chat_id: chatId, ...reminderWizardStep1View(lang) });
    }

    const parsed = parseReminderInput(arg, settings.tzOffset);
    if (!parsed) {
      return api.sendMessage({
        chat_id: chatId,
        text:
          '❌ ' + (lang === 'fa' ? 'زمان یا متن یادآور قابل تشخیص نبود\\.' : lang === 'ru' ? 'Не удалось распознать время или текст напоминания\\.' : 'Could not understand the time for that reminder\\.') +
          '\n\n' +
          '*Examples:*\n' +
          '• `/remind 30m Check oven`\n' +
          '• `/remind 18:30 Dinner with family`\n' +
          '• `/remind daily 08:00 Morning workout`\n\n' +
          'Or start the interactive setup below:',
        parse_mode: 'MarkdownV2',
        reply_markup: redKeyboard([
          [{ text: t(lang, 'btn_add_reminder'), callback_data: 'remind:add' }],
          [{ text: t(lang, 'btn_reminders'), callback_data: 'menu:reminders' }],
        ]),
      });
    }

    await createReminder({
      chatId,
      text: parsed.text,
      timeHHMM: parsed.timeHHMM,
      tzOffset: parsed.tzOffset,
      repeat: parsed.repeat,
      repeatRate: parsed.repeatRate || (parsed.repeat ? 'daily' : 'once'),
      priority: parsed.priority || 'Medium',
      nextFire: parsed.nextFire,
    });

    if (parsed.explicitTz) {
      await setUserTimezone(chatId, parsed.tzOffset, null, lang);
    }

    return api.sendMessage({
      chat_id: chatId,
      ...formatReminderSuccess(
        parsed.text,
        parsed.timeHHMM,
        parsed.tzOffset,
        parsed.repeatRate || (parsed.repeat ? 'daily' : 'once'),
        parsed.priority || 'Medium',
        parsed.relativeLabel,
        lang
      ),
    });
  }

  // ── Conversational check: "remind me in 10 minutes to..." ────────────────────
  if (/^remind\b/i.test(rawText)) {
    const parsed = parseReminderInput(rawText, settings.tzOffset);
    if (parsed) {
      await createReminder({
        chatId,
        text: parsed.text,
        timeHHMM: parsed.timeHHMM,
        tzOffset: parsed.tzOffset,
        repeat: parsed.repeat,
        repeatRate: parsed.repeatRate || (parsed.repeat ? 'daily' : 'once'),
        priority: parsed.priority || 'Medium',
        nextFire: parsed.nextFire,
      });
      if (parsed.explicitTz) {
        await setUserTimezone(chatId, parsed.tzOffset, null, lang);
      }
      return api.sendMessage({
        chat_id: chatId,
        ...formatReminderSuccess(
          parsed.text,
          parsed.timeHHMM,
          parsed.tzOffset,
          parsed.repeatRate || (parsed.repeat ? 'daily' : 'once'),
          parsed.priority || 'Medium',
          parsed.relativeLabel,
          lang
        ),
      });
    }
  }

  // ── Unknown / plain text → show menu ────────────────────────────────────────
  return api.sendMessage({ chat_id: chatId, ...mainMenuView(lang) });
}
