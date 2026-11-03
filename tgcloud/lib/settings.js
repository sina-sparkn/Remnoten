import { db } from 'sdk';
import { eq } from 'sdk/db';
import { userSettings, reminders, todos, habits } from '../schema.js';
import { fmtOffset } from './reminders.js';
import { normalizeLang } from './i18n.js';

export const TIMEZONE_OPTIONS = [
  { label: '🇮🇷 Iran (UTC+3:30)', offset: 210, name: 'UTC+3:30 (Iran)' },
  { label: '🇬🇧 London / UTC (UTC+0)', offset: 0, name: 'UTC+0 (London/UTC)' },
  { label: '🇪🇺 Central Europe (UTC+1)', offset: 60, name: 'UTC+1 (Paris/Berlin)' },
  { label: '🇪🇺 Eastern Europe (UTC+2)', offset: 120, name: 'UTC+2 (Cairo/Athens)' },
  { label: '🇷🇺 Moscow / Riyadh (UTC+3)', offset: 180, name: 'UTC+3 (Moscow/Riyadh)' },
  { label: '🇦🇪 Dubai (UTC+4)', offset: 240, name: 'UTC+4 (Dubai)' },
  { label: '🇮🇳 India (UTC+5:30)', offset: 330, name: 'UTC+5:30 (India)' },
  { label: '🇸🇬 Singapore (UTC+8)', offset: 480, name: 'UTC+8 (Singapore/Beijing)' },
  { label: '🇯🇵 Tokyo (UTC+9)', offset: 540, name: 'UTC+9 (Tokyo)' },
  { label: '🇦🇺 Sydney (UTC+10)', offset: 600, name: 'UTC+10 (Sydney)' },
  { label: '🇺🇸 US Eastern (UTC-5)', offset: -300, name: 'UTC-5 (New York)' },
  { label: '🇺🇸 US Pacific (UTC-8)', offset: -480, name: 'UTC-8 (Los Angeles)' },
];

export function findTimezoneByOffset(offsetMinutes) {
  const matched = TIMEZONE_OPTIONS.find(tz => tz.offset === offsetMinutes);
  if (matched) return matched.name;
  return fmtOffset(offsetMinutes);
}

/**
 * Get user settings. Detects if user has already onboarded or used the bot before.
 * Returns { chatId, tzOffset, tzName, state, onboarded: boolean, lang: 'en'|'fa'|'ru' }
 */
export async function getUserSettings(chatId, clientLang = null) {
  const row = await db.select().from(userSettings).where(eq(userSettings.chatId, chatId)).get();
  let state = null;
  if (row?.state) {
    try {
      state = JSON.parse(row.state);
    } catch {
      state = null;
    }
  }

  const lang = row?.lang || normalizeLang(clientLang);

  // If user row exists (and is a valid user chat ID), they have already onboarded or started
  if (row && row.chatId !== 0) {
    const tzOffset = row.tzOffset ?? 210;
    const tzName = row.tzName || findTimezoneByOffset(tzOffset);
    if (!row.tzName || !row.lang) {
      await setUserTimezone(chatId, tzOffset, tzName, lang);
    }
    return { chatId, tzOffset, tzName, state, onboarded: true, lang };
  }

  // Check if user already has data in the bot from earlier usage
  const lastRemind = await db.select().from(reminders)
    .where(eq(reminders.chatId, chatId))
    .limit(1)
    .get();

  const hasHistory = !!lastRemind
    || !!(await db.select().from(todos).where(eq(todos.chatId, chatId)).limit(1).get())
    || !!(await db.select().from(habits).where(eq(habits.chatId, chatId)).limit(1).get());

  if (hasHistory) {
    const tzOffset = lastRemind ? lastRemind.tzOffset : (row?.tzOffset ?? 210);
    const tzName = findTimezoneByOffset(tzOffset);
    // Mark onboarded permanently in userSettings so location is never asked again
    await setUserTimezone(chatId, tzOffset, tzName, lang);
    return { chatId, tzOffset, tzName, state, onboarded: true, lang };
  }

  // Brand-new user: not onboarded yet
  return { chatId, tzOffset: 210, tzName: 'UTC+3:30 (Iran)', state: null, onboarded: false, lang };
}

/**
 * Save user timezone.
 */
export async function setUserTimezone(chatId, tzOffset, tzName = null, lang = null) {
  const name = tzName || findTimezoneByOffset(tzOffset);
  const values = { chatId, tzOffset, tzName: name };
  const updateSet = { tzOffset, tzName: name };
  if (lang) {
    values.lang = lang;
    updateSet.lang = lang;
  }
  await db.insert(userSettings).values(values).onConflictDoUpdate({
    target: userSettings.chatId,
    set: updateSet,
  }).run();
}

/**
 * Save user preferred language ('en', 'fa', 'ru').
 */
export async function setUserLanguage(chatId, lang) {
  const validLang = normalizeLang(lang);
  await db.insert(userSettings).values({
    chatId,
    lang: validLang,
  }).onConflictDoUpdate({
    target: userSettings.chatId,
    set: { lang: validLang },
  }).run();
}

/**
 * Set user wizard state.
 */
export async function setUserState(chatId, stateObj) {
  const stateStr = stateObj ? JSON.stringify(stateObj) : null;
  await db.insert(userSettings).values({
    chatId,
    state: stateStr,
  }).onConflictDoUpdate({
    target: userSettings.chatId,
    set: { state: stateStr },
  }).run();
}

/**
 * Clear user state.
 */
export async function clearUserState(chatId) {
  await db.update(userSettings).set({ state: null }).where(eq(userSettings.chatId, chatId)).run();
}
