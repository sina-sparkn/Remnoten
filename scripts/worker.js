#!/usr/bin/env node
// scripts/worker.js — Resilient background worker that periodically triggers due reminders via tgcloud
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveToken } from '@tgcloud/cli/src/core/credentials.js';
import { runFunction } from '@tgcloud/cli/src/api/endpoints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

process.chdir(projectRoot);

// 25 seconds interval is optimal: reliable reminder delivery without triggering /manage/run rate limits
const INTERVAL_MS = parseInt(process.env.REMINDER_INTERVAL_MS || '25000', 10);
const TIMEOUT_MS = 14000; // 14s timeout on network calls

let isRunning = false;
let shouldStop = false;
let cachedToken = null;
let lastStartTime = 0;
let backoffUntil = 0;
let checkCount = 0;

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function loadCronSources() {
  return {
    'endpoints/cron': fs.readFileSync(path.join(projectRoot, 'tgcloud/endpoints/cron.js'), 'utf8'),
    'lib/reminders': fs.readFileSync(path.join(projectRoot, 'tgcloud/lib/reminders.js'), 'utf8'),
    'schema': fs.readFileSync(path.join(projectRoot, 'tgcloud/schema.js'), 'utf8'),
  };
}

// Wrap any promise with a strict timeout
function withTimeout(promise, ms, desc = 'Timeout') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${desc} after ${ms}ms`)), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}

async function checkReminders() {
  if (shouldStop) return;

  const now = Date.now();

  // If rate limited, wait until backoff period passes
  if (now < backoffUntil) {
    const remaining = Math.ceil((backoffUntil - now) / 1000);
    // Silent wait during backoff
    return;
  }

  // Watchdog: If previous check has been running for more than 20s, force-reset it
  if (isRunning) {
    if (now - lastStartTime > 20000) {
      console.warn(`[${timestamp()}] ⚠️ Watchdog: Previous check hung for ${Math.round((now - lastStartTime)/1000)}s — force resetting isRunning flag.`);
      isRunning = false;
    } else {
      return;
    }
  }

  isRunning = true;
  lastStartTime = Date.now();

  try {
    if (!cachedToken) {
      cachedToken = await withTimeout(resolveToken(), 5000, 'resolveToken');
    }

    const sources = loadCronSources();

    const res = await withTimeout(
      runFunction(cachedToken, 'endpoints/cron', sources, {}, {}),
      TIMEOUT_MS,
      'runFunction(endpoints/cron)'
    );

    const remindersFired = res?.result?.remindersFired ?? 0;
    const taskRemindersFired = res?.result?.taskRemindersFired ?? 0;
    const totalFired = remindersFired + taskRemindersFired;
    checkCount++;
    if (totalFired > 0) {
      console.log(`[${timestamp()}] 🔔 Fired ${remindersFired} reminder(s) and ${taskRemindersFired} task reminder(s) successfully!`);
    } else if (checkCount === 1 || checkCount % 4 === 0) {
      console.log(`[${timestamp()}] 💓 Heartbeat: Reminder check #${checkCount} OK (0 due, uptime: ${Math.round(process.uptime())}s)`);
    }
  } catch (err) {
    const errMsg = err?.message || String(err);

    // Handle 401 Unauthorized -> clear token cache
    if (errMsg.includes('Unauthorized') || errMsg.includes('401')) {
      cachedToken = null;
      console.warn(`[${timestamp()}] ⚠️ Auth error, refreshing credentials next check.`);
    }

    // Handle 429 Too many requests -> back off
    if (errMsg.includes('Too many requests') || errMsg.includes('429')) {
      const match = errMsg.match(/retry after (\d+)/i);
      const waitSeconds = match ? parseInt(match[1], 10) : 10;
      backoffUntil = Date.now() + (waitSeconds + 3) * 1000;
      console.warn(`[${timestamp()}] ⏳ Rate limit reached. Backing off for ${waitSeconds + 3}s.`);
    } else {
      console.error(`[${timestamp()}] ⚠️ Check failed: ${errMsg}`);
    }
  } finally {
    isRunning = false;
  }
}

console.log(`[${timestamp()}] 🚀 Habit Bot Reminder Worker active (interval: ${INTERVAL_MS / 1000}s, timeout: ${TIMEOUT_MS / 1000}s)`);
console.log(`[${timestamp()}] Press Ctrl+C to stop.`);

// Initial check
checkReminders();

// Recurring timer
const timer = setInterval(checkReminders, INTERVAL_MS);

function shutdown() {
  if (shouldStop) return;
  shouldStop = true;
  console.log(`\n[${timestamp()}] 🛑 Stopping Reminder Worker...`);
  clearInterval(timer);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
