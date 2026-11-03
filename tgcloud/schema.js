import { table, integer, text, boolean, sql } from 'sdk/db';

export const todos = table('todos', {
  id:              integer('id').primaryKey({ autoIncrement: true }),
  chatId:          integer('chat_id').notNull(),
  text:            text('text').notNull(),
  done:            boolean('done').default(false),
  dueDate:         text('due_date'),
  dueDateRaw:      text('due_date_raw'),            // "YYYY-MM-DD"
  dueTime:         text('due_time'),                // "HH:MM"
  dueTimestamp:    integer('due_timestamp'),        // Unix timestamp (UTC seconds) when task is due
  remindBefore:    text('remind_before').default('none'), // 'none', 'at_due', '15m', '1h', '4h', '1d', 'custom'
  remindTimestamp: integer('remind_timestamp'),     // Unix timestamp (UTC seconds) when reminder should fire
  remindNotified:  boolean('remind_notified').default(false), // true if reminder was sent
  overdueNotified: boolean('overdue_notified').default(false), // true if overdue reminder was sent
  priority:        text('priority').default('Medium'),
  repeat:          text('repeat').default('None'),
  created:         integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const habits = table('habits', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  chatId:    integer('chat_id').notNull(),
  name:      text('name').notNull(),
  icon:      text('icon').default('dumbbell'),
  target:    integer('target').default(1),
  unit:      text('unit'),
  frequency: text('frequency').default('Daily'),
});

export const checkins = table('checkins', {
  id:      integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull(),
  day:     text('day').notNull(), // YYYY-MM-DD (UTC)
});

// Reminders table — one-time or repeating notifications
export const reminders = table('reminders', {
  id:         integer('id').primaryKey({ autoIncrement: true }),
  chatId:     integer('chat_id').notNull(),
  text:       text('text').notNull(),            // reminder message
  timeHHMM:   text('time_hhmm').notNull(),       // "HH:MM" in user's local time
  tzOffset:   integer('tz_offset').notNull(),    // user UTC offset in minutes (e.g. +210 for UTC+3:30)
  repeat:     boolean('repeat').default(false),  // true = repeating, false = one-time
  repeatRate: text('repeat_rate').default('daily'), // 'once', 'daily', '2_days', '3_days', 'weekly'
  priority:   text('priority').default('Medium'),   // 'Low', 'Medium', 'High'
  pendingAck: boolean('pending_ack').default(false), // true if waiting for user acknowledgement
  lastMsgId:  integer('last_msg_id'),            // message_id of the last sent reminder notification
  nextFire:   integer('next_fire').notNull(),    // unix timestamp (UTC) of next trigger
  fired:      boolean('fired').default(false),   // true = one-time already sent
  enabled:    boolean('enabled').default(true),
  icon:       text('icon').default('bell'),
});

// User settings & interactive wizard state
export const userSettings = table('user_settings', {
  chatId:   integer('chat_id').primaryKey(),
  tzOffset: integer('tz_offset').default(0),
  tzName:   text('tz_name'),
  state:    text('state'),
  lang:     text('lang').default('en'),
});
