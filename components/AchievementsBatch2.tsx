import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Coffee, Home, Lock } from 'lucide-react';

// 1. Data Configuration
const ACHIEVEMENTS_DATA = [
  {
    id: 'early_bird',
    title: 'Ранняя пташка',
    subtitle: 'Утро начинается с пользы.',
    icon: 'Sun',
    color: 'amber',
    isUnlocked: true
  },
  {
    id: 'night_thinker',
    title: 'Ночной мыслитель',
    subtitle: 'Учение свет, даже в темноте.',
    icon: 'Moon',
    color: 'indigo_dark', // Special dark case
    isUnlocked: true
  },
  {
    id: 'weekend_warrior',
    title: 'Выходной воин',
    subtitle: 'Уютный урок с кофе.',
    icon: 'Coffee',
    color: 'rose',
    isUnlocked: false // Locked for demo
  },
  {
    id: 'welcome_back',
    title: 'С возвращением',
    subtitle: 'Мы скучали! Рады видеть.',
    icon: 'Home',
    color: 'teal',
    isUnlocked: true
  }
];

// Color Mapping (Adapted for Dark Mode consistency)
const COLORS: Record<string, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  indigo_dark: { bg: 'bg-indigo-900/50', text: 'text-indigo-300' }, // Deeper background as requested
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400' },
};

// Icon Mapping
const ICONS: Record<string, any> = {
  Sun,
  Moon,
  Coffee,
  Home,
  Lock
};

// 2. Animation Variants
const iconVariants = {
  early_bird: {
    hover: { 
      y: [2, -4, 2],
      rotate: [0, 45, 90], // Sunrise rotation
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  },
  night_thinker: {
    hover: { 
      rotate: [-15, 15, -15], // Sleepy Swing
      transition: { duration: 2, ease: "easeInOut", repeat: Infinity }
    }
  },
  weekend_warrior: {
    hover: { 
      scale: [1, 1.1, 1], // Breathing/Steam effect
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
    }
  },
  welcome_back: {
    hover: { 
      scale: [1, 1.15, 0.9, 1.1, 1], // Doorbell knock
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 }
  }),
  hover: { 
    y: -4,
    transition: { type: "spring", stiffness: 400, damping: 17 }
  }
};

export const AchievementsBatch2: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {ACHIEVEMENTS_DATA.map((item, index) => {
        const IconComponent = item.isUnlocked ? ICONS[item.icon] : Lock;
        const colorStyle = COLORS[item.color];
        
        // Dynamic classes
        const containerClasses = item.isUnlocked
          ? `relative overflow-hidden rounded-2xl bg-[#1F2937] border border-white/5 p-4 transition-colors hover:bg-[#2d3748] hover:border-white/10 group cursor-default`
          : `relative overflow-hidden rounded-2xl bg-[#1F2937] border border-white/5 p-4 opacity-50 grayscale cursor-not-allowed`;

        const iconBgClass = item.isUnlocked ? colorStyle.bg : 'bg-gray-700/50';
        const iconColorClass = item.isUnlocked ? colorStyle.text : 'text-gray-400';

        return (
          <motion.div
            key={item.id}
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover={item.isUnlocked ? "hover" : undefined}
            variants={cardVariants}
            className={containerClasses}
          >
            {/* Background Glow */}
            {item.isUnlocked && (
               <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${colorStyle.bg} blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
            )}

            <div className="relative z-10 flex flex-col items-start gap-3 h-full justify-between">
              {/* Icon Container */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBgClass} ${item.isUnlocked ? 'shadow-inner' : ''}`}>
                <motion.div
                  variants={item.isUnlocked ? iconVariants[item.id as keyof typeof iconVariants] : {}}
                >
                  <IconComponent 
                    className={`h-6 w-6 ${iconColorClass}`} 
                    strokeWidth={2.5} 
                  />
                </motion.div>
              </div>

              {/* Text Content */}
              <div className="w-full">
                <h3 className={`font-heading text-[15px] font-bold leading-tight ${item.isUnlocked ? 'text-gray-100' : 'text-gray-400'}`}>
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs font-medium leading-snug text-gray-500 line-clamp-2">
                  {item.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};