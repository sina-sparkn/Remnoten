import { api } from 'sdk';

let configured = false;

/**
 * Configure the bot's pre-start welcome description, short description,
 * and command list in Telegram for EN, FA, RU.
 */
export async function ensureBotConfigured() {
  if (configured) return;
  try {
    const enCommands = [
      { command: 'app', description: 'Open Remnoten Mini App' },
      { command: 'start', description: 'Start the bot and open main menu' },
      { command: 'menu', description: 'Show main menu' },
      { command: 'add', description: 'Add a to-do (tap or /add [task])' },
      { command: 'todos', description: 'Show your to-dos' },
      { command: 'habit', description: 'Add a habit (tap or /habit [name])' },
      { command: 'habits', description: 'List your habits & check in' },
      { command: 'remind', description: 'Set a reminder: /remind [time] [task]' },
      { command: 'reminders', description: 'List & manage your active reminders' },
      { command: 'language', description: 'Change language (EN / فارسی / Русский)' },
      { command: 'timezone', description: 'View or change your timezone' },
      { command: 'stats', description: 'View habit streaks & to-do stats' },
      { command: 'help', description: 'Show help & command instructions' },
    ];

    const faCommands = [
      { command: 'app', description: 'باز کردن مینی‌اپ Remnoten' },
      { command: 'start', description: 'شروع ربات و باز کردن منوی اصلی' },
      { command: 'menu', description: 'نمایش منوی اصلی' },
      { command: 'add', description: 'افزودن کار جدید' },
      { command: 'todos', description: 'مشاهده لیست کارهای باز' },
      { command: 'habit', description: 'ایجاد عادت روزانه جدید' },
      { command: 'habits', description: 'مشاهده عادت‌ها و ثبت رکورد' },
      { command: 'remind', description: 'تنظیم یادآور هوشمند' },
      { command: 'reminders', description: 'مشاهده و مدیریت یادآورها' },
      { command: 'language', description: 'تغییر زبان ربات' },
      { command: 'timezone', description: 'تنظیم موقعیت و منطقه زمانی' },
      { command: 'stats', description: 'گزارش آمار و رکوردهای پیوستگی' },
      { command: 'help', description: 'راهنما و آموزش دستورات' },
    ];

    const ruCommands = [
      { command: 'app', description: 'Открыть приложение Remnoten' },
      { command: 'start', description: 'Запустить бота и открыть главное меню' },
      { command: 'menu', description: 'Главное меню' },
      { command: 'add', description: 'Добавить задачу' },
      { command: 'todos', description: 'Мои задачи' },
      { command: 'habit', description: 'Добавить привычку' },
      { command: 'habits', description: 'Мои привычки и серии' },
      { command: 'remind', description: 'Создать напоминание' },
      { command: 'reminders', description: 'Список активных напоминаний' },
      { command: 'language', description: 'Выбрать язык (EN / فارسی / Русский)' },
      { command: 'timezone', description: 'Часовой пояс' },
      { command: 'stats', description: 'Статистика задач и привычек' },
      { command: 'help', description: 'Справка и команды' },
    ];

    await Promise.allSettled([
      // Native Mini App Menu Button next to message input in Telegram
      api.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Open',
          web_app: { url: 'https://app8837501303.tgcloud.ai' },
        },
      }),

      // Command lists
      api.setMyCommands({ commands: enCommands }),
      api.setMyCommands({ commands: faCommands, language_code: 'fa' }),
      api.setMyCommands({ commands: ruCommands, language_code: 'ru' }),

      // Pre-start description ("What can this bot do?" section before clicking Start)
      api.setMyDescription({
        description: "I'm your personal Habit & To-Do bot.\n\n🔥 Track daily habits and build streaks\n✅ Manage your to-do list (To-Do)\n🔔 Set one-time or daily reminders\n📊 Check your progress stats",
      }),
      api.setMyDescription({
        description: "من ربات دستیار شخصی شما برای عادت‌ها و کارها هستم.\n\n🔥 پیگیری عادت‌های روزانه و حفظ رکورد\n✅ مدیریت آسان لیست کارها (To-Do)\n🔔 تنظیم یادآورهای یک‌باره یا روزانه\n📊 گزارش آماری از پیشرفت شما",
        language_code: 'fa',
      }),
      api.setMyDescription({
        description: "Я ваш личный бот для привычек и задач.\n\n🔥 Отслеживайте полезные привычки и серии дней\n✅ Управляйте списками задач (To-Do)\n🔔 Устанавливайте разовые или ежедневные напоминания\n📊 Смотрите статистику прогресса",
        language_code: 'ru',
      }),

      // Short description (bot profile bio)
      api.setMyShortDescription({
        short_description: "Your personal Habit Tracker, To-Dos & Smart Reminders bot.",
      }),
      api.setMyShortDescription({
        short_description: "دستیار هوشمند پیگیری عادت‌ها، مدیریت کارها و یادآورها",
        language_code: 'fa',
      }),
      api.setMyShortDescription({
        short_description: "Трекер привычек, список задач и умные напоминания",
        language_code: 'ru',
      }),
    ]);
    configured = true;
  } catch {
    // If rate-limited or transient failure, ignore
  }
}
