import { db } from 'sdk';
import { eq, and, desc, sql } from 'sdk/db';
import { todos, habits, checkins, reminders } from '../schema.js';
import { escMd, fmtOffset } from './reminders.js';
import { getUserSettings, TIMEZONE_OPTIONS } from './settings.js';
import { getLocalHHMM } from './reminder_parser.js';
import { t, normalizeLang } from './i18n.js';

export const today = () => new Date().toISOString().slice(0, 10);

/**
 * Wraps an inline keyboard array so each button includes
 * style: 'danger' (red tint) per Telegram Bot API 9.4+.
 */
export function redKeyboard(inline_keyboard) {
  return {
    inline_keyboard: inline_keyboard.map(row =>
      row.map(b => (b && typeof b === 'object' ? { style: 'danger', ...b } : b))
    ),
  };
}

export const RTL_REGEX = /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasRtl(str) {
  return RTL_REGEX.test(String(str || ''));
}

/**
 * Ensures text containing Persian/Arabic glyphs retains proper RTL paragraph
 * direction in Telegram messages & buttons without scrambling mixed English words.
 */
export function bidiText(str, forceRtl = false) {
  if (!str) return '';
  const s = String(str);
  if (forceRtl || hasRtl(s)) {
    return '\u200F' + s + '\u200F';
  }
  return s;
}

// ─── Main Menu ───────────────────────────────────────────────────────────────

export function mainMenuView(lang = 'en') {
  const l = normalizeLang(lang);
  const appBtnText =
    l === 'fa' ? '🚀 باز کردن مینی‌اپ Remnoten' : l === 'ru' ? '🚀 Открыть Remnoten' : '🚀 Open Remnoten App';

  return {
    text: t(l, 'menu_title'),
    parse_mode: 'Markdown',
    reply_markup: redKeyboard([
      [
        { text: appBtnText, web_app: { url: 'https://app8837501303.tgcloud.ai' } },
      ],
      [
        { text: t(l, 'btn_todos'), callback_data: 'menu:todos' },
        { text: t(l, 'btn_habits'), callback_data: 'menu:habits' },
      ],
      [
        { text: t(l, 'btn_reminders'), callback_data: 'menu:reminders' },
        { text: t(l, 'btn_stats'), callback_data: 'menu:stats' },
      ],
      [
        { text: t(l, 'btn_language'), callback_data: 'menu:lang' },
        { text: t(l, 'btn_help'), callback_data: 'menu:help' },
      ],
    ]),
  };
}

// ─── Language Menu ───────────────────────────────────────────────────────────

