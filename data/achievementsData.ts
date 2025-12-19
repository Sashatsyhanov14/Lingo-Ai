import { Hand, Mic, Sprout, Flame, Sun, Moon, Coffee, Home, Search, HelpCircle, Zap, Mic2, Compass, Gem, Activity, Headphones, Book, Rocket, Trophy, Crown, Lock } from 'lucide-react';

// Maps the string icon name from Database to the actual Lucide Component
export const ACHIEVEMENT_ICONS: Record<string, any> = {
  'Hand': Hand,
  'Mic': Mic,
  'Sprout': Sprout,
  'Flame': Flame,
  'Sun': Sun,
  'Moon': Moon,
  'Coffee': Coffee,
  'Home': Home,
  'Search': Search,
  'HelpCircle': HelpCircle,
  'Zap': Zap,
  'Mic2': Mic2,
  'Compass': Compass,
  'Gem': Gem,
  'Activity': Activity,
  'Headphones': Headphones,
  'Book': Book,
  'Rocket': Rocket,
  'Trophy': Trophy,
  'Crown': Crown,
  'Lock': Lock
};

export const getAchievementIcon = (iconName: string) => {
    return ACHIEVEMENT_ICONS[iconName] || Lock;
};