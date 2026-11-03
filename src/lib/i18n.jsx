import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const STRINGS = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_habits: 'Habits',
    nav_tasks: 'Tasks',
    nav_reminders: 'Reminders',
    nav_settings: 'Settings',

    // Home & My Day Dashboard
    app_name_rem: 'Rem',
    app_name_noten: 'noten',
    slogan: 'Better habits. A sharper you.',
    share_title: 'Share streak',
    story_badge: 'Story',
    streak_days: 'day streak',
    my_day: 'My Day',
    rings_title: "Today's Rings",
    rings_completed: 'All Rings Closed!',
    rings_completed_desc: "You've crushed all your habits & tasks for today. Outstanding!",
    section_habits: "Today's Habits",
    section_tasks: "Today's Tasks",
    section_reminders: 'Upcoming Reminders',
    see_all: 'See all',
    score_completed: 'completed',
    score_remaining: 'left',
    quick_actions: 'Quick Actions',
    quick_add_task: 'Add Task',
    quick_add_reminder: 'Add Reminder',
    no_tasks_today: 'No tasks scheduled for today',
    no_tasks_today_desc: 'Take a break or add a new task to your day.',
    no_reminders_today: 'No reminders set',
    no_reminders_today_desc: 'Add a reminder to stay notified on time.',
    no_habits: 'No habits yet',
    no_habits_desc: 'Tap Add Habit below to get started!',
    add_habit_btn: ' Add Habit',
    days_short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    freq_daily: 'Daily',
    freq_weekly: 'Weekly',

    // Habits
    habits_title: 'Habits',
    habits_subtitle: 'Build small habits. Create big changes.',
    no_habits_created: 'No habits created',
    no_habits_created_desc: 'Tap the + button above to create your first habit.',

    // Habit Details
    habit_details: 'Habit Details',
    edit_habit: 'Edit Habit',
    delete_habit: 'Delete Habit',
    current_streak: 'Current Streak',
    streak_count: 'days',
    frequency_label: 'Frequency',
    target_label: 'Target',
    unit_label: 'Unit (Optional)',
    history_label: 'Check-in History',
    today: 'Today',
    status_done: 'Completed',
    status_not_done: 'Not yet',
    confirm_delete_habit: 'Delete this habit?',

    // Tasks
    tasks_title: 'To-Do List',
    tasks_subtitle: 'Get things done.',
    filter_all: 'All',
    filter_open: 'Open',
    filter_today: 'Today',
    filter_upcoming: 'Upcoming',
    filter_done: 'Done',
    search_tasks_placeholder: 'Search tasks...',
    clear_search: 'Clear search',
    no_tasks: 'No tasks found',
    no_tasks_desc: 'Tap the + button above to add a task.',
    no_search_results: 'No tasks found',
    no_search_results_desc: 'Try searching with a different term.',
    default_due: 'Today • 10:00',
    confirm_delete_task: 'Delete this task?',

    // Reminders
    reminders_title: 'Reminders',
    reminders_subtitle: 'Never miss what matters.',
    no_reminders: 'No reminders set',
    no_reminders_desc: 'Tap the + button above to add a reminder.',
    repeat_every_day: 'Every day',
    repeat_once: 'Once',
    confirm_delete_reminder: 'Delete this reminder?',

    // Add / Edit Habit Drawer
    modal_add_habit: 'Add Habit',
    modal_edit_habit: 'Edit Habit',
    habit_name_placeholder: 'Habit name (e.g. Workout, Read)',
    select_icon: 'Select Icon',
    unit_placeholder: 'pages, glasses',
    save_changes: 'Save Changes',
    delete_habit_btn: 'Delete Habit',

    // Add / Edit Task Drawer
    modal_add_task: 'Add Task',
    modal_edit_task: 'Edit Task',
    task_title_placeholder: 'Task title (e.g. Finish project proposal)',
    due_date_time: 'Due date & time',
    choose_date_calendar: 'Calendar',
    date_today: 'Today',
    date_tomorrow: 'Tomorrow',
    date_in_2_days: 'In 2 days',
    date_next_week: 'Next Week',
    task_due_time: 'Time',
    task_due_date: 'Date',
    task_due_date_title: 'Due Date',
    task_due_time_title: 'Due Time',
    task_due_scheduled_for: 'Due at',
    priority: 'Priority',
    repeat: 'Repeat',
    priority_low: 'Low',
    priority_medium: 'Medium',
    priority_high: 'High',
    repeat_none: 'None',
    repeat_once: 'Once',
    repeat_daily: 'Daily',
    repeat_2_days: 'Every 2 days',
    repeat_3_days: 'Every 3 days',
    repeat_weekly: 'Weekly',
    delete_task_btn: 'Delete Task',

    // Task Reminder options
    task_reminder_title: 'Reminder',
    task_reminder_off_hint: 'Get notified in Telegram before due time',
    remind_none: 'Off',
    remind_4h_before_title: '4 hours before',
    remind_4h_before_desc: 'Recommended',
    remind_1d_before_title: '1 day before',
    remind_1d_before_desc: 'Advance notice',
    remind_at_due_title: 'At due time',
    remind_at_due_desc: 'Exact due time',
    remind_custom_title: 'Custom date',
    remind_custom_desc: 'Pick calendar & time',
    remind_at_due: 'At due time',
    remind_15m_before: '15 min before',
    remind_1h_before: '1 hour before',
    remind_4h_before: '4 hours before',
    remind_1d_before: '1 day before',
    remind_custom: 'Custom',
    remind_custom_date: 'Reminder Date',
    remind_custom_time: 'Reminder Time',
    remind_same_day: 'Same day',
    remind_one_day_before: '1 day before',
    remind_two_days_before: '2 days before',
    remind_scheduled_hint: 'Telegram reminder scheduled for {when}',
    remind_scheduled_preview: 'Telegram alert scheduled for {when}',

    // Add / Edit Reminder Drawer
    modal_add_reminder: 'Add Reminder',
    modal_edit_reminder: 'Edit Reminder',
    reminder_text_placeholder: 'What to be reminded about?',
    reminder_time_label: 'Reminder Time',
    time_hours: 'Hours',
    time_minutes: 'Minutes',
    repeat_daily_switch: 'Repeat daily',
    reminder_repeat_rate: 'Repeat',
    reminder_priority: 'Priority',
    priority_high_hint: '🔴 High: Reminds every 10 min until confirmed',
    priority_medium_hint: '🟡 Medium: Reminds every 30 min until confirmed',
    priority_low_hint: '🔵 Low: Reminds every 1 hour until confirmed',
    status_pending_ack: 'Awaiting confirmation',
    delete_reminder_btn: 'Delete Reminder',

    // Long Press Action Sheet
    item_actions: 'Item Options',
    action_edit: 'Edit Item',
    action_delete: 'Delete Item',
    action_cancel: 'Cancel',

    // Habit Icons
    icon_dumbbell: 'Workout',
    icon_book: 'Read',
    icon_water: 'Water',
    icon_meditate: 'Meditate',
    icon_nosocial: 'No Social',
    icon_coffee: 'Coffee',
    icon_heart: 'Health',
    icon_zap: 'Focus',
    icon_bell: 'Reminder',

    // Settings & Themes
    settings_title: 'Settings',
    settings_subtitle: 'Customize your mini app experience.',
    settings_language_title: 'Language',
    settings_language_desc: 'Choose your preferred language for the mini app',
    lang_en: 'English',
    lang_fa: 'Persian',
    lang_ru: 'Russian',
    settings_themes_title: 'Themes',
    settings_themes_desc: 'Select your preferred visual theme for the mini app',
    theme_active: 'Active',
    theme_default: 'Default',
    theme_cyber_violet: 'Cyber Violet',
    theme_ocean_blue: 'Ocean Blue',
    theme_jungle_green: 'Jungle Green',
    theme_sunset_orange: 'Sunset Orange',
    theme_pink_pastel: 'Pink Pastel',
    theme_electric_mint: 'Electric Mint',
    theme_rose_red: 'Rose Red',
    theme_lavender_lilac: 'Lavender Lilac',
    theme_pastel_yellow: 'Pastel Yellow',
    theme_midnight_indigo: 'Midnight Indigo',
    theme_golden_honey: 'Golden Honey',
    theme_energy_lime: 'Energy Lime',
    theme_white_and_black: 'White and Black',
    settings_preview_title: 'Live Theme Preview',
    settings_preview_sample_habit: 'Morning Workout',
    settings_about_title: 'About Remnoten',
    settings_version: 'Version 1.0.0',
    settings_account_info: 'Telegram Account',
    settings_timezone: 'Timezone',

    // Sounds & Audio Haptics
    settings_audio_title: 'Sound & Audio Haptics',
    settings_audio_desc: 'Interactive sound effects and tactile feedback',
    settings_sound_effects: 'Sound Effects',
    settings_sound_effects_desc: 'Play interactive chimes and tactile ticks on actions',
    settings_haptics: 'Haptic Vibration',
    settings_haptics_desc: 'Device physical vibration on touches and check-ins',
    settings_sound_test: 'Test Sound',

    // Heatmap
    heatmap_title: 'Contribution Heatmap',
    heatmap_past_year: 'past year',
    heatmap_checkins: 'check-ins',
    heatmap_less: 'Less',
    heatmap_more: 'More',
    heatmap_completed: 'Completed',
    heatmap_not_completed: 'No check-in',
    heatmap_tap_to_toggle: 'Tap to toggle',
    months_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    // Story & Status Sharing
    share_story_modal_title: 'Share Streak & Story',
    share_story_modal_subtitle: 'Share your progress to Telegram Story & Status',
    share_preview_label: 'Story Card Preview',
    share_theme_label: 'Card Theme',
    share_theme_obsidian: 'Obsidian',
    share_theme_flame: 'Flame',
    share_theme_emerald: 'Emerald',
    share_theme_violet: 'Violet',
    share_theme_cyan: 'Cyan',
    share_to_story_btn: 'Share to Telegram Story',
    share_to_chats_btn: 'Share to Chats & Status',
    share_set_status_btn: 'Set Flame Status',
    share_download_btn: 'Save Story Image',
    share_copy_link_btn: 'Copy Link',
    share_badge_unstoppable: 'UNSTOPPABLE',
    share_badge_onfire: 'ON FIRE',
    share_badge_champion: 'CONSISTENCY CHAMPION',
    share_badge_day1: 'DAY 1 STARTS TODAY',
    share_track_on_remnoten: 'Track habits on Telegram',
    share_streak_text: '🔥 I am on a {streak}-day habit streak on Remnoten! Better habits. A sharper you.',
    share_habit_text: '🎯 I am building "{name}" on Remnoten! Better habits. A sharper you.',
    share_copied_toast: 'Streak link copied to clipboard!',
    share_saved_toast: 'Story image saved to gallery!',
    share_sent_to_chat_toast: 'Story image sent to your Telegram chat! Tap to save to gallery.',
    share_failed: 'Failed to save image. Please try again.',
    share_status_set_success: 'Telegram emoji status set to 🔥!',
    share_status_declined: 'Status update was cancelled.',
    share_status_premium_note: 'Emoji status requires Telegram Premium (8.0+).',
    share_story_not_supported: 'Telegram 7.8+ required for direct Story sharing. Image saved to share manually!',

    // Tutorial On-Screen Walkthrough
    tutorial_title: 'App Tour',
    tutorial_skip: 'Skip Tour',
    tutorial_next: 'Next',
    tutorial_back: 'Back',
    tutorial_finish: 'Got It!',
    tutorial_step_of: 'Step {current} of {total}',
    settings_tutorial_btn: 'Interactive App Tour',
    settings_tutorial_desc: 'Start the on-screen walkthrough of the app',

    tour_streak_title: 'Daily Streak & Progress',
    tour_streak_desc: 'Track your consecutive days of consistency here, with live Habits and Tasks completion bars. Tap the flame to share your streak to Telegram Story!',
    tour_today_title: "Today's Action Feed",
    tour_today_desc: 'All your habits and tasks due today appear in this unified feed. Tap the circular checkbox to instantly complete them with haptic sound!',
    tour_upcoming_title: 'Upcoming Schedule & Alarms',
    tour_upcoming_desc: 'Glance at your scheduled routines and upcoming reminders. Tap "See all" to jump straight into your schedule!',
    tour_habits_title: '365-Day Activity Heatmap',
    tour_habits_desc: 'Every check-in lights up your 365-day contribution map. Tap any habit card to view full calendar inspection and history!',
    tour_add_title: 'Add Custom Habits',
    tour_add_desc: 'Tap here to add new habits with custom icons, target frequencies (Daily or Weekly), and measurement units.',
    tour_tasks_filters_title: 'Filter & Focus Tasks',
    tour_tasks_filters_desc: 'Filter tasks by Today, Upcoming, or Done to keep your attention on what matters right now.',
    tour_tasks_feed_title: 'Your To-Do List',
    tour_tasks_feed_desc: 'Tap the round checkbox to complete tasks with sound effects. Long-press any task to edit or manage.',
    tour_tasks_add_title: 'Create Tasks & Deadlines',
    tour_tasks_add_desc: 'Tap here to add tasks with specific due dates and times.',
    tour_reminders_feed_title: 'Telegram Bot Reminders',
    tour_reminders_feed_desc: 'Smart alarms delivered directly to your chat by @remnotenbot. Toggle any reminder on or off with the switch!',
    tour_reminders_add_title: 'Create Smart Alarms',
    tour_reminders_add_desc: 'Set recurring alarms (Daily, Once, Weekly) with priorities. High-priority alarms ping you repeatedly until confirmed!',
    tour_nav_title: 'Bottom Navigation',
    tour_nav_desc: 'Seamlessly switch between your Habits, To-Do Tasks, smart Telegram Reminders, and Settings!',
  },

  fa: {
    // Nav
    nav_home: 'خانه',
    nav_habits: 'عادت‌ها',
    nav_tasks: 'کارها',
    nav_reminders: 'یادآورها',
    nav_settings: 'تنظیمات',

    // Home & My Day Dashboard
    app_name_rem: 'رِم',
    app_name_noten: 'نوتن',
    slogan: 'عادت‌های بهتر، فردایی روشن‌تر.',
    share_title: 'اشتراک‌گذاری رکورد',
    story_badge: 'استوری',
    streak_days: 'روز رکورد پیوسته',
    my_day: 'روز من',
    rings_title: 'حلقه‌های امروز',
    rings_completed: 'همه حلقه‌ها بسته شدند!',
    rings_completed_desc: 'شما تمام عادت‌ها و کارهای امروزتان را کامل کردید. فوق‌العاده است!',
    section_habits: 'عادت‌های امروز',
    section_tasks: 'کارهای امروز',
    section_reminders: 'یادآورهای پیش‌رو',
    see_all: 'مشاهده همه',
    score_completed: 'تکمیل شده',
    score_remaining: 'مانده',
    quick_actions: 'اقدامات سریع',
    quick_add_task: 'افزودن کار',
    quick_add_reminder: 'افزودن یادآور',
    no_tasks_today: 'هیچ کاری برای امروز نمانده است',
    no_tasks_today_desc: 'استراحت کنید یا کار جدیدی به امروز اضافه کنید.',
    no_reminders_today: 'هیچ یادآوری تنظیم نشده',
    no_reminders_today_desc: 'یادآوری اضافه کنید تا در زمان مناسب مطلع شوید.',
    no_habits: 'هنوز عادتی ثبت نشده',
    no_habits_desc: 'روی دکمه افزودن عادت در زیر بزنید!',
    add_habit_btn: ' افزودن عادت',
    days_short: ['د', 'س', 'چ', 'پ', 'ج', 'ش', 'ی'],
    freq_daily: 'روزانه',
    freq_weekly: 'هفتگی',

    // Habits
    habits_title: 'عادت‌ها',
    habits_subtitle: 'عادت‌های کوچک بسازید، تغییرات بزرگ خلق کنید.',
    no_habits_created: 'هنوز عادتی ایجاد نشده',
    no_habits_created_desc: 'روی دکمه + بالا بزنید تا اولین عادت خود را بسازید.',

    // Habit Details
    habit_details: 'جزئیات عادت',
    edit_habit: 'ویرایش عادت',
    delete_habit: 'حذف عادت',
    current_streak: 'رکورد فعلی',
    streak_count: 'روز',
    frequency_label: 'بازه تکرار',
    target_label: 'هدف روزانه',
    unit_label: 'واحد (اختیاری)',
    history_label: 'تاریخچه ثبت',
    today: 'امروز',
    status_done: 'انجام شد',
    status_not_done: 'هنوز نه',
    confirm_delete_habit: 'آیا از حذف این عادت اطمینان دارید؟',

    // Tasks
    tasks_title: 'لیست کارها',
    tasks_subtitle: 'کارهایتان را پیش ببرید.',
    filter_all: 'همه',
    filter_open: 'باز',
    filter_today: 'امروز',
    filter_upcoming: 'آینده',
    filter_done: 'انجام‌شده',
    search_tasks_placeholder: 'جستجوی کارها...',
    clear_search: 'پاک کردن جستجو',
    no_tasks: 'کاری یافت نشد',
    no_tasks_desc: 'روی دکمه + بالا برای افزودن کار جدید بزنید.',
    no_search_results: 'کاری پیدا نشد',
    no_search_results_desc: 'عبارت دیگری را جستجو کنید.',
    default_due: 'امروز • ۱۰:۰۰',
    confirm_delete_task: 'آیا از حذف این کار اطمینان دارید؟',

    // Reminders
    reminders_title: 'یادآورها',
    reminders_subtitle: 'کارهای مهم را هرگز فراموش نکنید.',
    no_reminders: 'هیچ یادآوری تنظیم نشده',
    no_reminders_desc: 'روی دکمه + بالا برای تنظیم یادآور بزنید.',
    repeat_every_day: 'هر روز',
    repeat_once: 'یک‌بار',
    confirm_delete_reminder: 'آیا از حذف این یادآور اطمینان دارید؟',

    // Add / Edit Habit Drawer
    modal_add_habit: 'افزودن عادت',
    modal_edit_habit: 'ویرایش عادت',
    habit_name_placeholder: 'نام عادت (مثلاً ورزش، مطالعه)',
    select_icon: 'انتخاب آیکون',
    unit_placeholder: 'صفحه، لیوان...',
    save_changes: 'ذخیره تغییرات',
    delete_habit_btn: 'حذف عادت',

    // Add / Edit Task Drawer
    modal_add_task: 'افزودن کار جدید',
    modal_edit_task: 'ویرایش کار',
    task_title_placeholder: 'عنوان کار (مثلاً ارسال گزارش پروژه)',
    due_date_time: 'تاریخ و زمان سررسید',
    choose_date_calendar: 'تقویم',
    date_today: 'امروز',
    date_tomorrow: 'فردا',
    date_in_2_days: '۲ روز دیگر',
    date_next_week: 'هفته آینده',
    task_due_time: 'ساعت',
    task_due_date: 'تاریخ',
    task_due_date_title: 'تاریخ سررسید',
    task_due_time_title: 'ساعت سررسید',
    task_due_scheduled_for: 'موعد سررسید',
    priority: 'اولویت',
    repeat: 'تکرار',
    priority_low: 'پایین',
    priority_medium: 'متوسط',
    priority_high: 'بالا',
    repeat_none: 'بدون تکرار',
    repeat_once: 'یک‌باره',
    repeat_daily: 'روزانه',
    repeat_2_days: 'هر ۲ روز یکبار',
    repeat_3_days: 'هر ۳ روز یکبار',
    repeat_weekly: 'هفتگی',
    delete_task_btn: 'حذف کار',

    // Task Reminder options
    task_reminder_title: 'یادآوری',
    task_reminder_off_hint: 'دریافت اعلان در تلگرام پیش از موعد',
    remind_none: 'خاموش',
    remind_4h_before_title: '۴ ساعت قبل',
    remind_4h_before_desc: 'پیشنهادی',
    remind_1d_before_title: '۱ روز قبل',
    remind_1d_before_desc: 'یک روز زودتر',
    remind_at_due_title: 'در موعد سررسید',
    remind_at_due_desc: 'دقیقاً در ساعت موعد',
    remind_custom_title: 'تاریخ سفارشی',
    remind_custom_desc: 'انتخاب از تقویم',
    remind_at_due: 'در موعد سررسید',
    remind_15m_before: '۱۵ دقیقه قبل',
    remind_1h_before: '۱ ساعت قبل',
    remind_4h_before: '۴ ساعت قبل',
    remind_1d_before: '۱ روز قبل',
    remind_custom: 'سفارشی',
    remind_custom_date: 'تاریخ یادآوری',
    remind_custom_time: 'ساعت یادآوری',
    remind_same_day: 'همان روز',
    remind_one_day_before: '۱ روز قبل',
    remind_two_days_before: '۲ روز قبل',
    remind_scheduled_hint: 'یادآوری در تلگرام برای {when} تنظیم شد',
    remind_scheduled_preview: 'اعلان تلگرام برای {when} تنظیم شد',

    // Add / Edit Reminder Drawer
    modal_add_reminder: 'افزودن یادآور',
    modal_edit_reminder: 'ویرایش یادآور',
    reminder_text_placeholder: 'چه چیزی به شما یادآوری شود؟',
    reminder_time_label: 'زمان یادآور',
    time_hours: 'ساعت',
    time_minutes: 'دقیقه',
    repeat_daily_switch: 'تکرار روزانه',
    reminder_repeat_rate: 'نرخ تکرار',
    reminder_priority: 'اولویت',
    priority_high_hint: '🔴 زیاد: هر ۱۰ دقیقه یادآوری می‌شود تا تأیید شود',
    priority_medium_hint: '🟡 متوسط: هر ۳۰ دقیقه یادآوری می‌شود تا تأیید شود',
    priority_low_hint: '🔵 کم: هر ۱ ساعت یادآوری می‌شود تا تأیید شود',
    status_pending_ack: 'در انتظار تأیید',
    delete_reminder_btn: 'حذف یادآور',

    // Long Press Action Sheet
    item_actions: 'مدیریت آیتم',
    action_edit: 'ویرایش',
    action_delete: 'حذف',
    action_cancel: 'انصراف',

    // Habit Icons
    icon_dumbbell: 'ورزش',
    icon_book: 'مطالعه',
    icon_water: 'آب',
    icon_meditate: 'مدیتیشن',
    icon_nosocial: 'بدون گوشی',
    icon_coffee: 'قهوه',
    icon_heart: 'سلامت',
    icon_zap: 'تمرکز',
    icon_bell: 'یادآور',

    // Settings & Themes
    settings_title: 'تنظیمات',
    settings_subtitle: 'شخصی‌سازی ظاهر و تجربه برنامه.',
    settings_language_title: 'زبان برنامه',
    settings_language_desc: 'زبان مورد نظر خود را برای محیط برنامه انتخاب کنید',
    lang_en: 'انگلیسی',
    lang_fa: 'فارسی',
    lang_ru: 'روسی',
    settings_themes_title: 'تم‌ها',
    settings_themes_desc: 'تم و رنگ ظاهری مورد علاقه خود را انتخاب کنید',
    theme_active: 'فعال',
    theme_default: 'پیش‌فرض',
    theme_cyber_violet: 'بنفش سایبری',
    theme_ocean_blue: 'آبی اقیانوسی',
    theme_jungle_green: 'سبز جنگلی',
    theme_sunset_orange: 'نارنجی غروب',
    theme_pink_pastel: 'صورتی پاستلی',
    theme_electric_mint: 'نعنایی درخشان',
    theme_rose_red: 'قرمز رز',
    theme_lavender_lilac: 'یاسی ملایم',
    theme_pastel_yellow: 'زرد پاستلی',
    theme_midnight_indigo: 'نیلی نیمه‌شب',
    theme_golden_honey: 'عسلی طلایی',
    theme_energy_lime: 'لیمویی پرانرژی',
    theme_white_and_black: 'سفید و مشکی',
    settings_preview_title: 'پیش‌نمایش زنده تم',
    settings_preview_sample_habit: 'ورزش صبحگاهی',
    settings_about_title: 'درباره رِم‌نوتن',
    settings_version: 'نسخه ۱.۰.۰',
    settings_account_info: 'حساب تلگرام',
    settings_timezone: 'منطقه زمانی',

    // Sounds & Audio Haptics
    settings_audio_title: 'صدا و بازخورد صوتی',
    settings_audio_desc: 'افکت‌های صوتی تعاملی و لرزش لمسی در برنامه',
    settings_sound_effects: 'افکت‌های صوتی',
    settings_sound_effects_desc: 'پخش صدای تیک و زنگ هنگام ثبت عادت‌ها و کارها',
    settings_haptics: 'لرزش لمسی (هپتیک)',
    settings_haptics_desc: 'لرزش فیزیکی دستگاه هنگام لمس و ثبت فعالیت‌ها',
    settings_sound_test: 'پخش نمونه',

    // Heatmap
    heatmap_title: 'نمودار فعالیت سالانه',
    heatmap_past_year: 'سال گذشته',
    heatmap_checkins: 'ثبت انجام',
    heatmap_less: 'کمتر',
    heatmap_more: 'بیشتر',
    heatmap_completed: 'انجام شد',
    heatmap_not_completed: 'ثبت نشده',
    heatmap_tap_to_toggle: 'برای تغییر وضعیت بزنید',
    months_short: ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'],

    // Story & Status Sharing
    share_story_modal_title: 'اشتراک‌گذاری استوری و وضعیت',
    share_story_modal_subtitle: 'اشتراک‌گذاری پیشرفت در استوری و وضعیت تلگرام',
    share_preview_label: 'پیش‌نمایش استوری',
    share_theme_label: 'تم کارت',
    share_theme_obsidian: 'ابسیدین',
    share_theme_flame: 'شعله',
    share_theme_emerald: 'زمرد',
    share_theme_violet: 'بنفش',
    share_theme_cyan: 'فیروزه‌ای',
    share_to_story_btn: 'اشتراک در استوری تلگرام',
    share_to_chats_btn: 'ارسال به چت‌ها و وضعیت',
    share_set_status_btn: 'تنظیم وضعیت شعله',
    share_download_btn: 'ذخیره تصویر استوری',
    share_copy_link_btn: 'کپی لینک',
    share_badge_unstoppable: 'مهارنشدنی',
    share_badge_onfire: 'روی دور موفقیت',
    share_badge_champion: 'قهرمان استمرار',
    share_badge_day1: 'شروع از امروز',
    share_track_on_remnoten: 'پیگیری عادت‌ها در تلگرام',
    share_streak_text: '🔥 من در رِم‌نوتن روی رکورد {streak} روز پیوستگی هستم! عادت‌های بهتر، فردایی روشن‌تر.',
    share_habit_text: '🎯 در حال ساخت عادت «{name}» در رِم‌نوتن هستم! عادت‌های بهتر، فردایی روشن‌تر.',
    share_copied_toast: 'لینک رکورد در کلیپ‌بورد کپی شد!',
    share_saved_toast: 'تصویر استوری ذخیره شد!',
    share_sent_to_chat_toast: 'تصویر استوری به چت تلگرام ارسال شد! برای ذخیره در گالری روی آن بزنید.',
    share_failed: 'خطا در ذخیره تصویر. لطفا دوباره تلاش کنید.',
    share_status_set_success: 'وضعیت تلگرام به 🔥 تغییر یافت!',
    share_status_declined: 'تنظیم وضعیت لغو شد.',
    share_status_premium_note: 'وضعیت ایموجی به تلگرام پرمیوم (نسخه ۸.۰+) نیاز دارد.',
    share_story_not_supported: 'برای استوری مستقیم تلگرام نسخه ۷.۸+ لازم است. تصویر برای اشتراک دستی ذخیره شد!',

    // Tutorial On-Screen Walkthrough
    tutorial_title: 'راهنمای کاربری',
    tutorial_skip: 'رد کردن',
    tutorial_next: 'بعدی',
    tutorial_back: 'قبلی',
    tutorial_finish: 'متوجه شدم!',
    tutorial_step_of: 'مرحله {current} از {total}',
    settings_tutorial_btn: 'تور تعاملی روی صفحه',
    settings_tutorial_desc: 'شروع راهنمای تعاملی بخش‌های برنامه روی صفحه',

    tour_streak_title: 'رکورد روزانه و میزان پیشرفت',
    tour_streak_desc: 'روزهای متوالی پیوستگی شما در اینجا شمرده می‌شود، همراه با نوارهای زنده انجام عادت‌ها و کارها. با لمس شعله رکوردتان را در استوری تلگرام به اشتراک بگذارید!',
    tour_today_title: 'لیست کارهای امروز',
    tour_today_desc: 'تمام عادت‌ها و کارهای امروز شما در این لیست یکپارچه قرار دارند. با لمس دکمه گرد تیک، آنها را با صدای تیک و لرزش ثبت کنید!',
    tour_upcoming_title: 'برنامه و یادآورهای آینده',
    tour_upcoming_desc: 'یادآورهای روزهای بعد و برنامه‌های آینده‌تان را اینجا ببینید. با لمس «دیدن همه» به بخش کامل یادآورها بروید!',
    tour_habits_title: 'نقشه فعالیت ۳۶۵ روزه عادت‌ها',
    tour_habits_desc: 'با هر ثبت، این نقشه سالانه گیت‌هابی روشن می‌شود. با لمس کارت هر عادت، تقویم ماهانه و تاریخچه کامل باز می‌شود!',
    tour_add_title: 'افزودن عادت جدید',
    tour_add_desc: 'با این دکمه می‌توانید عادت‌های جدید با آیکون‌های متنوع، بازه تکرار روزانه یا هفتگی و واحدهای دلخواه بسازید.',
    tour_tasks_filters_title: 'فیلتر و تمرکز روی کارها',
    tour_tasks_filters_desc: 'کارهایتان را بر اساس امروز، آینده یا انجام‌شده فیلتر کنید تا روی مهم‌ترین کارها تمرکز کنید.',
    tour_tasks_feed_title: 'لیست کارهای شما',
    tour_tasks_feed_desc: 'با لمس دایره تیک، کارها را با افکت صوتی دلپذیر تیک بزنید. با نگه داشتن هر کار می‌توانید آن را ویرایش کنید.',
    tour_tasks_add_title: 'افزودن کار و زمان‌بندی',
    tour_tasks_add_desc: 'با این دکمه کارهای جدید همراه با تاریخ و ساعت سررسید بسازید.',
    tour_reminders_feed_title: 'یادآورهای ربات تلگرام',
    tour_reminders_feed_desc: 'هشدارهای هوشمند که مستقیماً توسط @remnotenbot در تلگرام به شما پیام داده می‌شوند. با کلید کنار هر یادآور آن را خاموش یا روشن کنید!',
    tour_reminders_add_title: 'ساخت یادآور هوشمند',
    tour_reminders_add_desc: 'یادآورهایی با تکرار روزانه، هفتگی یا یک‌باره تنظیم کنید. یادآورهای اولویت بالا تا زمان تایید به شما هشدار می‌دهند!',
    tour_nav_title: 'جابجایی بین بخش‌ها',
    tour_nav_desc: 'به راحتی بین عادت‌ها، کارها، یادآورهای تلگرامی ربات و تنظیمات جابجا شوید!',
  },

  ru: {
    // Nav
    nav_home: 'Главная',
    nav_habits: 'Привычки',
    nav_tasks: 'Задачи',
    nav_reminders: 'Напоминания',
    nav_settings: 'Настройки',

    // Home & My Day Dashboard
    app_name_rem: 'Rem',
    app_name_noten: 'noten',
    slogan: 'Лучшие привычки. Лучший ты.',
    share_title: 'Поделиться серией',
    story_badge: 'История',
    streak_days: 'дней подряд',
    my_day: 'Мой день',
    rings_title: 'Кольца дня',
    rings_completed: 'Все кольца закрыты!',
    rings_completed_desc: 'Вы выполнили все привычки и задачи на сегодня. Отлично!',
    section_habits: 'Привычки сегодня',
    section_tasks: 'Задачи сегодня',
    section_reminders: 'Напоминания',
    see_all: 'Все',
    score_completed: 'выполнено',
    score_remaining: 'осталось',
    quick_actions: 'Быстрые действия',
    quick_add_task: 'Добавить задачу',
    quick_add_reminder: 'Добавить напоминание',
    no_tasks_today: 'На сегодня задач нет',
    no_tasks_today_desc: 'Отдохните или добавьте новую задачу на день.',
    no_reminders_today: 'Нет напоминаний',
    no_reminders_today_desc: 'Добавьте напоминание, чтобы не забыть о важном.',
    no_habits: 'Пока нет привычек',
    no_habits_desc: 'Нажмите «Добавить привычку» ниже!',
    add_habit_btn: ' Добавить привычку',
    days_short: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    freq_daily: 'Ежедневно',
    freq_weekly: 'Еженедельно',

    // Habits
    habits_title: 'Привычки',
    habits_subtitle: 'Маленькие привычки ведут к большим переменам.',
    no_habits_created: 'Нет привычек',
    no_habits_created_desc: 'Нажмите + выше, чтобы создать первую привычку.',

    // Habit Details
    habit_details: 'Детали привычки',
    edit_habit: 'Редактировать',
    delete_habit: 'Удалить',
    current_streak: 'Текущая серия',
    streak_count: 'дней',
    frequency_label: 'Частота',
    target_label: 'Цель на день',
    unit_label: 'Ед. изм. (необязательно)',
    history_label: 'История отметок',
    today: 'Сегодня',
    status_done: 'Выполнено',
    status_not_done: 'Не выполнено',
    confirm_delete_habit: 'Удалить эту привычку?',

    // Tasks
    tasks_title: 'Список задач',
    tasks_subtitle: 'Доводите дела до конца.',
    filter_all: 'Все',
    filter_open: 'Открытые',
    filter_today: 'Сегодня',
    filter_upcoming: 'Предстоящие',
    filter_done: 'Выполненные',
    search_tasks_placeholder: 'Поиск задач...',
    clear_search: 'Очистить поиск',
    no_tasks: 'Задач не найдено',
    no_tasks_desc: 'Нажмите + выше, чтобы добавить задачу.',
    no_search_results: 'Ничего не найдено',
    no_search_results_desc: 'Попробуйте изменить поисковый запрос.',
    default_due: 'Сегодня • 10:00',
    confirm_delete_task: 'Удалить эту задачу?',

    // Reminders
    reminders_title: 'Напоминания',
    reminders_subtitle: 'Не упускайте важное.',
    no_reminders: 'Нет напоминаний',
    no_reminders_desc: 'Нажмите + выше, чтобы настроить напоминание.',
    repeat_every_day: 'Каждый день',
    repeat_once: 'Один раз',
    confirm_delete_reminder: 'Удалить это напоминание?',

    // Add / Edit Habit Drawer
    modal_add_habit: 'Новая привычка',
    modal_edit_habit: 'Редактировать привычку',
    habit_name_placeholder: 'Название (напр. Тренировка, Чтение)',
    select_icon: 'Выберите иконку',
    unit_placeholder: 'страниц, стаканов...',
    save_changes: 'Сохранить',
    delete_habit_btn: 'Удалить привычку',

    // Add / Edit Task Drawer
    modal_add_task: 'Новая задача',
    modal_edit_task: 'Редактировать задачу',
    task_title_placeholder: 'Название задачи',
    due_date_time: 'Срок и время',
    choose_date_calendar: 'Календарь',
    date_today: 'Сегодня',
    date_tomorrow: 'Завтра',
    date_in_2_days: 'Через 2 дня',
    date_next_week: 'След. неделя',
    task_due_time: 'Время',
    task_due_date: 'Дата',
    task_due_date_title: 'Дата выполнения',
    task_due_time_title: 'Время выполнения',
    task_due_scheduled_for: 'Срок выполнения',
    priority: 'Приоритет',
    repeat: 'Повтор',
    priority_low: 'Низкий',
    priority_medium: 'Средний',
    priority_high: 'Высокий',
    repeat_none: 'Нет',
    repeat_once: 'Один раз',
    repeat_daily: 'Ежедневно',
    repeat_2_days: 'Каждые 2 дня',
    repeat_3_days: 'Каждые 3 дня',
    repeat_weekly: 'Еженедельно',
    delete_task_btn: 'Удалить задачу',

    // Task Reminder options
    task_reminder_title: 'Напоминание',
    task_reminder_off_hint: 'Уведомление в Telegram до наступления срока',
    remind_none: 'Выкл',
    remind_4h_before_title: 'За 4 часа',
    remind_4h_before_desc: 'Рекомендуется',
    remind_1d_before_title: 'За 1 день',
    remind_1d_before_desc: 'За сутки',
    remind_at_due_title: 'В момент срока',
    remind_at_due_desc: 'Точно в срок',
    remind_custom_title: 'Своё время',
    remind_custom_desc: 'Выбрать в календаре',
    remind_at_due: 'В момент срока',
    remind_15m_before: 'За 15 мин',
    remind_1h_before: 'За 1 час',
    remind_4h_before: 'За 4 часа',
    remind_1d_before: 'За 1 день',
    remind_custom: 'Другое',
    remind_custom_date: 'Дата напоминания',
    remind_custom_time: 'Время напоминания',
    remind_same_day: 'В тот же день',
    remind_one_day_before: 'За 1 день',
    remind_two_days_before: 'За 2 дня',
    remind_scheduled_hint: 'Напоминание в Telegram запланировано на {when}',
    remind_scheduled_preview: 'Уведомление в Telegram запланировано на {when}',

    // Add / Edit Reminder Drawer
    modal_add_reminder: 'Новое напоминание',
    modal_edit_reminder: 'Редактировать напоминание',
    reminder_text_placeholder: 'О чем напомнить?',
    reminder_time_label: 'Время напоминания',
    time_hours: 'Часы',
    time_minutes: 'Минуты',
    repeat_daily_switch: 'Повторять каждый день',
    reminder_repeat_rate: 'Частота повтора',
    reminder_priority: 'Приоритет',
    priority_high_hint: '🔴 Высокий: повтор каждые 10 мин до подтверждения',
    priority_medium_hint: '🟡 Средний: повтор каждые 30 мин до подтверждения',
    priority_low_hint: '🔵 Низкий: повтор каждый 1 час до подтверждения',
    status_pending_ack: 'Ожидает подтверждения',
    delete_reminder_btn: 'Удалить напоминание',

    // Long Press Action Sheet
    item_actions: 'Действия',
    action_edit: 'Редактировать',
    action_delete: 'Удалить',
    action_cancel: 'Отмена',

    // Habit Icons
    icon_dumbbell: 'Тренировка',
    icon_book: 'Чтение',
    icon_water: 'Вода',
    icon_meditate: 'Медитация',
    icon_nosocial: 'Без соцсетей',
    icon_coffee: 'Кофе',
    icon_heart: 'Здоровье',
    icon_zap: 'Фокус',
    icon_bell: 'Напоминание',

    // Settings & Themes
    settings_title: 'Настройки',
    settings_subtitle: 'Персонализация приложения.',
    settings_language_title: 'Язык интерфейса',
    settings_language_desc: 'Выберите предпочтительный язык для приложения',
    lang_en: 'Английский',
    lang_fa: 'Персидский',
    lang_ru: 'Русский',
    settings_themes_title: 'Темы',
    settings_themes_desc: 'Выберите цветовую тему для приложения',
    theme_active: 'Активно',
    theme_default: 'По умолчанию',
    theme_cyber_violet: 'Кибер-фиолетовый',
    theme_ocean_blue: 'Океанский синий',
    theme_jungle_green: 'Джунгли зеленый',
    theme_sunset_orange: 'Закатный оранжевый',
    theme_pink_pastel: 'Розовый пастельный',
    theme_electric_mint: 'Электрический мятный',
    theme_rose_red: 'Розово-красный',
    theme_lavender_lilac: 'Лавандово-сиреневый',
    theme_pastel_yellow: 'Желтый пастельный',
    theme_midnight_indigo: 'Полуночный индиго',
    theme_golden_honey: 'Медовое золото',
    theme_energy_lime: 'Энергичный лайм',
    theme_white_and_black: 'Черно-белый',
    settings_preview_title: 'Предпросмотр темы',
    settings_preview_sample_habit: 'Утренняя тренировка',
    settings_about_title: 'О приложении',
    settings_version: 'Версия 1.0.0',
    settings_account_info: 'Аккаунт Telegram',
    settings_timezone: 'Часовой пояс',

    // Sounds & Audio Haptics
    settings_audio_title: 'Звуки и виброотклик',
    settings_audio_desc: 'Интерактивные звуковые эффекتی и тактильный отклик',
    settings_sound_effects: 'Звуковые эффекты',
    settings_sound_effects_desc: 'Воспроизведение приятных звуков при отметках и нажатиях',
    settings_haptics: 'Тактильный отклик (вибрация)',
    settings_haptics_desc: 'Вибрация устройства при нажатиях на кнопки и отметках',
    settings_sound_test: 'Прослушать',

    // Heatmap
    heatmap_title: 'График активности',
    heatmap_past_year: 'за год',
    heatmap_checkins: 'отметок',
    heatmap_less: 'Меньше',
    heatmap_more: 'Больше',
    heatmap_completed: 'Выполнено',
    heatmap_not_completed: 'Не выполнено',
    heatmap_tap_to_toggle: 'Нажмите для отметки',
    months_short: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],

    // Story & Status Sharing
    share_story_modal_title: 'Поделиться историей и статусом',
    share_story_modal_subtitle: 'Опубликуйте ваш прогресс в истории и статусе Telegram',
    share_preview_label: 'Предпросмотр истории',
    share_theme_label: 'Тема карточки',
    share_theme_obsidian: 'Обсидиан',
    share_theme_flame: 'Пламя',
    share_theme_emerald: 'Изумруд',
    share_theme_violet: 'Фиолетовый',
    share_theme_cyan: 'Циан',
    share_to_story_btn: 'Опубликовать в истории Telegram',
    share_to_chats_btn: 'Отправить в чаты и статус',
    share_set_status_btn: 'Установить эмодзи-статус',
    share_download_btn: 'Сохранить картинку',
    share_copy_link_btn: 'Скопировать ссылку',
    share_badge_unstoppable: 'НЕОСТАНОВИМ',
    share_badge_onfire: 'В ОГНЕ',
    share_badge_champion: 'ЧЕМПИОН ПРИВЫЧЕК',
    share_badge_day1: 'ДЕНЬ 1: СТАРТ',
    share_track_on_remnoten: 'Трекер привычек в Telegram',
    share_streak_text: '🔥 У меня уже {streak} дней серии в Remnoten! Лучшие привычки. Лучший ты.',
    share_habit_text: '🎯 Я развиваю привычку «{name}» в Remnoten! Лучшие привычки. Лучший ты.',
    share_copied_toast: 'Ссылка скопирована в буфер обмена!',
    share_saved_toast: 'Изображение истории сохранено!',
    share_sent_to_chat_toast: 'Изображение отправлено в чат Telegram! Нажмите, чтобы сохранить в галерею.',
    share_failed: 'Не удалось сохранить изображение. Попробуйте еще раз.',
    share_status_set_success: 'Эмодзи-статус Telegram изменен на 🔥!',
    share_status_declined: 'Установка статуса отменена.',
    share_status_premium_note: 'Эмодзи-статус требует Telegram Premium (8.0+).',
    share_story_not_supported: 'Для прямой публикации истории нужен Telegram 7.8+. Картинка сохранена для публикации вручную!',

    // Tutorial On-Screen Walkthrough
    tutorial_title: 'Обучение',
    tutorial_skip: 'Пропустить',
    tutorial_next: 'Далее',
    tutorial_back: 'Назад',
    tutorial_finish: 'Понятно!',
    tutorial_step_of: 'Шаг {current} из {total}',
    settings_tutorial_btn: 'Интерактивный тур',
    settings_tutorial_desc: 'Запустить пошаговый тур по интерфейсу приложения',

    tour_streak_title: 'Ежедневная серия и прогресс',
    tour_streak_desc: 'Здесь отображается ваша непрерывная серия и шкалы прогресса привычек и задач. Нажмите на огонек, чтобы поделиться историей в Telegram!',
    tour_today_title: 'Лента на сегодня',
    tour_today_desc: 'Все ваши привычки и задачи на сегодня собраны в одной ленте. Отмечайте их выполнение круглым чекбоксом в одно касание!',
    tour_upcoming_title: 'Предстоящие планы и напоминания',
    tour_upcoming_desc: 'Здесь отображаются ваши ближайшие планы и напоминания. Нажмите «Все», чтобы открыть подробное расписание!',
    tour_habits_title: '365-дневная карта активности',
    tour_habits_desc: 'Каждая отметка зажигает дни в годовой карте привычек. Нажмите на карточку привычки, чтобы открыть месячный календарь и историю!',
    tour_add_title: 'Добавление привычек',
    tour_add_desc: 'Нажмите здесь, чтобы создать новую привычку с иконкой, частотой (ежедневно/еженедельно) и единицами измерения.',
    tour_tasks_filters_title: 'Фильтрация задач',
    tour_tasks_filters_desc: 'Фильтруйте задачи по категориям «Сегодня», «Предстоящие» и «Выполненные», чтобы сфокусироваться на главном.',
    tour_tasks_feed_title: 'Ваш список дел',
    tour_tasks_feed_desc: 'Отмечайте задачи галочкой со звуковым эффектом или зажмите карточку для редактирования и настройки срока.',
    tour_tasks_add_title: 'Создание задач',
    tour_tasks_add_desc: 'Создавайте новые задачи с точной датой и временем выполнения.',
    tour_reminders_feed_title: 'Напоминания в Telegram',
    tour_reminders_feed_desc: 'Умные напоминания, которые бот @remnotenbot присылает прямо в ваш чат Telegram. Включайте и выключайте их переключателем!',
    tour_reminders_add_title: 'Создание напоминаний',
    tour_reminders_add_desc: 'Настройте повтор (ежедневно, раз в неделю) и приоритет. Высокий приоритет напоминает, пока вы не подтвердите!',
    tour_nav_title: 'Нижняя навигация',
    tour_nav_desc: 'Удобно переключайтесь между привычками, задачами, напоминаниями бота @remnotenbot и настройками!',
  },
};

