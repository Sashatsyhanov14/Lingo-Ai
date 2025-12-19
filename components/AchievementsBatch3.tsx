import React from 'react';
import { motion } from 'framer-motion';
import { Search, HelpCircle, Zap, Mic2, Lock } from 'lucide-react';

// 1. Data Configuration
const ACHIEVEMENTS_DATA = [
  {
    id: 'curious_mind',
    title: 'Любопытный',
    subtitle: 'Не просто ответ, а понимание.',
    icon: 'Search',
    color: 'cyan',
    isUnlocked: true
  },
  {
    id: 'question_master',
    title: 'Мастер вопросов',
    subtitle: 'Правильный вопрос — половина ответа.',
    icon: 'HelpCircle',
    color: 'violet',
    isUnlocked: true
  },
  {
    id: 'flow_state',
    title: 'В потоке',
    subtitle: '10 сообщений на одном дыхании.',
    icon: 'Zap',
    color: 'yellow',
    isUnlocked: false // Locked for demo
  },
  {
    id: 'storyteller',
    title: 'Рассказчик',
    subtitle: 'Твоя история звучит уверенно.',
    icon: 'Mic2',
    color: 'pink',
    isUnlocked: true
  }
];

// Color Mapping (Dark mode optimized)
const COLORS: Record<string, { bg: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  yellow: { bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
};

// Icon Mapping
const ICONS: Record<string, any> = {
  Search,
  HelpCircle,
  Zap,
  Mic2,
  Lock
};

// 2. Animation Variants
const iconVariants = {
  curious_mind: {
    hover: { 
      x: [0, -3, 3, -3, 0],
      y: [0, -3, 3, -3, 0], // Diagonal searching movement
      transition: { duration: 1.5, ease: "linear", repeat: Infinity }
    }
  },
  question_master: {
    hover: { 
      rotate: [0, -20, 20, -10, 10, 0], // Thinking tilt
      y: [0, -2, 0], // Slight jump
      transition: { duration: 1.2, ease: "easeInOut" }
    }
  },
  flow_state: {
    hover: { 
      scale: [1, 1.2, 0.9, 1.1, 1], // Energy charge
      filter: [
        "drop-shadow(0 0 0px rgba(250, 204, 21, 0))", 
        "drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))", 
        "drop-shadow(0 0 0px rgba(250, 204, 21, 0))"
      ],
      transition: { duration: 0.6, ease: "easeOut" }
    }
  },
  storyteller: {
    hover: { 
      scaleY: [1, 1.2, 0.8, 1.1, 1], // Mic vibration/Equalizer effect
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

export const AchievementsBatch3: React.FC = () => {
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