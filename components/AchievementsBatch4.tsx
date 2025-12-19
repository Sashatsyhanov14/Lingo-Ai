import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Gem, Activity, Headphones, Lock } from 'lucide-react';

// 1. Data Configuration
const ACHIEVEMENTS_DATA = [
  {
    id: 'explorer',
    title: 'Исследователь',
    subtitle: '3 разные темы уроков.',
    icon: 'Compass',
    color: 'lime',
    isUnlocked: true
  },
  {
    id: 'word_collector',
    title: 'Коллекционер',
    subtitle: '10 слов в словаре.',
    icon: 'Gem',
    color: 'fuchsia',
    isUnlocked: true
  },
  {
    id: 'ping_pong',
    title: 'Пинг-понг',
    subtitle: '5 быстрых ответов подряд.',
    icon: 'Activity',
    color: 'orange',
    isUnlocked: false // Locked for demo
  },
  {
    id: 'good_listener',
    title: 'Хороший слушатель',
    subtitle: 'Внимание к деталям речи.',
    icon: 'Headphones',
    color: 'blue',
    isUnlocked: true
  }
];

// Color Mapping (Dark mode optimized)
const COLORS: Record<string, { bg: string; text: string }> = {
  lime: { bg: 'bg-lime-500/10', text: 'text-lime-400' },
  fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

// Icon Mapping
const ICONS: Record<string, any> = {
  Compass,
  Gem,
  Activity,
  Headphones,
  Lock
};

// 2. Animation Variants
const iconVariants = {
  explorer: {
    hover: { 
      rotate: [0, 45, -45, 20, 0], // Searching direction
      transition: { duration: 1.5, ease: "easeInOut" }
    }
  },
  word_collector: {
    hover: { 
      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"], // Shine effect
      scale: [1, 1.1, 1],
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.5 }
    }
  },
  ping_pong: {
    hover: { 
      scale: [1, 1.15, 0.9, 1.1, 1], // Fast pulse
      transition: { duration: 0.3, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.2 }
    }
  },
  good_listener: {
    hover: { 
      rotate: [-5, 5, -5], // Vibing
      scale: [1, 1.05, 1],
      transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity }
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

export const AchievementsBatch4: React.FC = () => {
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