export const LANGUAGES = [
  { id: 'en', code: 'EN', name: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr', nameKey: 'lang_en' },
  { id: 'fa', code: 'FA', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', dir: 'ltr', nameKey: 'lang_fa' },
  { id: 'ru', code: 'RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr', nameKey: 'lang_ru' },
];

export function normalizeLang(code) {
  if (!code) return 'en';
  const c = String(code).toLowerCase();
  if (c.startsWith('fa') || c === 'per' || c === 'farsi') return 'fa';
  if (c.startsWith('ru') || c === 'rus') return 'ru';
  return 'en';
}

export function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('remnoten_lang');
    if (saved && STRINGS[saved]) return saved;
    const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (tgLang) {
      const normalized = normalizeLang(tgLang);
      if (STRINGS[normalized]) return normalized;
    }
    const navLang = navigator.language;
    if (navLang) {
      const normalized = normalizeLang(navLang);
      if (STRINGS[normalized]) return normalized;
    }
  } catch (e) {
    // Ignore storage issues
  }
  return 'en';
}

// Always maintain LTR layout for modern app consistency across all languages (including Persian)
if (typeof window !== 'undefined') {
  try {
    const initial = getInitialLanguage();
    document.documentElement.lang = initial;
    document.documentElement.dir = 'ltr';
    if (initial === 'fa') {
      document.body.classList.add('lang-fa');
    }
  } catch (e) {}
}

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, fallbackOrParams = '', params = null) => {
    let text = typeof fallbackOrParams === 'string' && fallbackOrParams ? fallbackOrParams : key;
    const p = typeof fallbackOrParams === 'object' && fallbackOrParams !== null ? fallbackOrParams : params;
    if (p && typeof p === 'object' && typeof text === 'string') {
      for (const [k, v] of Object.entries(p)) {
        text = text.replaceAll(`{${k}}`, v !== undefined && v !== null ? String(v) : '');
      }
    }
    return text;
  },
  isRTL: false,
  languages: LANGUAGES,
});