export function languageMenuView(currentLang = 'en') {
  const l = normalizeLang(currentLang);
  const langNames = {
    en: '🇬🇧 English',
    fa: '🇮🇷 فارسی (Persian)',
    ru: '🇷🇺 Русский (Russian)',
  };

  return {
    text:
      t(l, 'lang_menu_title') +
      `\n\n` +
      `• Current: *${langNames[l] || 'English'}*`,
    parse_mode: 'Markdown',
    reply_markup: redKeyboard([
      [{ text: `${l === 'en' ? '✅ ' : ''}🇬🇧 English`, callback_data: 'lang:set:en' }],
      [{ text: `${l === 'fa' ? '✅ ' : ''}🇮🇷 فارسی`, callback_data: 'lang:set:fa' }],
      [{ text: `${l === 'ru' ? '✅ ' : ''}🇷🇺 Русский`, callback_data: 'lang:set:ru' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── To-Do View ──────────────────────────────────────────────────────────────

export async function todoView(chatId, userLang = null) {
  const settings = userLang ? { lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  // The bot only displays active open (uncompleted) tasks
  const list = await db.select().from(todos)
    .where(and(
      eq(todos.chatId, chatId),
      sql`(${todos.done} IS NULL OR ${todos.done} = 0 OR ${todos.done} = false)`
    ))
    .orderBy(todos.id).all();

  if (!list.length) {
    return {
      text: t(l, 'todo_empty'),
      parse_mode: 'MarkdownV2',
      reply_markup: redKeyboard([
        [{ text: t(l, 'btn_add_todo'), callback_data: 'todo:add' }],
        [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
      ]),
    };
  }

  const rows = list.map(task => {
    return [
      { text: bidiText(task.text, l === 'fa'), callback_data: 'tododetail:' + task.id },
      { text: '⬜', callback_data: 'todo:' + task.id },
      { text: '🗑', callback_data: 'deltodo:' + task.id },
    ];
  });

  return {
    text: t(l, 'todo_list_title'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      ...rows,
      [{ text: t(l, 'btn_add_todo'), callback_data: 'todo:add' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── Habit View ───────────────────────────────────────────────────────────────

async function streak(habitId) {
  const rows = await db.select().from(checkins)
    .where(eq(checkins.habitId, habitId)).orderBy(desc(checkins.day)).limit(400).all();
  const days = new Set(rows.map(r => r.day));
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  let n = 0;
  while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

export async function habitView(chatId, userLang = null) {
  const settings = userLang ? { lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  const list = await db.select().from(habits).where(eq(habits.chatId, chatId)).all();

  if (!list.length) {
    return {
      text: t(l, 'habit_empty'),
      parse_mode: 'MarkdownV2',
      reply_markup: redKeyboard([
        [{ text: t(l, 'btn_add_habit'), callback_data: 'habit:add' }],
        [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
      ]),
    };
  }

  const rows = [];
  for (const h of list) {
    const done = await db.select().from(checkins)
      .where(and(eq(checkins.habitId, h.id), eq(checkins.day, today()))).get();
    const s = await streak(h.id);
    const checkEmoji = done ? '✅' : '⬜';
    rows.push([
      { text: bidiText(`${h.name} 🔥${s}`, l === 'fa'), callback_data: 'habitdetail:' + h.id },
      { text: checkEmoji, callback_data: 'habit:' + h.id },
      { text: '🗑', callback_data: 'delhabit:' + h.id },
    ]);
  }

  return {
    text: t(l, 'habit_list_title'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      ...rows,
      [{ text: t(l, 'btn_add_habit'), callback_data: 'habit:add' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── Stats View ───────────────────────────────────────────────────────────────

export async function statsView(chatId, userLang = null) {
  const settings = userLang ? { lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  const habitList = await db.select().from(habits).where(eq(habits.chatId, chatId)).all();
  const openTodos = await db.$count(todos, and(eq(todos.chatId, chatId), eq(todos.done, false)));
  const doneTodos = await db.$count(todos, and(eq(todos.chatId, chatId), eq(todos.done, true)));

  if (!habitList.length && openTodos === 0 && doneTodos === 0) {
    return {
      text: t(l, 'stats_empty'),
      parse_mode: 'MarkdownV2',
      reply_markup: redKeyboard([
        [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }]
      ]),
    };
  }

  let lines = ['📊 *' + (l === 'fa' ? 'آمار و پیشرفت شما' : l === 'ru' ? 'Ваша статистика' : 'Your Stats') + '*\n'];
  lines.push(t(l, 'stats_todos_line', { open: openTodos, done: doneTodos }));

  if (habitList.length) {
    lines.push(t(l, 'stats_streak_title'));
    for (const h of habitList) {
      const s = await streak(h.id);
      const totalCheckins = await db.$count(checkins, eq(checkins.habitId, h.id));
      lines.push(t(l, 'stats_streak_item', { name: escMd(h.name), streak: s, total: totalCheckins }));
    }
  }

  return {
    text: lines.join('\n'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }]
    ]),
  };
}

// ─── Help View ────────────────────────────────────────────────────────────────

export function helpView(lang = 'en') {
  const l = normalizeLang(lang);
  return {
    text: t(l, 'help_text'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }]
    ]),
  };
}

// ─── Reminder List View ───────────────────────────────────────────────────────

export async function reminderListView(chatId, userLang = null) {
  const settings = userLang ? { ...(await getUserSettings(chatId)), lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  const list = await db.select().from(reminders)
    .where(eq(reminders.chatId, chatId))
    .all();

  if (!list.length) {
    return {
      text:
        t(l, 'reminder_empty') +
        `\n\n🌍 *${t(l, 'btn_timezone')}:* \`${escMd(settings.tzName)}\``,
      parse_mode: 'MarkdownV2',
      reply_markup: redKeyboard([
        [{ text: t(l, 'btn_add_reminder'), callback_data: 'remind:add' }],
        [{ text: `🌍 ${t(l, 'btn_timezone')} (${settings.tzName})`, callback_data: 'remind:tz_menu' }],
        [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
      ]),
    };
  }

  const rows = list.map(r => {
    const typeLabel = r.repeat ? '🔁' : '⏰';
    const prioIcon = r.priority === 'High' ? '🔴' : r.priority === 'Low' ? '🔵' : '🟡';
    const shortText = r.text.length > 18 ? r.text.slice(0, 18) + '…' : r.text;
    const checkEmoji = r.fired ? '✅' : '⬜';
    const label = `${typeLabel} ${prioIcon} ${r.timeHHMM} — ${shortText}`;
    return [
      { text: bidiText(label, l === 'fa'), callback_data: 'reminddetail:' + r.id },
      { text: checkEmoji, callback_data: 'checkremind:' + r.id },
      { text: '🗑', callback_data: 'delremind:' + r.id },
    ];
  });

  const lines = list.map(r => {
    let typeLabel = 'Daily';
    if (r.repeat) {
      if (r.repeatRate === '2_days') typeLabel = l === 'fa' ? 'هر ۲ روز' : l === 'ru' ? 'Каждые 2 дня' : 'Every 2 days';
      else if (r.repeatRate === '3_days') typeLabel = l === 'fa' ? 'هر ۳ روز' : l === 'ru' ? 'Каждые 3 дня' : 'Every 3 days';
      else if (r.repeatRate === 'weekly') typeLabel = l === 'fa' ? 'هفتگی' : l === 'ru' ? 'Еженедельно' : 'Weekly';
      else typeLabel = l === 'fa' ? 'روزانه' : l === 'ru' ? 'Ежедневно' : 'Daily';
    } else {
      typeLabel = l === 'fa' ? 'یک‌باره' : l === 'ru' ? 'Однократно' : 'Once';
    }
    const prioIcon = r.priority === 'High' ? '🔴' : r.priority === 'Low' ? '🔵' : '🟡';
    const statusIcon = r.fired ? '✅' : '⬜';
    const tz = escMd(fmtOffset(r.tzOffset));
    const isRtl = l === 'fa' || hasRtl(r.text);
    const rlm = isRtl ? '\u200F' : '';
    return `${rlm}${statusIcon} ${escMd(r.timeHHMM)} \\(${tz}\\) — ${typeLabel} \\[${prioIcon}\\] — ${escMd(r.text)}`;
  });

  return {
    text:
      t(l, 'reminder_list_title') +
      `\n\n${lines.join('\n')}\n\n` +
      `🌍 *${t(l, 'btn_timezone')}:* \`${escMd(settings.tzName)}\``,
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_add_reminder'), callback_data: 'remind:add' }],
      ...rows,
      [{ text: `🌍 ${t(l, 'btn_timezone')} (${settings.tzName})`, callback_data: 'remind:tz_menu' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── Reminder Wizard Views (4-Step Flow: Repeat -> Time -> Priority -> Text) ───

export function getRepeatLabel(repeatRate, lang = 'en') {
  const l = normalizeLang(lang);
  if (repeatRate === '2_days') return t(l, 'type_2_days');
  if (repeatRate === '3_days') return t(l, 'type_3_days');
  if (repeatRate === 'weekly') return t(l, 'type_weekly');
  if (repeatRate === 'daily') return t(l, 'type_daily');
  return t(l, 'type_onetime');
}

export function getPriorityLabel(priority, lang = 'en') {
  const l = normalizeLang(lang);
  if (priority === 'High') return t(l, 'priority_high');
  if (priority === 'Low') return t(l, 'priority_low');
  return t(l, 'priority_medium');
}

export function reminderWizardStep1View(lang = 'en') {
  const l = normalizeLang(lang);
  return {
    text: t(l, 'reminder_step1_title'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: t(l, 'btn_onetime'), callback_data: 'remind_wizard:rate:once' },
        { text: t(l, 'btn_daily'), callback_data: 'remind_wizard:rate:daily' },
      ],
      [
        { text: t(l, 'btn_2_days'), callback_data: 'remind_wizard:rate:2_days' },
        { text: t(l, 'btn_3_days'), callback_data: 'remind_wizard:rate:3_days' },
      ],
      [
        { text: t(l, 'btn_weekly'), callback_data: 'remind_wizard:rate:weekly' },
      ],
      [
        { text: t(l, 'btn_cancel'), callback_data: 'remind_wizard:cancel' },
      ],
    ]),
  };
}

export function reminderWizardStep2View(repeatRate = 'once', lang = 'en') {
  const l = normalizeLang(lang);
  const isRepeat = repeatRate !== 'once' && repeatRate !== false;
  const typeText = getRepeatLabel(repeatRate, l);

  if (isRepeat) {
    return {
      text: t(l, 'reminder_step2_title', { type: typeText }),
      parse_mode: 'MarkdownV2',
      reply_markup: redKeyboard([
        [
          { text: t(l, 'time_morning'), callback_data: 'remind_wizard:daily_time:08:00' },
          { text: t(l, 'time_noon'), callback_data: 'remind_wizard:daily_time:12:00' },
        ],
        [
          { text: t(l, 'time_evening'), callback_data: 'remind_wizard:daily_time:18:00' },
          { text: t(l, 'time_night'), callback_data: 'remind_wizard:daily_time:21:00' },
        ],
        [
          { text: t(l, 'btn_custom_time'), callback_data: 'remind_wizard:custom_time' },
        ],
        [
          { text: t(l, 'btn_back'), callback_data: 'remind_wizard:step1' },
          { text: t(l, 'btn_cancel'), callback_data: 'remind_wizard:cancel' },
        ],
      ]),
    };
  }

  // One-time
  return {
    text: t(l, 'reminder_step2_title', { type: typeText }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: t(l, 'time_15m'), callback_data: 'remind_wizard:quick:900' },
        { text: t(l, 'time_30m'), callback_data: 'remind_wizard:quick:1800' },
      ],
      [
        { text: t(l, 'time_1h'), callback_data: 'remind_wizard:quick:3600' },
        { text: t(l, 'time_2h'), callback_data: 'remind_wizard:quick:7200' },
      ],
      [
        { text: t(l, 'time_tonight'), callback_data: 'remind_wizard:preset:tonight' },
        { text: t(l, 'time_tomorrow'), callback_data: 'remind_wizard:preset:tomorrow' },
      ],
      [
        { text: t(l, 'btn_custom_time'), callback_data: 'remind_wizard:custom_time' },
      ],
      [
        { text: t(l, 'btn_back'), callback_data: 'remind_wizard:step1' },
        { text: t(l, 'btn_cancel'), callback_data: 'remind_wizard:cancel' },
      ],
    ]),
  };
}

export function reminderWizardCustomTimeView(repeatRate, lang = 'en') {
  const l = normalizeLang(lang);
  const isRepeat = repeatRate !== 'once' && repeatRate !== false;
  const examples = isRepeat
    ? '• `08:00`\n• `18:30`\n• `21:00`'
    : '• `30m`\n• `1h`\n• `18:30`\n• `tomorrow 10am`';

  return {
    text: t(l, 'reminder_custom_time_prompt', { examples }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: t(l, 'btn_back_presets'), callback_data: 'remind_wizard:back_to_presets' },
        { text: t(l, 'btn_cancel'), callback_data: 'remind_wizard:cancel' },
      ],
    ]),
  };
}

export function reminderWizardStep3PriorityView(repeatRate, label, timeHHMM, lang = 'en') {
  const l = normalizeLang(lang);
  const typeText = getRepeatLabel(repeatRate, l);
  const safeLabel = escMd(label);

  return {
    text: t(l, 'reminder_step3_priority_title', {
      type: typeText,
      time: `${safeLabel} \\(\`${escMd(timeHHMM)}\`\\)`,
    }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_priority_high'), callback_data: 'remind_wizard:priority:High' }],
      [{ text: t(l, 'btn_priority_medium'), callback_data: 'remind_wizard:priority:Medium' }],
      [{ text: t(l, 'btn_priority_low'), callback_data: 'remind_wizard:priority:Low' }],
      [
        { text: t(l, 'btn_back'), callback_data: 'remind_wizard:back_to_step2' },
        { text: t(l, 'btn_cancel'), callback_data: 'remind_wizard:cancel' },
      ],
    ]),
  };
}

export function reminderWizardStep4View(repeatRate, priority = 'Medium', label = '', timeHHMM = '', lang = 'en') {
  const l = normalizeLang(lang);
  const typeText = getRepeatLabel(repeatRate, l);
  const prioText = getPriorityLabel(priority, l);
  const safeLabel = escMd(label);

  return {
    text: t(l, 'reminder_step4_title', {
      type: typeText,
      time: `${safeLabel} \\(\`${escMd(timeHHMM)}\`\\)`,
      priority: prioText,
    }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: t(l, 'btn_back'), callback_data: 'remind_wizard:back_to_priority' },
        { text: t(l, 'btn_cancel'), callback_data: 'remind_wizard:cancel' },
      ],
    ]),
  };
}

export function reminderWizardStep3View(label, timeHHMM, repeat, lang = 'en') {
  return reminderWizardStep4View(repeat ? 'daily' : 'once', 'Medium', label, timeHHMM, lang);
}

export function formatReminderSuccess(text, timeHHMM, tzOffset, repeatRate, priority = 'Medium', label = null, lang = 'en') {
  const l = normalizeLang(lang);
  const typeLabel = typeof repeatRate === 'string'
    ? getRepeatLabel(repeatRate, l)
    : (repeatRate ? t(l, 'type_daily') : t(l, 'type_onetime'));
  const prioLabel = getPriorityLabel(priority, l);
  const tzEsc = fmtOffset(tzOffset).replace(/\+/g, '\\+').replace(/-/g, '\\-');
  const safeText = escMd(text);
  const whenStr = label ? escMd(label) : `${escMd(timeHHMM)} \\(${tzEsc}\\)`;
  const bidiPrefix = (l === 'fa' || hasRtl(text)) ? '\u200F' : '';

  return {
    text: t(l, 'reminder_set', {
      text: bidiPrefix + safeText + bidiPrefix,
      when: whenStr,
      type: typeLabel,
      priority: prioLabel,
    }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_set_another_reminder'), callback_data: 'remind:add' }],
      [{ text: t(l, 'btn_reminders'), callback_data: 'menu:reminders' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── Timezone Settings Menu ───────────────────────────────────────────────────

export async function timezoneMenuView(chatId, userLang = null) {
  const settings = userLang ? { ...(await getUserSettings(chatId)), lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);
  const nowSec = Math.floor(Date.now() / 1000);
  const localTime = getLocalHHMM(nowSec, settings.tzOffset);

  const tzButtons = [];
  for (let i = 0; i < TIMEZONE_OPTIONS.length; i += 2) {
    const row = [
      { text: TIMEZONE_OPTIONS[i].label, callback_data: `remind:tz_set:${TIMEZONE_OPTIONS[i].offset}` },
    ];
    if (i + 1 < TIMEZONE_OPTIONS.length) {
      row.push({
        text: TIMEZONE_OPTIONS[i + 1].label,
        callback_data: `remind:tz_set:${TIMEZONE_OPTIONS[i + 1].offset}`,
      });
    }
    tzButtons.push(row);
  }

  const title = l === 'fa'
    ? '🌍 *تنظیمات منطقه زمانی*\n\n' +
      `منطقه زمانی فعلی: *${escMd(settings.tzName)}*\n` +
      `ساعت محلی شما: \`${escMd(localTime)}\`\n\n` +
      '📍 برای تنظیم خودکار، دستور `/timezone` را بفرستید و دکمه *اشتراک موقعیت مکانی* را بزنید\\.\n\n' +
      'یا منطقه خود را از لیست زیر انتخاب کنید:'
    : l === 'ru'
    ? '🌍 *Настройки часового пояса*\n\n' +
      `Текущий пояс: *${escMd(settings.tzName)}*\n` +
      `Местное время: \`${escMd(localTime)}\`\n\n` +
      '📍 Отправьте команду `/timezone` и нажмите кнопку *Отправить локацию*, чтобы определить автоматически\\.\n\n' +
      'Или выберите свой регион ниже:'
    : '🌍 *Timezone Settings*\n\n' +
      `Your current timezone: *${escMd(settings.tzName)}*\n` +
      `Your current local time: \`${escMd(localTime)}\`\n\n` +
      '📍 To update your timezone from location, send `/timezone` and tap *Share Location*\\.\n\n' +
      'Or select your region manually below:';

  return {
    text: title,
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      ...tzButtons,
      [{ text: t(l, 'btn_back'), callback_data: 'menu:reminders' }],
    ]),
  };
}

// ─── Add To-Do Wizard Views ───────────────────────────────────────────────────

export function addTodoWizardView(lang = 'en') {
  const l = normalizeLang(lang);
  return {
    text: t(l, 'todo_wizard_title'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: t(l, 'todo_preset_groceries'), callback_data: `todo_preset:${t(l, 'todo_preset_groceries')}` },
        { text: t(l, 'todo_preset_emails'), callback_data: `todo_preset:${t(l, 'todo_preset_emails')}` },
      ],
      [
        { text: t(l, 'todo_preset_clean'), callback_data: `todo_preset:${t(l, 'todo_preset_clean')}` },
        { text: t(l, 'todo_preset_study'), callback_data: `todo_preset:${t(l, 'todo_preset_study')}` },
      ],
      [
        { text: t(l, 'todo_preset_call'), callback_data: `todo_preset:${t(l, 'todo_preset_call')}` },
        { text: t(l, 'todo_preset_workout'), callback_data: `todo_preset:${t(l, 'todo_preset_workout')}` },
      ],
      [
        { text: t(l, 'btn_custom_todo'), callback_data: 'todo_custom' },
      ],
      [
        { text: t(l, 'btn_back'), callback_data: 'menu:todos' },
        { text: t(l, 'btn_cancel'), callback_data: 'todo_cancel' },
      ],
    ]),
  };
}

export function todoCustomPromptView(lang = 'en') {
  const l = normalizeLang(lang);
  return {
    text: t(l, 'todo_custom_prompt'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_back_presets'), callback_data: 'todo:add' }],
      [{ text: t(l, 'btn_cancel'), callback_data: 'todo_cancel' }],
    ]),
  };
}

export function formatTodoSuccess(taskText, lang = 'en') {
  const l = normalizeLang(lang);
  const safeText = escMd(taskText);
  const bidiPrefix = (l === 'fa' || hasRtl(taskText)) ? '\u200F' : '';
  return {
    text: t(l, 'todo_added', { task: bidiPrefix + safeText + bidiPrefix }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_add_another_todo'), callback_data: 'todo:add' }],
      [{ text: t(l, 'btn_todos'), callback_data: 'menu:todos' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── Add Habit Wizard Views ──────────────────────────────────────────────────

export function addHabitWizardView(lang = 'en') {
  const l = normalizeLang(lang);
  return {
    text: t(l, 'habit_wizard_title'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: t(l, 'habit_preset_water'), callback_data: `habit_preset:${t(l, 'habit_preset_water')}` },
        { text: t(l, 'habit_preset_exercise'), callback_data: `habit_preset:${t(l, 'habit_preset_exercise')}` },
      ],
      [
        { text: t(l, 'habit_preset_reading'), callback_data: `habit_preset:${t(l, 'habit_preset_reading')}` },
        { text: t(l, 'habit_preset_meditate'), callback_data: `habit_preset:${t(l, 'habit_preset_meditate')}` },
      ],
      [
        { text: t(l, 'habit_preset_steps'), callback_data: `habit_preset:${t(l, 'habit_preset_steps')}` },
        { text: t(l, 'habit_preset_healthy'), callback_data: `habit_preset:${t(l, 'habit_preset_healthy')}` },
      ],
      [
        { text: t(l, 'habit_preset_sleep'), callback_data: `habit_preset:${t(l, 'habit_preset_sleep')}` },
        { text: t(l, 'habit_preset_noscreen'), callback_data: `habit_preset:${t(l, 'habit_preset_noscreen')}` },
      ],
      [
        { text: t(l, 'btn_custom_habit'), callback_data: 'habit_custom' },
      ],
      [
        { text: t(l, 'btn_back'), callback_data: 'menu:habits' },
        { text: t(l, 'btn_cancel'), callback_data: 'habit_cancel' },
      ],
    ]),
  };
}

export function habitCustomPromptView(lang = 'en') {
  const l = normalizeLang(lang);
  return {
    text: t(l, 'habit_custom_prompt'),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_back_presets'), callback_data: 'habit:add' }],
      [{ text: t(l, 'btn_cancel'), callback_data: 'habit_cancel' }],
    ]),
  };
}

export function formatHabitSuccess(habitName, lang = 'en') {
  const l = normalizeLang(lang);
  const safeName = escMd(habitName);
  const bidiPrefix = (l === 'fa' || hasRtl(habitName)) ? '\u200F' : '';
  return {
    text: t(l, 'habit_created', { habit: bidiPrefix + safeName + bidiPrefix }),
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [{ text: t(l, 'btn_checkin_now'), callback_data: 'menu:habits' }],
      [{ text: t(l, 'btn_add_another_habit'), callback_data: 'habit:add' }],
      [{ text: t(l, 'btn_main_menu'), callback_data: 'menu:main' }],
    ]),
  };
}

// ─── Task Details View ────────────────────────────────────────────────────────

export async function todoDetailView(chatId, todoId, userLang = null) {
  const settings = userLang ? { lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  const task = await db.select().from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.chatId, chatId)))
    .get();

  if (!task) {
    return todoView(chatId, userLang);
  }

  const isDone = Boolean(task.done);
  const statusEmoji = isDone ? '✅' : '⬜';
  let statusText = '';
  if (l === 'fa') {
    statusText = isDone ? 'انجام شده' : 'در انتظار انجام';
  } else if (l === 'ru') {
    statusText = isDone ? 'Выполнено' : 'В процессе';
  } else {
    statusText = isDone ? 'Completed' : 'Open / Incomplete';
  }

  let dueDisplay = task.dueDate || (task.dueTime ? `${task.dueDateRaw || ''} • ${task.dueTime}` : '');
  if (!dueDisplay) {
    dueDisplay = l === 'fa' ? 'تنظیم نشده' : l === 'ru' ? 'Не указан' : 'Not set';
  }

  const titleHeader = l === 'fa' ? '📝 *جزئیات کار*' : l === 'ru' ? '📝 *Детали задачи*' : '📝 *Task Details*';
  const labelStatus = l === 'fa' ? 'وضعیت:' : l === 'ru' ? 'Статус:' : 'Status:';
  const labelDue = l === 'fa' ? 'زمان سررسید:' : l === 'ru' ? 'Срок:' : 'Due:';

  const bidiPrefix = (l === 'fa' || hasRtl(task.text)) ? '\u200F' : '';

  const text =
    `${titleHeader}\n\n` +
    `${bidiPrefix}📌 *${escMd(task.text)}*\n\n` +
    `• *${labelStatus}* ${statusEmoji} ${escMd(statusText)}\n` +
    `• *${labelDue}* ⏰ ${escMd(dueDisplay)}`;

  const toggleBtnText = isDone
    ? (l === 'fa' ? '⬜ باز کردن مجدد' : l === 'ru' ? '⬜ Открыть снова' : '⬜ Mark as Open')
    : (l === 'fa' ? '✅ ثبت انجام' : l === 'ru' ? '✅ Завершить' : '✅ Mark Completed');

  const deleteBtnText = l === 'fa' ? '🗑 حذف کار' : l === 'ru' ? '🗑 Удалить задачу' : '🗑 Delete Task';
  const backBtnText = l === 'fa' ? '🔙 بازگشت به کارها' : l === 'ru' ? '🔙 Назад к задачам' : '🔙 Back to To-Dos';

  return {
    text,
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: toggleBtnText, callback_data: 'todotoggledetail:' + task.id },
        { text: deleteBtnText, callback_data: 'deltodo:' + task.id },
      ],
      [
        { text: backBtnText, callback_data: 'menu:todos' },
        { text: t(l, 'btn_main_menu'), callback_data: 'menu:main' },
      ],
    ]),
  };
}

