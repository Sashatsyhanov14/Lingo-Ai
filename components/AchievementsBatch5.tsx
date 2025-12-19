import React from 'react';
import { motion } from 'framer-motion';
import { Book, Rocket, Trophy, Crown, Lock } from 'lucide-react';

// 1. Data Configuration
const ACHIEVEMENTS_DATA = [
  {
    id: 'vocab_giant',
    title: 'Словарь-Гигант',
    subtitle: '50 слов в твоем арсенале.',
    icon: 'Book',
    color: 'indigo',
    isUnlocked: true
  },
  {
    id: 'unstoppable',
    title: 'Неудержимый',
    subtitle: '7 дней подряд. Это характер.',
    icon: 'Rocket',
    color: 'red',
    isUnlocked: false // Locked for demo
  },
  {
    id: 'week_hero',
    title: 'Герой недели',
    subtitle: '30 минут практики за неделю.',
    icon: 'Trophy',
    color: 'yellow',
    isUnlocked: false // Locked for demo
  },
  {
    id: 'legend',
    title: 'Легенда',
    subtitle: '30 уроков. Ты прошел игру.',
    icon: 'Crown',
    color: 'legend_gradient', // Special key
    isUnlocked: false // Locked for demo (Final Boss)
  }
];

// Color Mapping
const COLORS: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  // Special Gradient for the Legend
  legend_gradient: { bg: 'bg-gradient-to-tr from-yellow-400/20 to-purple-500/20', text: 'text-yellow-300' },
};

// Icon Mapping
const ICONS: Record<string, any> = {
  Book,
  Rocket,
  Trophy,
  Crown,
  Lock
};

// 2. Animation Variants
const iconVariants = {
  vocab_giant: {
    hover: { 
      rotateY: [0, 180, 0], // Page flip effect
      transition: { duration: 1.2, ease: "easeInOut" }
    }
  },
  unstoppable: {
    hover: { 
      x: [-2, 2, -2, 2, 0], // Engine shake
      y: [0, 0, 0, 0, -20, 0], // Launch
      transition: { duration: 1, times: [0, 0.2, 0.4, 0.6, 0.8, 1], ease: "easeInOut" }
    }
  },
  week_hero: {
    hover: { 
      rotateY: 360, // Victory Spin
      transition: { duration: 1.5, ease: "circOut" }
    }
  },
  legend: {
    hover: { 
      scale: [1, 1.15, 1], // Royal breathing
      filter: [
        "drop-shadow(0 0 0px rgba(253, 224, 71, 0))", 
        "drop-shadow(0 0 10px rgba(253, 224, 71, 0.6))", 
        "drop-shadow(0 0 0px rgba(253, 224, 71, 0))"
      ],
      transition: { duration: 2, ease: "easeInOut", repeat: Infinity }
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

export const AchievementsBatch5: React.FC = () => {
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
        
        // Special border for Legend
        const borderClass = item.id === 'legend' && item.isUnlocked 
          ? 'border-yellow-500/30' 
          : 'border-white/5';

        return (
          <motion.div
            key={item.id}
            custom={index}
            initial="hidden"
            animate="visible"
            whileHover={item.isUnlocked ? "hover" : undefined}
            variants={cardVariants}
            className={`${containerClasses} ${borderClass}`}
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
                  style={{ perspective: 1000 }} // For 3D rotations
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