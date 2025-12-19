import React from 'react';
import { motion } from 'framer-motion';
import { Hand, Mic, Sprout, Flame, Lock } from 'lucide-react';

// 1. Data Configuration
const ACHIEVEMENTS_DATA = [
  {
    id: 'first_vibe',
    title: 'Первый Вайб',
    subtitle: 'Ты сделал первый шаг!',
    icon: 'Hand',
    color: 'amber',
    isUnlocked: true
  },
  {
    id: 'voice_brave',
    title: 'Голос Храбрости',
    subtitle: 'Первое голосовое сообщение.',
    icon: 'Mic',
    color: 'indigo',
    isUnlocked: true
  },
  {
    id: 'upgrade',
    title: 'Апгрейд',
    subtitle: 'Превратил ошибку в опыт.',
    icon: 'Sprout',
    color: 'emerald',
    isUnlocked: true
  },
  {
    id: 'in_the_rhythm',
    title: 'Ритм пойман',
    subtitle: '3 дня подряд. Так держать!',
    icon: 'Flame',
    color: 'orange',
    isUnlocked: false
  }
];

// Color Mapping for Tailwind classes
const COLORS: Record<string, { bg: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
};

// Icon Mapping
const ICONS: Record<string, any> = {
  Hand,
  Mic,
  Sprout,
  Flame,
  Lock
};

// 2. Animation Variants for Micro-interactions
const iconVariants = {
  first_vibe: {
    hover: { 
      rotate: [0, 14, -8, 14, 0],
      transition: { duration: 0.6, ease: "easeInOut" }
    }
  },
  voice_brave: {
    hover: { 
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 0.8, ease: "easeInOut" }
    }
  },
  upgrade: {
    hover: { 
      scaleY: [1, 0.6, 1.2, 1], // Squash and stretch effect
      originY: 1,
      transition: { duration: 0.6, type: "spring", stiffness: 300 }
    }
  },
  in_the_rhythm: {
    hover: { 
      x: [-2, 2, -3, 3, -1, 1, 0],
      filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
      transition: { duration: 0.5 }
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

export const AchievementsBatch1: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {ACHIEVEMENTS_DATA.map((item, index) => {
        const IconComponent = item.isUnlocked ? ICONS[item.icon] : Lock;
        const colorStyle = COLORS[item.color];
        
        // Dynamic classes based on state
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
            {/* Background Glow Gradient (Subtle, only on unlocked) */}
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