// lib/i18n.js — Multi-language support (English, Persian/فارسی, Russian/Русский)

export const SUPPORTED_LANGS = ['en', 'fa', 'ru'];

export function normalizeLang(code) {
  if (!code) return 'en';
  const c = String(code).toLowerCase();
  if (c.startsWith('fa') || c === 'per' || c === 'farsi') return 'fa';
  if (c.startsWith('ru') || c === 'rus') return 'ru';
  return 'en';
}

export const STRINGS = {
  en: {
    // Buttons
    btn_back: '🔙 Back',
    btn_cancel: '❌ Cancel',
    btn_main_menu: '🏠 Main Menu',
    btn_todos: '✅ My To-Dos',
    btn_habits: '🔥 My Habits',
    btn_reminders: '🔔 Reminders',
    btn_stats: '📊 Stats',
    btn_help: '❓ Help',
    btn_language: '🌐 Language',
    btn_timezone: '🌍 Timezone',
    btn_skip: '⏭ Skip for now',
    btn_share_loc: '📍 Share Location (Set Timezone)',
    btn_add_todo: '➕ Add To-Do',
    btn_add_another_todo: '➕ Add Another To-Do',
    btn_custom_todo: '✏️ Type Custom Task',
    btn_add_habit: '➕ Add Habit',
    btn_add_another_habit: '➕ Add Another Habit',
    btn_checkin_now: '🔥 Check In Now',
    btn_custom_habit: '✏️ Type Custom Habit',
    btn_add_reminder: '➕ Set Reminder',
    btn_set_another_reminder: '➕ Set Another',
    btn_snooze: '💤 Snooze 15m',
    btn_to_todo: '📝 Add to To-Dos',
    btn_ack: '👍 OK',
    btn_onetime: '⏰ One-time (Once)',
    btn_daily: '🔁 Daily (Every day)',
    btn_2_days: '🔁 Every 2 Days',
    btn_3_days: '🔁 Every 3 Days',
    btn_weekly: '🔁 Weekly',
    type_onetime: '⏰ One\\-time',
    type_daily: '🔁 Daily',
    type_2_days: '🔁 Every 2 Days',
    type_3_days: '🔁 Every 3 Days',
    type_weekly: '🔁 Weekly',
    btn_priority_high: '🔴 High (every 10m)',
    btn_priority_medium: '🟡 Medium (every 30m)',
    btn_priority_low: '🔵 Low (every 1h)',
    priority_high: '🔴 High',
    priority_medium: '🟡 Medium',
    priority_low: '🔵 Low',
    btn_custom_time: '✏️ Enter Custom Time',
    btn_back_presets: '🔙 Back to Presets',

    // Presets - Todos
    todo_preset_groceries: '🛒 Groceries',
    todo_preset_emails: '📧 Check Emails',
    todo_preset_clean: '🧹 Clean Room',
    todo_preset_study: '📚 Study / Read',
    todo_preset_call: '📞 Phone Call',
    todo_preset_workout: '💪 Workout',

    // Presets - Habits
    habit_preset_water: '💧 Drink Water',
    habit_preset_exercise: '🏃 Exercise',
    habit_preset_reading: '📖 Read 15 Mins',
    habit_preset_meditate: '🧘 Meditate',
    habit_preset_steps: '🚶 10,000 Steps',
    habit_preset_healthy: '🥗 Eat Healthy',
    habit_preset_sleep: '🛌 Sleep Early',
    habit_preset_noscreen: '📵 No Screen Time',

    // Presets - Reminder Times
    time_15m: '⚡ in 15m',
    time_30m: '⚡ in 30m',
    time_1h: '⚡ in 1h',
    time_2h: '⚡ in 2h',
    time_tonight: '🌙 Tonight 21:00',
    time_tomorrow: '☀️ Tomorrow 09:00',
    time_morning: '🌅 Morning 08:00',
    time_noon: '☀️ Noon 12:00',
    time_evening: '🌆 Evening 18:00',
    time_night: '🌙 Night 21:00',

    // Main Menu
    menu_title: '🏠 *Main Menu*\n\nWhat would you like to do?',

    // Language Menu
    lang_menu_title: '🌐 *Language Settings*\n\nChoose your preferred language:',
    lang_changed: '✅ Language changed to English!',

    // Welcome Screen
    welcome_title: 'I\'m your personal *Habit & To\\-Do* bot\\.\n\n🔥 Track daily habits and build streaks\n✅ Manage your to\\-do list\n🔔 Set one\\-time or daily reminders\n📊 Check your progress stats',
    welcome_prompt_loc: '📍 *Please share your location below* so I can set your local timezone automatically\\!',
    welcome_use_menu: 'Use the menu below to get started\\!',
    loc_received: '📍 *Location Received\\!*\n\n🌍 *Timezone set to:* `{tzName}`\n🕐 *Local time:* `{localTime}`\n\nAll your reminders will now accurately trigger at your local time\\!',
    loc_skipped: '👍 Timezone set to default \\({tzName}\\)\\. You can change it anytime in Settings\\.',

    // To-Dos
    todo_list_title: '✅ *Your To\\-Dos*\n\nTap a task to mark it complete \\(🗑 to delete\\):',
    todo_empty: '✅ *Your To\\-Dos*\n\nNo open tasks\\! Tap *Add To\\-Do* below to create one:',
    todo_wizard_title: '📝 *Add a New To\\-Do*\n\nChoose a common task below, or *type any task description* directly in this chat\\:\n\n_Example: Buy groceries, Finish report, Call dentist_',
    todo_custom_prompt: '✏️ *Type Your Task*\n\nPlease send a message with your task name in this chat\\.\n\n_Example: Review project proposal, Pick up package_',
    todo_added: '✅ *To\\-Do Added\\!*\n\n📝 *{task}*\n\nTap below to add another task or view your to\\-do list:',
    todo_cancelled: '❌ Add to\\-do cancelled\\.',
    toast_task_done: '✅ Task completed!',
    toast_task_deleted: '🗑 Task deleted.',

    // Habits
    habit_list_title: '🔥 *Your Habits*\n\nTap to check in today \\(🗑 to delete\\):',
    habit_empty: '🔥 *Your Habits*\n\nNo habits yet\\! Tap *Add Habit* below to get started:',
    habit_wizard_title: '🔥 *Add a New Habit*\n\nChoose a popular habit below, or *type any habit name* directly in this chat\\:\n\n_Build daily momentum by tracking your streaks\\!_',
    habit_custom_prompt: '✏️ *Type Your Habit*\n\nPlease send a message with your habit name in this chat\\.\n\n_Example: Practice Guitar, Morning Walk, Journaling_',
    habit_created: '🔥 *Habit Created\\!*\n\n🌟 *{habit}*\n\nBuild your streak by checking in every day\\!',
    habit_cancelled: '❌ Add habit cancelled\\.',
    toast_habit_checked: '🔥 Checked in!',
    toast_habit_already: '✔️ Already checked in today!',
    toast_habit_deleted: '🗑 Habit deleted.',

    // Reminders
    reminder_list_title: '🔔 *Your Reminders*\n\nTap 🗑 to cancel a reminder:',
    reminder_empty: '🔔 *Your Reminders*\n\nNo active reminders\\! Tap *Set Reminder* below:',
    reminder_step1_title: '🔔 *New Reminder — Step 1 of 4*\n\nHow often should this reminder repeat?',
    reminder_step2_title: '🔔 *New Reminder — Step 2 of 4*\n\n📅 *Frequency:* {type}\n\nWhen would you like to be reminded?',
    reminder_step3_priority_title: '🔔 *New Reminder — Step 3 of 4*\n\n📅 *Frequency:* {type}\n🕐 *Time:* {time}\n\n*Select Reminder Priority:*\nIf you don\'t tap a button when notified, how often should I re\\-remind you?\n\n🔴 *High:* Auto re\\-remind every 10 min\n🟡 *Medium:* Auto re\\-remind every 30 min\n🔵 *Low:* Auto re\\-remind every 1 hour',
    reminder_step3_title: '🔔 *New Reminder — Step 4 of 4*\n\n📅 *Frequency:* {type}\n🕐 *Time:* {time}\n⚡ *Priority:* {priority}\n\nWhat would you like to be reminded about?\n\n_Please type your reminder message below:_',
    reminder_step4_title: '🔔 *New Reminder — Step 4 of 4*\n\n📅 *Frequency:* {type}\n🕐 *Time:* {time}\n⚡ *Priority:* {priority}\n\nWhat would you like to be reminded about?\n\n_Please type your reminder message below:_',
    reminder_custom_time_prompt: '✏️ *Enter Custom Time*\n\nPlease send a message with the time in this chat\\.\n\n{examples}',
    reminder_set: '✅ *Reminder set\\!*\n\n🔔 *{text}*\n🕐 *When:* {when}\n📅 *Frequency:* {type}\n⚡ *Priority:* {priority}',
    reminder_cancelled: '❌ Reminder setup cancelled\\.',
    reminder_alert_title: '⏰ *REMINDER*',
    toast_snoozed: '💤 Snoozed for {min} minutes!',
    toast_reminder_deleted: '🗑 Reminder deleted.',
    toast_reminder_ack: '👍 Reminder acknowledged!',

    // Stats
    stats_empty: '📊 *Your Stats*\n\nNothing tracked yet\\! Use the menu to add habits or tasks\\.',
    stats_todos_line: '📝 *To\\-Dos:* {open} open · {done} done',
    stats_streak_title: '\n🔥 *Habit Streaks:*',
    stats_streak_item: '  • {name}: 🔥{streak} day streak · {total} total check\\-ins',

    // Help
    help_text:
      '❓ *Help & Commands*\n\n' +
      '📋 *To\\-Do Commands:*\n' +
      '`/add` — interactive to\\-do menu \\(or `/add <task>`\\)\n' +
      '`/todos` or `/list` — view open tasks\n\n' +
      '🔥 *Habit Commands:*\n' +
      '`/habit` — interactive habit menu \\(or `/habit <name>`\\)\n' +
      '`/habits` — show your habits & streaks\n\n' +
      '🔔 *Reminder Commands:*\n' +
      '`/remind` — interactive 3\\-step reminder wizard\n' +
      '`/remind <time> <task>` — set reminder quickly:\n' +
      '  • `/remind 30m Check oven`\n' +
      '  • `/remind 18:30 Dinner`\n' +
      '  • `/remind tomorrow 10am Dentist`\n' +
      '  • `/remind daily 08:00 Morning workout`\n' +
      '`/reminders` — view and manage your reminders\n' +
      '`/timezone` — view or change your timezone\n' +
      '`/language` — change bot language\n\n' +
      '📊 *Other:*\n' +
      '`/stats` — view your stats\n' +
      '`/start` or `/menu` — show main menu\n\n' +
      '_Tap buttons to create to\\-dos, build habits, or set reminders\\!_',
  },

  fa: {
    // Buttons
    btn_back: '🔙 بازگشت',
    btn_cancel: '❌ لغو',
    btn_main_menu: '🏠 منوی اصلی',
    btn_todos: '✅ کارهای من',
    btn_habits: '🔥 عادت‌های من',
    btn_reminders: '🔔 یادآورها',
    btn_stats: '📊 آمار و ارقام',
    btn_help: '❓ راهنما',
    btn_language: '🌐 تغییر زبان',
    btn_timezone: '🌍 منطقه زمانی',
    btn_skip: '⏭ فعلاً رد شدن',
    btn_share_loc: '📍 اشتراک موقعیت مکانی (تنظیم منطقه زمانی)',
    btn_add_todo: '➕ افزودن کار',
    btn_add_another_todo: '➕ افزودن کار دیگر',
    btn_custom_todo: '✏️ نوشتن کار دلخواه',
    btn_add_habit: '➕ افزودن عادت',
    btn_add_another_habit: '➕ افزودن عادت دیگر',
    btn_checkin_now: '🔥 ثبت برای امروز',
    btn_custom_habit: '✏️ نوشتن عادت دلخواه',
    btn_add_reminder: '➕ تنظیم یادآور',
    btn_set_another_reminder: '➕ تنظیم یک یادآور دیگر',
    btn_snooze: '💤 ۱۵ دقیقه تعویق',
    btn_to_todo: '📝 افزودن به کارها',
    btn_ack: '👍 متوجه شدم',
    btn_onetime: '⏰ یک‌باره (یک بار)',
    btn_daily: '🔁 روزانه (هر روز)',
    btn_2_days: '🔁 هر ۲ روز یکبار',
    btn_3_days: '🔁 هر ۳ روز یکبار',
    btn_weekly: '🔁 هفتگی',
    type_onetime: '⏰ یک‌باره',
    type_daily: '🔁 روزانه',
    type_2_days: '🔁 هر ۲ روز',
    type_3_days: '🔁 هر ۳ روز',
    type_weekly: '🔁 هفتگی',
    btn_priority_high: '🔴 بالا (هر ۱۰ دقیقه)',
    btn_priority_medium: '🟡 متوسط (هر ۳۰ دقیقه)',
    btn_priority_low: '🔵 کم (هر ۱ ساعت)',
    priority_high: '🔴 بالا',
    priority_medium: '🟡 متوسط',
    priority_low: '🔵 کم',
    btn_custom_time: '✏️ وارد کردن زمان دلخواه',
    btn_back_presets: '🔙 بازگشت به زمان‌های پیشنهادی',

    // Presets - Todos
    todo_preset_groceries: '🛒 خرید روزانه',
    todo_preset_emails: '📧 بررسی ایمیل‌ها',
    todo_preset_clean: '🧹 تمیزکاری اتاق',
    todo_preset_study: '📚 مطالعه و درس',
    todo_preset_call: '📞 تماس تلفنی',
    todo_preset_workout: '💪 ورزش و تمرین',

    // Presets - Habits
    habit_preset_water: '💧 نوشیدن آب',
    habit_preset_exercise: '🏃 ورزش روزانه',
    habit_preset_reading: '📖 ۱۵ دقیقه مطالعه',
    habit_preset_meditate: '🧘 مدیتیشن و آرامش',
    habit_preset_steps: '🚶 ۱۰ هزار قدم',
    habit_preset_healthy: '🥗 تغذیه سالم',
    habit_preset_sleep: '🛌 خواب به‌موقع',
    habit_preset_noscreen: '📵 دوری از گوشی',

    // Presets - Reminder Times
    time_15m: '⚡ ۱۵ دقیقه دیگر',
    time_30m: '⚡ ۳۰ دقیقه دیگر',
    time_1h: '⚡ ۱ ساعت دیگر',
    time_2h: '⚡ ۲ ساعت دیگر',
    time_tonight: '🌙 امشب ساعت ۲۱:۰۰',
    time_tomorrow: '☀️ فردا ساعت ۰۹:۰۰',
    time_morning: '🌅 صبح ۰۸:۰۰',
    time_noon: '☀️ ظهر ۱۲:۰۰',
    time_evening: '🌆 عصر ۱۸:۰۰',
    time_night: '🌙 شب ۲۱:۰۰',

    // Main Menu
    menu_title: '🏠 *منوی اصلی*\n\nمایلید چه کاری انجام دهید؟',

    // Language Menu
    lang_menu_title: '🌐 *تنظیمات زبان / Language Settings*\n\nزبان مورد نظر خود را انتخاب کنید:',
    lang_changed: '✅ زبان با موفقیت به فارسی تغییر یافت!',

    // Welcome Screen
    welcome_title: 'من ربات دستیار شخصی شما برای *عادت‌ها و کارها* هستم\\.\n\n🔥 پیگیری عادت‌های روزانه و حفظ رکورد\n✅ مدیریت آسان لیست کارها \\(To\\-Do\\)\n🔔 تنظیم یادآورهای یک‌باره یا روزانه\n📊 گزارش آماری از پیشرفت شما',
    welcome_prompt_loc: '📍 *لطفاً موقعیت مکانی \\(Location\\) خود را از دکمه زیر به اشتراک بگذارید* تا منطقه زمانی شما خودکار تنظیم شود\\!',
    welcome_use_menu: 'از منوی زیر برای شروع استفاده کنید\\!',
    loc_received: '📍 *موقعیت مکانی دریافت شد\\!*\n\n🌍 *منطقه زمانی:* `{tzName}`\n🕐 *ساعت محلی:* `{localTime}`\n\nتمام یادآورهای شما دقیقاً سر وقت تنظیم شده اجرا خواهند شد\\!',
    loc_skipped: '👍 منطقه زمانی روی پیش‌فرض تنظیم شد \\({tzName}\\)\\. هر زمان خواستید می‌توانید از بخش تنظیمات آن را تغییر دهید\\.',

    // To-Dos
    todo_list_title: '✅ *کارهای باز شما*\n\nبرای علامت زدن انجام کار روی آن بزنید \\(🗑 برای حذف\\):',
    todo_empty: '✅ *کارهای شما*\n\nهیچ کار بازی ندارید\\! برای افزودن کار روی دکمه زیر بزنید:',
    todo_wizard_title: '📝 *افزودن کار جدید*\n\nیک کار از موارد آماده زیر انتخاب کنید، یا *متن کار دلخواه* خود را در این چت ارسال نمایید\\:\n\n_مثال: خرید مایحتاج منزل، تماس با دندانپزشک، تحویل پروژه_',
    todo_custom_prompt: '✏️ *نوشتن کار جدید*\n\nلطفاً پیام حاوی عنوان کار خود را در این چت بفرستید\\.\n\n_مثال: ارسال گزارش کار هفتگی، خرید میوه_',
    todo_added: '\u200F✅ *کار جدید اضافه شد\\!*\n\n\u200F📝 *{task}*\n\nبرای مشاهده یا افزودن کار بیشتر از دکمه‌های زیر استفاده کنید:',
    todo_cancelled: '❌ افزودن کار لغو شد\\.',
    toast_task_done: '✅ انجام شد!',
    toast_task_deleted: '🗑 کار حذف شد.',

    // Habits
    habit_list_title: '🔥 *عادت‌های شما*\n\nبرای ثبت انجام امروز روی عادت بزنید \\(🗑 برای حذف\\):',
    habit_empty: '🔥 *عادت‌های شما*\n\nهنوز عادتی ثبت نشده است\\! برای شروع روی دکمه زیر بزنید:',
    habit_wizard_title: '🔥 *افزودن عادت روزانه جدید*\n\nیک عادت مفید از گزینه‌های زیر انتخاب کنید، یا *نام عادت دلخواه* را در چت بفرستید\\:\n\n_تکرار روزانه کلید ساخت عادت‌های ماندگار است\\!_',
    habit_custom_prompt: '✏️ *نوشتن عادت دلخواه*\n\nلطفاً پیام حاوی نام عادت را در چت ارسال کنید\\.\n\n_مثال: پیاده‌روی صبحگاهی، تمرین زبان انگلیسی، نوشتن خاطرات_',
    habit_created: '\u200F🔥 *عادت ایجاد شد\\!*\n\n\u200F🌟 *{habit}*\n\nبا تکرار و ثبت هر روزه، رکورد خود را بسازید\\!',
    habit_cancelled: '❌ افزودن عادت لغو شد\\.',
    toast_habit_checked: '🔥 برای امروز ثبت شد!',
    toast_habit_already: '✔️ امروز قبلاً ثبت شده است!',
    toast_habit_deleted: '🗑 عادت حذف شد.',

    // Reminders
    reminder_list_title: '🔔 *یادآورهای فعال شما*\n\nبرای لغو یادآور روی 🗑 بزنید:',
    reminder_empty: '🔔 *یادآورهای شما*\n\nهیچ یادآور فعالی ندارید\\! برای تنظیم روی دکمه زیر بزنید:',
    reminder_step1_title: '🔔 *تنظیم یادآور — مرحله ۱ از ۴*\n\nاین یادآور چگونه تکرار شود؟',
    reminder_step2_title: '🔔 *تنظیم یادآور — مرحله ۲ از ۴*\n\n📅 *نوع تکرار:* {type}\n\nچه زمانی به شما یادآوری کنم؟',
    reminder_step3_priority_title: '🔔 *تنظیم یادآور — مرحله ۳ از ۴*\n\n📅 *نوع تکرار:* {type}\n🕐 *زمان:* {time}\n\n*انتخاب اولویت یادآوری:*\nاگر پیام یادآور ارسال شود و دکمه را نزنید، ربات با چه فاصله‌ای تکرار کند؟\n\n🔴 *بالا:* تکرار خودکار هر ۱۰ دقیقه\n🟡 *متوسط:* تکرار خودکار هر ۳۰ دقیقه\n🔵 *کم:* تکرار خودکار هر ۱ ساعت',
    reminder_step3_title: '🔔 *تنظیم یادآور — مرحله ۴ از ۴*\n\n📅 *نوع:* {type}\n🕐 *زمان:* {time}\n⚡ *اولویت:* {priority}\n\nمایلید چه پیامی به شما یادآوری شود؟\n\n_لطفاً متن یادآور خود را در چت بنویسید:_',
    reminder_step4_title: '🔔 *تنظیم یادآور — مرحله ۴ از ۴*\n\n📅 *نوع:* {type}\n🕐 *زمان:* {time}\n⚡ *اولویت:* {priority}\n\nمایلید چه پیامی به شما یادآوری شود؟\n\n_لطفاً متن یادآور خود را در چت بنویسید:_',
    reminder_custom_time_prompt: '✏️ *وارد کردن زمان دلخواه*\n\nلطفاً زمان مورد نظر را در چت بفرستید\\.\n\n{examples}',
    reminder_set: '\u200F✅ *یادآور با موفقیت ثبت شد\\!*\n\n\u200F🔔 *{text}*\n\u200F🕐 *زمان:* {when}\n\u200F📅 *نوع:* {type}\n\u200F⚡ *اولویت:* {priority}',
    reminder_cancelled: '❌ تنظیم یادآور لغو شد\\.',
    reminder_alert_title: '⏰ *یادآوری مهم*',
    toast_snoozed: '💤 برای {min} دقیقه به تعویق افتاد!',
    toast_reminder_deleted: '🗑 یادآور حذف شد.',
    toast_reminder_ack: '👍 تأیید شد!',

    // Stats
    stats_empty: '📊 *آمار و ارقام*\n\nهنوز موردی ثبت نشده است\\! از منوی اصلی برای افزودن کارها یا عادت‌ها استفاده کنید\\.',
    stats_todos_line: '📝 *کارها:* {open} باز · {done} انجام شده',
    stats_streak_title: '\n🔥 *رکورد استمرار عادت‌ها:*',
    stats_streak_item: '  • {name}: 🔥{streak} روز متوالی · مجموع {total} بار انجام',

    // Help
    help_text:
      '❓ *راهنما و دستورات ربات*\n\n' +
      '📋 *مدیریت کارها \\(To\\-Do\\):*\n' +
      '`/add` — منوی تعاملی افزودن کار \\(یا `/add <عنوان>`\\)\n' +
      '`/todos` یا `/list` — مشاهده لیست کارهای باز\n\n' +
      '🔥 *عادت‌های روزانه:*\n' +
      '`/habit` — منوی تعاملی ایجاد عادت \\(یا `/habit <نام>`\\)\n' +
      '`/habits` — مشاهده لیست عادت‌ها و رکوردهای پیوستگی\n\n' +
      '🔔 *یادآورها:*\n' +
      '`/remind` — جادوگر ۳ مرحله‌ای ساخت یادآور\n' +
      '`/remind <زمان> <متن>` — تنظیم سریع:\n' +
      '  • `/remind 30m خاموش کردن فر`\n' +
      '  • `/remind 18:30 جلسه کاری`\n' +
      '  • `/remind daily 08:00 ورزش صبحگاهی`\n' +
      '`/reminders` — مدیریت یادآورهای فعال\n' +
      '`/timezone` — مشاهده یا تغییر منطقه زمانی\n' +
      '`/language` — تغییر زبان ربات\n\n' +
      '📊 *سایر:*\n' +
      '`/stats` — مشاهده آمار و پیشرفت\n' +
      '`/start` یا `/menu` — بازگشت به منوی اصلی\n\n' +
      '_با زدن دکمه‌ها کارهایتان را مدیریت کنید، عادت بسازید و یادآور بگذارید\\!_',
  },

  ru: {
    // Buttons
    btn_back: '🔙 Назад',
    btn_cancel: '❌ Отмена',
    btn_main_menu: '🏠 Главное меню',
    btn_todos: '✅ Мои задачи',
    btn_habits: '🔥 Мои привычки',
    btn_reminders: '🔔 Напоминания',
    btn_stats: '📊 Статистика',
    btn_help: '❓ Помощь',
    btn_language: '🌐 Язык',
    btn_timezone: '🌍 Часовой пояс',
    btn_skip: '⏭ Пропустить',
    btn_share_loc: '📍 Отправить локацию (часовой пояс)',
    btn_add_todo: '➕ Добавить задачу',
    btn_add_another_todo: '➕ Ещё одна задача',
    btn_custom_todo: '✏️ Своя задача',
    btn_add_habit: '➕ Добавить привычку',
    btn_add_another_habit: '➕ Ещё одна привычка',
    btn_checkin_now: '🔥 Отметить сейчас',
    btn_custom_habit: '✏️ Своя привычка',
    btn_add_reminder: '➕ Создать напоминание',
    btn_set_another_reminder: '➕ Ещё напоминание',
    btn_snooze: '💤 Отложить на 15 мин',
    btn_to_todo: '📝 В задачи',
    btn_ack: '👍 Понятно',
    btn_onetime: '⏰ Однократно (1 раз)',
    btn_daily: '🔁 Каждый день',
    btn_2_days: '🔁 Каждые 2 дня',
    btn_3_days: '🔁 Каждые 3 дня',
    btn_weekly: '🔁 Еженедельно',
    type_onetime: '⏰ Однократно',
    type_daily: '🔁 Ежедневно',
    type_2_days: '🔁 Каждые 2 дня',
    type_3_days: '🔁 Каждые 3 дня',
    type_weekly: '🔁 Еженедельно',
    btn_priority_high: '🔴 Высокий (каждые 10 мин)',
    btn_priority_medium: '🟡 Средний (каждые 30 мин)',
    btn_priority_low: '🔵 Низкий (каждый 1 час)',
    priority_high: '🔴 Высокий',
    priority_medium: '🟡 Средний',
    priority_low: '🔵 Низкий',
    btn_custom_time: '✏️ Указать своё время',
    btn_back_presets: '🔙 Назад к вариантам',

    // Presets - Todos
    todo_preset_groceries: '🛒 Покупки',
    todo_preset_emails: '📧 Проверить почту',
    todo_preset_clean: '🧹 Уборка комнаты',
    todo_preset_study: '📚 Учёба / Чтение',
    todo_preset_call: '📞 Важный звонок',
    todo_preset_workout: '💪 Тренировка',

    // Presets - Habits
    habit_preset_water: '💧 Пить воду',
    habit_preset_exercise: '🏃 Зарядка / Спорт',
    habit_preset_reading: '📖 Чтение 15 минут',
    habit_preset_meditate: '🧘 Медитация',
    habit_preset_steps: '🚶 10 000 шагов',
    habit_preset_healthy: '🥗 Здоровая еда',
    habit_preset_sleep: '🛌 Лечь спать вовремя',
    habit_preset_noscreen: '📵 Без телефона перед сном',

    // Presets - Reminder Times
    time_15m: '⚡ через 15 мин',
    time_30m: '⚡ через 30 мин',
    time_1h: '⚡ через 1 час',
    time_2h: '⚡ через 2 часа',
    time_tonight: '🌙 Сегодня в 21:00',
    time_tomorrow: '☀️ Завтра в 09:00',
    time_morning: '🌅 Утро 08:00',
    time_noon: '☀️ День 12:00',
    time_evening: '🌆 Вечер 18:00',
    time_night: '🌙 Ночь 21:00',

    // Main Menu
    menu_title: '🏠 *Главное меню*\n\nЧто вы хотите сделать?',

    // Language Menu
    lang_menu_title: '🌐 *Настройки языка / Language Settings*\n\nВыберите язык:',
    lang_changed: '✅ Язык успешно изменён на русский!',

    // Welcome Screen
    welcome_title: 'Я ваш личный бот для *привычек и задач*\\.\n\n🔥 Отслеживайте полезные привычки и серии дней\n✅ Управляйте списками задач \\(To\\-Do\\)\n🔔 Устанавливайте разовые или ежедневные напоминания\n📊 Смотрите статистику прогресса',
    welcome_prompt_loc: '📍 *Поделитесь вашим местоположением*, чтобы бот автоматически определил ваш часовой пояс\\!',
    welcome_use_menu: 'Используйте кнопки меню ниже, чтобы начать\\!',
    loc_received: '📍 *Местоположение получено\\!*\n\n🌍 *Часовой пояс:* `{tzName}`\n🕐 *Местное время:* `{localTime}`\n\nВсе напоминания будут приходить точно в ваше местное время\\!',
    loc_skipped: '👍 Установлен часовой пояс по умолчанию \\({tzName}\\)\\. Вы можете изменить его в любое время в настройках\\.',

    // To-Dos
    todo_list_title: '✅ *Ваши задачи*\n\nНажмите на задачу, чтобы завершить её \\(🗑 для удаления\\):',
    todo_empty: '✅ *Ваши задачи*\n\nНет активных задач\\! Нажмите кнопку ниже, чтобы создать:',
    todo_wizard_title: '📝 *Новая задача*\n\nВыберите готовый вариант ниже или *напишите текст задачи* в этот чат\\:\n\n_Например: Купить продукты, Закончить отчёт, Позвонить врачу_',
    todo_custom_prompt: '✏️ *Своя задача*\n\nОтправьте сообщение с текстом задачи в этот чат\\.\n\n_Например: Проверить проект, Забрать посылку_',
    todo_added: '✅ *Задача добавлена\\!*\n\n📝 *{task}*\n\nИспользуйте кнопки ниже:',
    todo_cancelled: '❌ Создание задачи отменено\\.',
    toast_task_done: '✅ Задача выполнена!',
    toast_task_deleted: '🗑 Задача удалена.',

    // Habits
    habit_list_title: '🔥 *Ваши привычки*\n\nНажмите, чтобы отметить сегодня \\(🗑 для удаления\\):',
    habit_empty: '🔥 *Ваши привычки*\n\nУ вас пока нет привычек\\! Нажмите кнопку ниже, чтобы создать:',
    habit_wizard_title: '🔥 *Новая привычка*\n\nВыберите полезную привычку ниже или *напишите название* в чат\\:\n\n_Ежедневное повторение — ключ к успеху\\!_',
    habit_custom_prompt: '✏️ *Своя привычка*\n\nОтправьте сообщение с названием привычки в этот чат\\.\n\n_Например: Утренняя пробежка, Учить слова, Дневник_',
    habit_created: '🔥 *Привычка создана\\!*\n\n🌟 *{habit}*\n\nОтмечайте выполнение каждый день и наращивайте серию\\!',
    habit_cancelled: '❌ Создание привычки отменено\\.',
    toast_habit_checked: '🔥 Отмечено за сегодня!',
    toast_habit_already: '✔️ Уже отмечено сегодня!',
    toast_habit_deleted: '🗑 Привычка удалена.',

    // Reminders
    reminder_list_title: '🔔 *Ваши напоминания*\n\nНажмите 🗑, чтобы удалить напоминание:',
    reminder_empty: '🔔 *Ваши напоминания*\n\nНет активных напоминаний\\! Нажмите кнопку ниже:',
    reminder_step1_title: '🔔 *Новое напоминание — Шаг 1 из 4*\n\nКак часто повторять напоминание?',
    reminder_step2_title: '🔔 *Новое напоминание — Шаг 2 из 4*\n\n📅 *Периодичность:* {type}\n\nКогда вам напомнить?',
    reminder_step3_priority_title: '🔔 *Новое напоминание — Шаг 3 из 4*\n\n📅 *Периодичность:* {type}\n🕐 *Время:* {time}\n\n*Выберите приоритет напоминания:*\nЕсли напоминание сработает, а вы не нажмёте кнопку, как часто повторять?\n\n🔴 *Высокий:* Автоповтор каждые 10 мин\n🟡 *Средний:* Автоповтор каждые 30 мин\n🔵 *Низкий:* Автоповтор каждый 1 час',
    reminder_step3_title: '🔔 *Новое напоминание — Шаг 4 из 4*\n\n📅 *Тип:* {type}\n🕐 *Время:* {time}\n⚡ *Приоритет:* {priority}\n\nО чём вам напомнить?\n\n_Напишите текст напоминания в чат:_',
    reminder_step4_title: '🔔 *Новое напоминание — Шаг 4 из 4*\n\n📅 *Тип:* {type}\n🕐 *Время:* {time}\n⚡ *Приоритет:* {priority}\n\nО чём вам напомнить?\n\n_Напишите текст напоминания в чат:_',
    reminder_custom_time_prompt: '✏️ *Укажите время*\n\nОтправьте время в чат\\.\n\n{examples}',
    reminder_set: '✅ *Напоминание установлено\\!*\n\n🔔 *{text}*\n🕐 *Время:* {when}\n📅 *Периодичность:* {type}\n⚡ *Приоритет:* {priority}',
    reminder_cancelled: '❌ Создание напоминания отменено\\.',
    reminder_alert_title: '⏰ *НАПОМИНАНИЕ*',
    toast_snoozed: '💤 Отложено на {min} минут!',
    toast_reminder_deleted: '🗑 Напоминание удалено.',
    toast_reminder_ack: '👍 Подтверждено!',

    // Stats
    stats_empty: '📊 *Ваша статистика*\n\nПока ничего не отслеживается\\! Используйте меню, чтобы добавить привычки или задачи\\.',
    stats_todos_line: '📝 *Задачи:* {open} активных · {done} выполнено',
    stats_streak_title: '\n🔥 *Серии привычек:*',
    stats_streak_item: '  • {name}: 🔥{streak} дн. подряд · всего {total} отметок',

    // Help
    help_text:
      '❓ *Помощь и команды*\n\n' +
      '📋 *Задачи \\(To\\-Do\\):*\n' +
      '`/add` — интерактивное добавление задачи \\(или `/add <текст>`\\)\n' +
      '`/todos` или `/list` — список открытых задач\n\n' +
      '🔥 *Привычки:*\n' +
      '`/habit` — интерактивное создание привычки \\(или `/habit <название>`\\)\n' +
      '`/habits` — список привычек и серий\n\n' +
      '🔔 *Напоминания:*\n' +
      '`/remind` — пошаговый мастер напоминаний\n' +
      '`/remind <время> <текست>` — быстрая команда:\n' +
      '  • `/remind 30m Выключить духовку`\n' +
      '  • `/remind 18:30 Встреча`\n' +
      '  • `/remind daily 08:00 Зарядка`\n' +
      '`/reminders` — управление напоминаниями\n' +
      '`/timezone` — настройка часового пояса\n' +
      '`/language` — выбор языка\n\n' +
      '📊 *Другое:*\n' +
      '`/stats` — статистика\n' +
      '`/start` یا `/menu` — главное меню\n\n' +
      '_Нажимайте кнопки для удобного управления задачами, привычками и напоминаниями\\!_',
  },
};

/**
 * Retrieve translation string for key and given language.
 * Formats {param} placeholders if params are provided.
 */
export function t(lang, key, params = {}) {
  const l = normalizeLang(lang);
  let str = STRINGS[l]?.[key] || STRINGS.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    str = str.split(`{${k}}`).join(String(v));
  }
  return str;
}