// ─── Habit Details View ───────────────────────────────────────────────────────

export async function habitDetailView(chatId, habitId, userLang = null) {
  const settings = userLang ? { lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  const habit = await db.select().from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.chatId, chatId)))
    .get();

  if (!habit) {
    return habitView(chatId, userLang);
  }

  const doneToday = await db.select().from(checkins)
    .where(and(eq(checkins.habitId, habit.id), eq(checkins.day, today())))
    .get();

  const isDoneToday = Boolean(doneToday);
  const currentStreak = await streak(habit.id);
  const totalCount = await db.$count(checkins, eq(checkins.habitId, habit.id));

  const titleHeader = l === 'fa' ? '🔥 *جزئیات عادت*' : l === 'ru' ? '🔥 *Детали привычки*' : '🔥 *Habit Details*';
  const labelToday = l === 'fa' ? 'وضعیت امروز:' : l === 'ru' ? 'Сегодня:' : 'Today:';
  const labelStreak = l === 'fa' ? 'رکورد پیوستگی:' : l === 'ru' ? 'Серия:' : 'Streak:';
  const labelTotal = l === 'fa' ? 'مجموع ثبت‌ها:' : l === 'ru' ? 'Всего отметок:' : 'Total Check-ins:';
  const labelTarget = l === 'fa' ? 'هدف روزانه:' : l === 'ru' ? 'Цель:' : 'Daily Target:';

  let todayStatusText = '';
  if (l === 'fa') {
    todayStatusText = isDoneToday ? '✅ ثبت شده!' : '⬜ هنوز ثبت نشده';
  } else if (l === 'ru') {
    todayStatusText = isDoneToday ? '✅ Отмечено!' : '⬜ Еще не выполнено';
  } else {
    todayStatusText = isDoneToday ? '✅ Checked in today!' : '⬜ Not checked in yet';
  }

  const streakDaysText = l === 'fa' ? `${currentStreak} روز متوالی` : l === 'ru' ? `${currentStreak} дн. подряд` : `${currentStreak} day streak`;
  const totalCheckinsText = l === 'fa' ? `${totalCount} بار` : l === 'ru' ? `${totalCount} раз` : `${totalCount} times`;
  const targetText = habit.unit
    ? `${habit.target} ${habit.unit}`
    : `${habit.target} ${l === 'fa' ? 'بار در روز' : l === 'ru' ? 'раз в день' : 'times/day'}`;

  const bidiPrefix = (l === 'fa' || hasRtl(habit.name)) ? '\u200F' : '';

  const text =
    `${titleHeader}\n\n` +
    `${bidiPrefix}🌟 *${escMd(habit.name)}*\n\n` +
    `• *${labelToday}* ${escMd(todayStatusText)}\n` +
    `• *${labelStreak}* 🔥 ${escMd(streakDaysText)}\n` +
    `• *${labelTotal}* ✨ ${escMd(totalCheckinsText)}\n` +
    `• *${labelTarget}* 🎯 ${escMd(targetText)}`;

  const toggleBtnText = isDoneToday
    ? (l === 'fa' ? '⬜ لغو ثبت امروز' : l === 'ru' ? '⬜ Отменить отметку' : '⬜ Uncheck Today')
    : (l === 'fa' ? '🔥 ثبت انجام امروز' : l === 'ru' ? '🔥 Отметить сегодня' : '🔥 Check In Today');

  const deleteBtnText = l === 'fa' ? '🗑 حذف عادت' : l === 'ru' ? '🗑 Удалить привычку' : '🗑 Delete Habit';
  const backBtnText = l === 'fa' ? '🔙 بازگشت به عادت‌ها' : l === 'ru' ? '🔙 Назад к привычкам' : '🔙 Back to Habits';

  return {
    text,
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: toggleBtnText, callback_data: 'habittoggledetail:' + habit.id },
        { text: deleteBtnText, callback_data: 'delhabit:' + habit.id },
      ],
      [
        { text: backBtnText, callback_data: 'menu:habits' },
        { text: t(l, 'btn_main_menu'), callback_data: 'menu:main' },
      ],
    ]),
  };
}

