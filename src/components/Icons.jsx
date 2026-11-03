import React from 'react';
import {
  Bell,
  AlarmClock,
  Calendar,
  Pill,
  Droplets,
  Dumbbell,
  BookOpen,
  Coffee,
  Heart,
  Briefcase,
  ShoppingCart,
  ListTodo,
  Phone,
  Mail,
  Utensils,
  Zap,
  Moon,
  Sun,
  Smile,
  Car,
  Home,
  Sparkles,
  CreditCard,
  Flame,
  Target,
  Music,
  Laptop,
  Apple,
  Flower2,
  Ban,
} from 'lucide-react';

const LUCIDE_ICONS_MAP = {
  bell: Bell,
  alarm: AlarmClock,
  clock: AlarmClock,
  calendar: Calendar,
  pill: Pill,
  meds: Pill,
  medicine: Pill,
  water: Droplets,
  droplets: Droplets,
  drink: Droplets,
  dumbbell: Dumbbell,
  workout: Dumbbell,
  gym: Dumbbell,
  exercise: Dumbbell,
  book: BookOpen,
  read: BookOpen,
  study: BookOpen,
  coffee: Coffee,
  heart: Heart,
  health: Heart,
  briefcase: Briefcase,
  work: Briefcase,
  job: Briefcase,
  shopping: ShoppingCart,
  cart: ShoppingCart,
  groceries: ShoppingCart,
  todo: ListTodo,
  list: ListTodo,
  task: ListTodo,
  phone: Phone,
  call: Phone,
  mail: Mail,
  email: Mail,
  utensils: Utensils,
  food: Utensils,
  eat: Utensils,
  dinner: Utensils,
  lunch: Utensils,
  zap: Zap,
  focus: Zap,
  energy: Zap,
  moon: Moon,
  sleep: Moon,
  night: Moon,
  sun: Sun,
  morning: Sun,
  smile: Smile,
  mood: Smile,
  happy: Smile,
  car: Car,
  drive: Car,
  travel: Car,
  home: Home,
  house: Home,
  sparkles: Sparkles,
  clean: Sparkles,
  card: CreditCard,
  creditcard: CreditCard,
  bank: CreditCard,
  finance: CreditCard,
  money: CreditCard,
  flame: Flame,
  fire: Flame,
  streak: Flame,
  target: Target,
  goal: Target,
  music: Music,
  song: Music,
  audio: Music,
  laptop: Laptop,
  code: Laptop,
  computer: Laptop,
  apple: Apple,
  fruit: Apple,
  diet: Apple,
  meditate: Flower2,
  lotus: Flower2,
  nosocial: Ban,
};

/**
 * Pixel-perfect SVG icons matching the mockup design
 */

export function DumbbellIcon({ size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Left weight */}
      <rect x="2" y="7" width="3.5" height="10" rx="1.75" fill={color} />
      {/* Right weight */}
      <rect x="18.5" y="7" width="3.5" height="10" rx="1.75" fill={color} />
      {/* Inner collars */}
      <rect x="6.5" y="9" width="2" height="6" rx="1" fill={color} />
      <rect x="15.5" y="9" width="2" height="6" rx="1" fill={color} />
      {/* Handle */}
      <rect x="8" y="10.5" width="8" height="3" rx="1.5" fill={color} />
    </svg>
  );
}

export function BookIcon({ size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 7.5C3 6.11929 4.11929 5 5.5 5H10.5C11.3284 5 12 5.67157 12 6.5V18.5C12 17.6716 11.3284 17 10.5 17H5C3.89543 17 3 17.8954 3 19V7.5Z"
        fill={color}
      />
      <path
        d="M21 7.5C21 6.11929 19.8807 5 18.5 5H13.5C12.6716 5 12 5.67157 12 6.5V18.5C12 17.6716 12.6716 17 13.5 17H19C20.1046 17 21 17.8954 21 19V7.5Z"
        fill={color}
      />
    </svg>
  );
}

export function WaterIcon({ size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5C12 2.5 5.5 10.5 5.5 15C5.5 18.5899 8.41015 21.5 12 21.5C15.5899 21.5 18.5 18.5899 18.5 15C18.5 10.5 12 2.5 12 2.5Z"
        fill={color}
      />
    </svg>
  );
}