export function I18nProvider({ lang: externalLang, onLangChange, children }) {
  const [lang, setLangState] = useState(() => {
    if (externalLang && STRINGS[externalLang]) return externalLang;
    return getInitialLanguage();
  });

  // Sync if externalLang from parent changes (e.g. loaded from backend getAppState)
  useEffect(() => {
    if (externalLang && STRINGS[externalLang] && externalLang !== lang) {
      setLangState(externalLang);
    }
  }, [externalLang]);

  const currentLang = STRINGS[lang] ? lang : 'en';
  const isRTL = false; // Layout remains LTR across all languages

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = 'ltr';
    if (currentLang === 'fa') {
      document.body.classList.add('lang-fa');
    } else {
      document.body.classList.remove('lang-fa');
    }
    try {
      localStorage.setItem('remnoten_lang', currentLang);
    } catch (e) {}
  }, [currentLang]);

  const setLang = (newLang) => {
    const valid = STRINGS[newLang] ? newLang : 'en';
    setLangState(valid);
    try {
      localStorage.setItem('remnoten_lang', valid);
    } catch (e) {}
    if (onLangChange) {
      onLangChange(valid);
    }
  };

  const value = useMemo(() => {
    const dict = STRINGS[currentLang] || STRINGS.en;
    const t = (key, fallbackOrParams = '', params = null) => {
      let text;
      let p = null;
      if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
        p = fallbackOrParams;
        text = dict[key] ?? STRINGS.en[key] ?? key;
      } else {
        text = dict[key] ?? STRINGS.en[key] ?? fallbackOrParams ?? key;
        p = params;
      }
      if (p && typeof p === 'object' && typeof text === 'string') {
        for (const [k, v] of Object.entries(p)) {
          text = text.replaceAll(`{${k}}`, v !== undefined && v !== null ? String(v) : '');
        }
      }
      return text;
    };
    return {
      lang: currentLang,
      setLang,
      t,
      isRTL,
      languages: LANGUAGES,
    };
  }, [currentLang, isRTL]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
