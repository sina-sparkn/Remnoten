import { fireDueReminders, fireUpcomingTaskReminders } from '../lib/reminders.js';

export default async function () {
  const reminderCount = await fireDueReminders();
  const taskReminderCount = await fireUpcomingTaskReminders();
  return {
    ok: true,
    remindersFired: reminderCount,
    taskRemindersFired: taskReminderCount,
    timestamp: Math.floor(Date.now() / 1000),
  };
}
