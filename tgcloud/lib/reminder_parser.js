import { parseTime, parseOffset, nextFireTimestamp, fmtOffset } from './reminders.js';

/**
 * Format local time HH:MM from a unix timestamp (UTC seconds) and tzOffset (minutes).
 */
export function getLocalHHMM(unixSec, tzOffsetMinutes) {
  const localDate = new Date((unixSec + tzOffsetMinutes * 60) * 1000);
  const h = String(localDate.getUTCHours()).padStart(2, '0');
  const m = String(localDate.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Format relative duration nicely (e.g. "in 30 minutes", "in 2 hours").
 */
export function fmtDuration(diffSec) {
  if (diffSec <= 0) return 'now';
  if (diffSec < 60) return `in ${diffSec}s`;
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `in ${mins} minute${mins === 1 ? '' : 's'}`;
  const hours = (diffSec / 3600).toFixed(diffSec % 3600 === 0 ? 0 : 1);
  if (diffSec < 86400) return `in ${hours} hour${hours === '1' ? '' : 's'}`;
  const days = Math.round(diffSec / 86400);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

/**
 * Parse a user reminder command or text message.
 * Supports:
 * - Legacy: "08:30 +3:30 daily Morning workout"
 * - Relative: "15m Take out trash", "in 2 hours Call doctor", "30min laundry"
 * - 24-hour time: "18:30 Dinner with friends", "daily 08:00 Stretch"
 * - 12-hour time: "9am Team standup", "9:30pm Read book", "at 5pm Gym"
 * - Tomorrow / Tonight: "tomorrow 10:00 Dentist", "tonight 21:00 Movie", "tomorrow morning Check emails"
 * - Natural text: "remind me in 30 minutes to check the oven"
 *
 * @param {string} rawInput - Text to parse
 * @param {number} defaultTzOffset - Default UTC offset in minutes for user
 * @returns {object|null} { text, timeHHMM, tzOffset, repeat, nextFire, relativeLabel, explicitTz } or null if invalid
 */
export function parseReminderInput(rawInput, defaultTzOffset = 210) {
  let str = (rawInput ?? '').trim();
  if (!str) return null;

  // 1. Strip leading "remind me (to/that)? " or "/remind "
  str = str.replace(/^\/remind\b\s*/i, '');
  str = str.replace(/^remind\s+(?:me\s+)?(?:to\s+|that\s+)?/i, '');
  str = str.trim();
  if (!str) return null;

  // 2. Check for legacy format:
  // HH:MM ±offset once|daily <text>
  const legacyMatch = str.match(/^(\d{1,2}:\d{2})\s+([+-]?\d{1,2}(?::\d{2})?)\s+(once|daily)\s+(.+)$/i);
  if (legacyMatch) {
    const [, timeStr, offsetStr, typeStr, reminderText] = legacyMatch;
    const hhmm = parseTime(timeStr);
    const tzOffset = parseOffset(offsetStr);
    if (hhmm && tzOffset !== null && reminderText.trim()) {
      const repeat = typeStr.toLowerCase() === 'daily';
      const nextFire = nextFireTimestamp(hhmm, tzOffset);
      const timeHHMM = `${String(hhmm.h).padStart(2, '0')}:${String(hhmm.m).padStart(2, '0')}`;
      return {
        text: reminderText.trim(),
        timeHHMM,
        tzOffset,
        repeat,
        nextFire,
        relativeLabel: repeat ? 'Daily' : fmtDuration(nextFire - Math.floor(Date.now() / 1000)),
        explicitTz: true,
      };
    }
  }

  let repeat = false;
  let repeatRate = 'once';
  let priority = 'Medium';
  let tzOffset = defaultTzOffset;
  let explicitTz = false;
  let forceTomorrow = false;

  // 3. Extract priority if present: e.g. "high", "urgent", "low", "medium"
  if (/\b(?:priority\s*:?\s*)?(high|urgent)\b|!high/i.test(str)) {
    priority = 'High';
    str = str.replace(/\b(?:priority\s*:?\s*)?(high|urgent)\b|!high/gi, ' ').trim();
  } else if (/\b(?:priority\s*:?\s*)?(low)\b|!low/i.test(str)) {
    priority = 'Low';
    str = str.replace(/\b(?:priority\s*:?\s*)?(low)\b|!low/gi, ' ').trim();
  } else if (/\b(?:priority\s*:?\s*)?(med|medium)\b|!med/i.test(str)) {
    priority = 'Medium';
    str = str.replace(/\b(?:priority\s*:?\s*)?(med|medium)\b|!med/gi, ' ').trim();
  }

  // 4. Extract explicit offset if present anywhere: e.g. "UTC+3:30", "+3:30", "GMT-5"
  const offsetMatch = str.match(/\b(?:UTC|GMT)?\s*([+-]\d{1,2}(?::\d{2})?)\b/i);
  if (offsetMatch) {
    const parsed = parseOffset(offsetMatch[1]);
    if (parsed !== null) {
      tzOffset = parsed;
      explicitTz = true;
      str = str.replace(offsetMatch[0], ' ').trim();
    }
  }

  // 5. Extract repetition keywords:
  if (/\b(?:every\s*2\s*days|2\s*days\s*once|every\s*other\s*day)\b/i.test(str)) {
    repeat = true;
    repeatRate = '2_days';
    str = str.replace(/\b(?:every\s*2\s*days|2\s*days\s*once|every\s*other\s*day)\b/gi, ' ').trim();
  } else if (/\b(?:every\s*3\s*days|3\s*days\s*once)\b/i.test(str)) {
    repeat = true;
    repeatRate = '3_days';
    str = str.replace(/\b(?:every\s*3\s*days|3\s*days\s*once)\b/gi, ' ').trim();
  } else if (/\b(weekly|every\s*week)\b/i.test(str)) {
    repeat = true;
    repeatRate = 'weekly';
    str = str.replace(/\b(weekly|every\s*week)\b/gi, ' ').trim();
  } else if (/\b(daily|every\s*day|everyday)\b/i.test(str)) {
    repeat = true;
    repeatRate = 'daily';
    str = str.replace(/\b(daily|every\s*day|everyday)\b/gi, ' ').trim();
  }

  // 5. Extract "tomorrow" or "tonight"
  if (/\btonight\b/i.test(str)) {
    str = str.replace(/\btonight\b/gi, ' ').trim();
    // If no specific time follows, default to 21:00
    if (!/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.test(str)) {
      str = '21:00 ' + str;
    }
  } else if (/\btomorrow\s+morning\b/i.test(str)) {
    forceTomorrow = true;
    str = str.replace(/\btomorrow\s+morning\b/gi, ' ').trim();
    if (!/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.test(str)) str = '09:00 ' + str;
  } else if (/\btomorrow\s+afternoon\b/i.test(str)) {
    forceTomorrow = true;
    str = str.replace(/\btomorrow\s+afternoon\b/gi, ' ').trim();
    if (!/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.test(str)) str = '14:00 ' + str;
  } else if (/\btomorrow\s+(?:evening|night)\b/i.test(str)) {
    forceTomorrow = true;
    str = str.replace(/\btomorrow\s+(?:evening|night)\b/gi, ' ').trim();
    if (!/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.test(str)) str = '20:00 ' + str;
  } else if (/\btomorrow\b/i.test(str)) {
    forceTomorrow = true;
    str = str.replace(/\btomorrow\b/gi, ' ').trim();
    if (!/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i.test(str)) str = '09:00 ' + str;
  }

  // 6. Check for relative delay: e.g. "15m", "in 30 minutes", "1.5h", "2 hours", "1d", "45s"
  // Format: [in ]<number> <unit> [to | - | :] <text>
  const relMatch = str.match(/^(?:in\s+)?(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)\b\s*(?:to\s+|-|:)?\s*(.*)$/i);
  if (relMatch) {
    const val = parseFloat(relMatch[1]);
    const unit = relMatch[2].toLowerCase();
    const remText = cleanReminderText(relMatch[3]);

    if (!remText) return null;

    let sec = 0;
    if (unit.startsWith('s')) sec = val;
    else if (unit.startsWith('m')) sec = val * 60;
    else if (unit.startsWith('h')) sec = val * 3600;
    else if (unit.startsWith('d')) sec = val * 86400;

    const now = Math.floor(Date.now() / 1000);
    const nextFire = now + Math.max(30, Math.round(sec));
    const timeHHMM = getLocalHHMM(nextFire, tzOffset);

    return {
      text: remText,
      timeHHMM,
      tzOffset,
      repeat: false,
      repeatRate: 'once',
      priority,
      nextFire,
      relativeLabel: fmtDuration(sec),
      explicitTz,
    };
  }

  // 7. Check for clock time (12-hour or 24-hour)
  // Check 12-hour: e.g. "9am", "9:30am", "9:30 pm", "at 5pm"
  const twelveHourMatch = str.match(/^(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b\s*(?:to\s+|-|:)?\s*(.*)$/i);
  if (twelveHourMatch) {
    let hour = parseInt(twelveHourMatch[1], 10);
    const min = parseInt(twelveHourMatch[2] ?? '0', 10);
    const mer = twelveHourMatch[3].toLowerCase();
    const remText = cleanReminderText(twelveHourMatch[4]);

    if (hour < 1 || hour > 12 || min < 0 || min > 59 || !remText) return null;

    if (mer === 'pm' && hour < 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;

    const hhmm = { h: hour, m: min };
    const nextFire = nextFireTimestamp(hhmm, tzOffset, forceTomorrow);
    const timeHHMM = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    return {
      text: remText,
      timeHHMM,
      tzOffset,
      repeat,
      repeatRate,
      priority,
      nextFire,
      relativeLabel: repeat ? (repeatRate === 'weekly' ? 'Weekly' : repeatRate === '2_days' ? 'Every 2 days' : repeatRate === '3_days' ? 'Every 3 days' : 'Daily') : fmtDuration(nextFire - Math.floor(Date.now() / 1000)),
      explicitTz,
    };
  }

  // Check 24-hour: e.g. "14:30", "at 08:00"
  const twentyFourMatch = str.match(/^(?:at\s+)?(\d{1,2}):(\d{2})\b\s*(?:to\s+|-|:)?\s*(.*)$/i);
  if (twentyFourMatch) {
    const hour = parseInt(twentyFourMatch[1], 10);
    const min = parseInt(twentyFourMatch[2], 10);
    const remText = cleanReminderText(twentyFourMatch[3]);

    if (hour < 0 || hour > 23 || min < 0 || min > 59 || !remText) return null;

    const hhmm = { h: hour, m: min };
    const nextFire = nextFireTimestamp(hhmm, tzOffset, forceTomorrow);
    const timeHHMM = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

    return {
      text: remText,
      timeHHMM,
      tzOffset,
      repeat,
      repeatRate,
      priority,
      nextFire,
      relativeLabel: repeat ? (repeatRate === 'weekly' ? 'Weekly' : repeatRate === '2_days' ? 'Every 2 days' : repeatRate === '3_days' ? 'Every 3 days' : 'Daily') : fmtDuration(nextFire - Math.floor(Date.now() / 1000)),
      explicitTz,
    };
  }

  return null;
}

/**
 * Remove leading "to ", "that ", "- ", ": " and extra whitespace.
 */
function cleanReminderText(s) {
  return (s ?? '')
    .trim()
    .replace(/^(?:to\s+|that\s+|-+\s*|:+\s*)/i, '')
    .trim();
}

/**
 * Parse an isolated time expression (for Step 2 of the reminder wizard).
 * Handles:
 * - Relative: "30m", "in 2 hours", "1.5h", "45s", "1d"
 * - Clock times: "18:30", "9am", "9:30pm", "at 5pm"
 * - Relative days: "tomorrow 10am", "tomorrow 18:00", "tonight 21:00"
 */
export function parseTimeOnly(rawText, defaultTzOffset = 210, repeat = false) {
  let s = (rawText ?? '').trim().toLowerCase();
  if (!s) return null;

  let forceTomorrow = false;
  if (s.startsWith('tomorrow')) {
    forceTomorrow = true;
    s = s.replace(/^tomorrow\s*(?:at\s*)?/i, '').trim();
    if (!s) s = '09:00';
  } else if (s.startsWith('tonight')) {
    s = s.replace(/^tonight\s*(?:at\s*)?/i, '').trim();
    if (!s) s = '21:00';
  }

  // 1. Relative delay: e.g. "30m", "in 2 hours", "45s"
  const rel = s.match(/^(?:in\s+)?(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/);
  if (rel) {
    const val = parseFloat(rel[1]);
    const u = rel[2];
    let sec = u.startsWith('s') ? val : u.startsWith('m') ? val * 60 : u.startsWith('h') ? val * 3600 : val * 86400;
    const now = Math.floor(Date.now() / 1000);
    const nextFire = now + Math.max(30, Math.round(sec));
    const timeHHMM = getLocalHHMM(nextFire, defaultTzOffset);
    return {
      timeHHMM,
      nextFire,
      label: fmtDuration(sec),
    };
  }

  // 2. 12-hour clock (e.g. "9am", "9:30pm", "at 5pm")
  const t12 = s.match(/^(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (t12) {
    let h = parseInt(t12[1], 10);
    const m = parseInt(t12[2] || '0', 10);
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (t12[3] === 'pm' && h < 12) h += 12;
    if (t12[3] === 'am' && h === 12) h = 0;
    const hhmm = { h, m };
    const nextFire = nextFireTimestamp(hhmm, defaultTzOffset, forceTomorrow);
    const timeHHMM = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = repeat ? `Daily at ${timeHHMM}` : (forceTomorrow ? `Tomorrow at ${timeHHMM}` : `At ${timeHHMM}`);
    return {
      timeHHMM,
      nextFire,
      label,
    };
  }

  // 3. 24-hour clock (e.g. "18:30", "at 08:00")
  const t24 = s.match(/^(?:at\s+)?(\d{1,2}):(\d{2})$/);
  if (t24) {
    const h = parseInt(t24[1], 10);
    const m = parseInt(t24[2], 10);
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    const hhmm = { h, m };
    const nextFire = nextFireTimestamp(hhmm, defaultTzOffset, forceTomorrow);
    const timeHHMM = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const label = repeat ? `Daily at ${timeHHMM}` : (forceTomorrow ? `Tomorrow at ${timeHHMM}` : `At ${timeHHMM}`);
    return {
      timeHHMM,
      nextFire,
      label,
    };
  }

  return null;
}