export function MeditateIcon({ size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Central petal */}
      <path
        d="M12 4C10.5 8 10.5 12 12 15C13.5 12 13.5 8 12 4Z"
        fill={color}
      />
      {/* Left petal */}
      <path
        d="M10 9C7 10.5 5 13.5 5.5 16.5C8 17 11 15 11.5 13C11 11.5 10.5 10 10 9Z"
        fill={color}
      />
      {/* Right petal */}
      <path
        d="M14 9C17 10.5 19 13.5 18.5 16.5C16 17 13 15 12.5 13C13 11.5 13.5 10 14 9Z"
        fill={color}
      />
      {/* Base curve */}
      <path
        d="M7 18C10 20 14 20 17 18C15.5 19 12 19.5 7 18Z"
        fill={color}
      />
    </svg>
  );
}

export function NoSocialIcon({ size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.75" />
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2.75" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3C8.68629 3 6 5.68629 6 9V14.2C6 14.8 5.6 15.4 5.1 15.8L4.3 16.4C3.5 17 4 18.4 5 18.4H19C20 18.4 20.5 17 19.7 16.4L18.9 15.8C18.4 15.4 18 14.8 18 14.2V9C18 5.68629 15.3137 3 12 3Z"
        fill={color}
      />
      <path
        d="M10 19.5C10 20.6046 10.8954 21.5 12 21.5C13.1046 21.5 14 20.6046 14 19.5H10Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Screen 3 Hero Artwork — Stylized red dumbbell / wave symbol
 */
export function WorkoutHeroLogo({ size = 80, color = 'var(--primary, #FF2442)', className = '' }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 100 75" fill="none" className={className}>
      {/* Outer Left Bar */}
      <rect x="8" y="24" width="9" height="27" rx="4.5" fill={color} />
      {/* Mid Left Bar */}
      <rect x="23" y="12" width="11" height="51" rx="5.5" fill={color} />
      {/* Center Left Bar */}
      <rect x="40" y="4" width="12" height="67" rx="6" fill={color} />
      {/* Center Right Bar */}
      <rect x="58" y="12" width="11" height="51" rx="5.5" fill={color} />
      {/* Outer Right Bar */}
      <rect x="75" y="24" width="9" height="27" rx="4.5" fill={color} />
    </svg>
  );
}

/**
 * Bottom Nav Habits Tab Icon (3 rounded bars)
 */
export function HabitsNavIcon({ size = 22, color = '#8E8E93', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="9" width="3.5" height="11" rx="1.75" fill={color} />
      <rect x="10.25" y="4" width="3.5" height="16" rx="1.75" fill={color} />
      <rect x="16.5" y="11" width="3.5" height="9" rx="1.75" fill={color} />
    </svg>
  );
}

/**
 * Bottom Nav Tasks Tab Icon (Square with checkmark)
 */
export function TasksNavIcon({ size = 22, color = '#8E8E93', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke={color} strokeWidth="2" />
      <path d="M8 12L10.5 14.5L16 9" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Universal Habit Icon Selector
 */
export default function HabitIcon({ name = 'dumbbell', size = 24, color = 'var(--primary, #FF2442)', className = '' }) {
  const n = String(name || '').toLowerCase().trim();

  // 1. Direct Lucide map match
  if (LUCIDE_ICONS_MAP[n]) {
    const Component = LUCIDE_ICONS_MAP[n];
    return <Component size={size} color={color} className={className} strokeWidth={2.2} />;
  }

  // 2. Mockup-specific custom SVG matches
  if (n.includes('workout') || n.includes('gym') || n.includes('exercise') || n.includes('dumbbell')) {
    return <DumbbellIcon size={size} color={color} className={className} />;
  }
  if (n.includes('read') || n.includes('book') || n.includes('study')) {
    return <BookIcon size={size} color={color} className={className} />;
  }
  if (n.includes('water') || n.includes('drink') || n.includes('hydrate')) {
    return <WaterIcon size={size} color={color} className={className} />;
  }
  if (n.includes('meditate') || n.includes('mind') || n.includes('lotus')) {
    return <MeditateIcon size={size} color={color} className={className} />;
  }
  if (n.includes('social') || n.includes('phone') || n.includes('screen') || n.includes('ban') || n.includes('no')) {
    return <NoSocialIcon size={size} color={color} className={className} />;
  }

  // 3. Fallback
  return <Bell size={size} color={color} className={className} strokeWidth={2.2} />;
}