// ─── Reminder Details View ───────────────────────────────────────────────────

export async function reminderDetailView(chatId, reminderId, userLang = null) {
  const settings = userLang ? { lang: userLang } : await getUserSettings(chatId);
  const l = normalizeLang(settings.lang);

  const r = await db.select().from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.chatId, chatId)))
    .get();

  if (!r) {
    return reminderListView(chatId, userLang);
  }

  let typeLabel = '';
  if (r.repeat) {
    if (r.repeatRate === '2_days') typeLabel = l === 'fa' ? '🔁 هر ۲ روز یکبار' : l === 'ru' ? '🔁 Каждые 2 дня' : '🔁 Every 2 days';
    else if (r.repeatRate === '3_days') typeLabel = l === 'fa' ? '🔁 هر ۳ روز یکبار' : l === 'ru' ? '🔁 Каждые 3 дня' : '🔁 Every 3 days';
    else if (r.repeatRate === 'weekly') typeLabel = l === 'fa' ? '🔁 هفتگی' : l === 'ru' ? '🔁 Еженедельно' : '🔁 Weekly';
    else typeLabel = l === 'fa' ? '🔁 روزانه (هر روز)' : l === 'ru' ? '🔁 Ежедневно' : '🔁 Daily';
  } else {
    typeLabel = l === 'fa' ? '⏰ یک‌باره (یک بار)' : l === 'ru' ? '⏰ Однократно' : '⏰ One-time (Once)';
  }

  let priorityText = '';
  if (r.priority === 'High') {
    priorityText = l === 'fa' ? '🔴 بالا (تکرار خودکار هر ۱۰ دقیقه)' : l === 'ru' ? '🔴 Высокий (повтор каждые 10 мин)' : '🔴 High (auto re-remind every 10m)';
  } else if (r.priority === 'Low') {
    priorityText = l === 'fa' ? '🔵 کم (تکرار خودکار هر ۱ ساعت)' : l === 'ru' ? '🔵 Низкий (повтор каждый 1 час)' : '🔵 Low (auto re-remind every 1h)';
  } else {
    priorityText = l === 'fa' ? '🟡 متوسط (تکرار خودکار هر ۳۰ دقیقه)' : l === 'ru' ? '🟡 Средний (повтор каждые 30 мин)' : '🟡 Medium (auto re-remind every 30m)';
  }

  let statusText = '';
  if (r.pendingAck) {
    statusText = l === 'fa' ? '⚠️ فعال — در انتظار تایید شما' : l === 'ru' ? '⚠️ Активно — ждёт подтверждения' : '⚠️ Active — Waiting for confirmation';
  } else if (r.fired) {
    statusText = l === 'fa' ? '✅ انجام شده / تایید شده' : l === 'ru' ? '✅ Выполнено / Подтверждено' : '✅ Completed / Acknowledged';
  } else {
    statusText = l === 'fa' ? '🔔 فعال و زمان‌بندی‌شده' : l === 'ru' ? '🔔 Активно и запланировано' : '🔔 Active & Scheduled';
  }

  const titleHeader = l === 'fa' ? '🔔 *جزئیات یادآور*' : l === 'ru' ? '🔔 *Детали напоминания*' : '🔔 *Reminder Details*';
  const labelTime = l === 'fa' ? 'ساعت:' : l === 'ru' ? 'Время:' : 'Time:';
  const labelFreq = l === 'fa' ? 'تکرار:' : l === 'ru' ? 'Частота:' : 'Frequency:';
  const labelPriority = l === 'fa' ? 'اولویت:' : l === 'ru' ? 'Приоритет:' : 'Priority:';
  const labelStatus = l === 'fa' ? 'وضعیت:' : l === 'ru' ? 'Статус:' : 'Status:';
  const tz = escMd(fmtOffset(r.tzOffset));

  const bidiPrefix = (l === 'fa' || hasRtl(r.text)) ? '\u200F' : '';

  const text =
    `${titleHeader}\n\n` +
    `${bidiPrefix}🔔 *${escMd(r.text)}*\n\n` +
    `• *${labelTime}* ⏰ ${escMd(r.timeHHMM)} \\(${tz}\\)\n` +
    `• *${labelFreq}* ${escMd(typeLabel)}\n` +
    `• *${labelPriority}* ${escMd(priorityText)}\n` +
    `• *${labelStatus}* ${escMd(statusText)}`;

  const isFired = Boolean(r.fired);
  const toggleBtnText = isFired
    ? (l === 'fa' ? '⬜ فعال‌سازی مجدد' : l === 'ru' ? '⬜ Активировать снова' : '⬜ Reactivate')
    : (l === 'fa' ? '✅ علامت انجام' : l === 'ru' ? '✅ Отметить выполненным' : '✅ Mark Done');

  const deleteBtnText = l === 'fa' ? '🗑 حذف یادآور' : l === 'ru' ? '🗑 Удалить' : '🗑 Delete';
  const backBtnText = l === 'fa' ? '🔙 بازگشت به یادآورها' : l === 'ru' ? '🔙 Назад к напоминаниям' : '🔙 Back to Reminders';

  return {
    text,
    parse_mode: 'MarkdownV2',
    reply_markup: redKeyboard([
      [
        { text: toggleBtnText, callback_data: 'remindertoggledetail:' + r.id },
        { text: deleteBtnText, callback_data: 'delremind:' + r.id },
      ],
      [
        { text: backBtnText, callback_data: 'menu:reminders' },
        { text: t(l, 'btn_main_menu'), callback_data: 'menu:main' },
      ],
    ]),
  };
}
