
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Settings, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TopLevelBarProps {
  currentXP: number;
  level: number;
  xpToNextLevel: number;
  userPhoto?: string;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenStarFarm: () => void; // New prop
}

export const TopLevelBar: React.FC<TopLevelBarProps> = ({ 
  currentXP, 
  level, 
  xpToNextLevel,
  userPhoto,
  onOpenSettings,
  onOpenProfile,
  onOpenStarFarm
}) => {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);
  
  const progressPercent = Math.min((currentXP / xpToNextLevel) * 100, 100);

  useEffect(() => {
    if (level > prevLevel) {
      setShowLevelUp(true);
      triggerConfetti();
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366F1', '#F59E0B', '#10B981']
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366F1', '#F59E0B', '#10B981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return (
    <>
      <div className="sticky top-0 z-30 w-full bg-[#111827]/90 backdrop-blur-md border-b border-white/5 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] shadow-lg">
        <div className="flex items-center gap-3 justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer active:scale-95 transition-transform"
              onClick={onOpenProfile}
            >
                {/* Avatar & Level */}
                 <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-inner">
                       {userPhoto ? (
                          <img 
                            src={userPhoto}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                       ) : (
                          <User size={20} className="text-indigo-400" />
                       )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#111827]">
                      {level}
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="flex-1 flex flex-col gap-1 max-w-[160px]">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Linguist</span>
                      <span className="text-[10px] text-gray-400 font-mono">{currentXP} / {xpToNextLevel} XP</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 10 }}
                      >
                         <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite_linear]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                      </motion.div>
                    </div>
                  </div>
            </div>

            <div className="flex items-center gap-1">
                {/* Star Farm Button */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                    onOpenStarFarm(); 
                  }}
                  className="p-2.5 rounded-full text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 active:bg-yellow-500/20 transition-all"
                >
                  <Star size={20} fill="currentColor" className="drop-shadow-sm" />
                </button>

                {/* Settings Button */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
                    onOpenSettings(); 
                  }}
                  className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all"
                >
                  <Settings size={20} />
                </button>
            </div>
        </div>
      </div>
      
      {/* --- LEVEL UP MODAL --- */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-[#1F2937] border border-indigo-500/30 w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.3)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite] opacity-10">
                 <div className="w-[200%] h-[200%] -ml-[50%] -mt-[50%] bg-[conic-gradient(from_0deg,transparent_0deg,indigo_90deg,transparent_180deg)]"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                  className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-[#1F2937]"
                >
                  <Trophy size={48} className="text-white" />
                </motion.div>

                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-2 uppercase italic tracking-wider">
                  Level Up!
                </h2>
                <p className="text-gray-300 mb-6">
                  Поздравляем! Ты достиг уровня <span className="text-white font-bold text-xl">{level}</span>.
                </p>

                <div className="flex items-center justify-center gap-2 text-indigo-300 bg-indigo-900/30 px-4 py-2 rounded-full mb-6">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold">+ Награды открыты</span>
                </div>

                <button 
                  onClick={() => setShowLevelUp(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg"
                >
                  Продолжить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
