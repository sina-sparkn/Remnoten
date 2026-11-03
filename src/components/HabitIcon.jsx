import React from 'react';
import {
  Dumbbell,
  BookOpen,
  Droplets,
  Flower2,
  Ban,
  Bell,
  Flame,
  Check,
  Calendar,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  Smartphone,
  CheckSquare,
  Clock,
  Repeat,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Trash2,
  Share2,
  Send,
  X
} from 'lucide-react';

export default function HabitIcon({ name = 'dumbbell', size = 20, className = '', color = '#ff334b' }) {
  const iconProps = { size, color, className };
  const lower = String(name).toLowerCase();

  switch (lower) {
    case 'dumbbell':
    case 'workout':
    case 'exercise':
    case 'gym':
      return <Dumbbell {...iconProps} />;
    case 'book':
    case 'read':
    case 'reading':
    case 'study':
      return <BookOpen {...iconProps} />;
    case 'water':
    case 'drink water':
    case 'hydration':
      return <Droplets {...iconProps} />;
    case 'meditate':
    case 'meditation':
    case 'lotus':
    case 'mind':
      return <Flower2 {...iconProps} />;
    case 'nosocial':
    case 'no social media':
    case 'nosocialmedia':
    case 'ban':
    case 'screen time':
      return <Ban {...iconProps} />;
    case 'bell':
    case 'reminder':
      return <Bell {...iconProps} />;
    case 'flame':
    case 'fire':
    case 'streak':
      return <Flame {...iconProps} />;
    case 'coffee':
      return <Coffee {...iconProps} />;
    case 'heart':
    case 'health':
      return <Heart {...iconProps} />;
    case 'zap':
    case 'energy':
      return <Zap {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
}

export {
  Dumbbell,
  BookOpen,
  Droplets,
  Flower2,
  Ban,
  Bell,
  Flame,
  Check,
  Calendar,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  Smartphone,
  CheckSquare,
  Clock,
  Repeat,
  AlertCircle,
  Plus,
  ChevronRight,
  ChevronLeft,
  Edit3,
  Trash2,
  Share2,
  Send,
  X
};
