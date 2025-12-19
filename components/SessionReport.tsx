
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, MessageSquare, CheckCircle, Share2, X } from 'lucide-react';

interface SessionReportProps {
  userName: string;
  level: number;
  xpGained: number;
  corrections: number;
  onClose: () => void;
  onShare: () => void;
}

export const SessionReport: React.FC<SessionReportProps> = ({
  userName,
  level,
  xpGained,
  corrections,
  onClose,
  onShare
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="fixed inset-0 z-[100] bg-[#111827] flex flex-col p-6 overflow-y-auto"
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full">
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-block relative mb-4">
            <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-xl transform rotate-3">
              <Trophy size={48} className="text-white drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter font-heading">
            Session Done!
          </h1>
          <p className="text-indigo-400 font-medium mt-1">Отличная работа, {userName}! 🦁</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Level</p>
            <p className="text-3xl font-black text-indigo-400">{level}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">XP Gained</p>
            <p className="text-3xl font-black text-emerald-400">+{xpGained}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Corrections</p>
            <p className="text-3xl font-black text-amber-400">{corrections}</p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Duration</p>
            <p className="text-3xl font-black text-blue-400">~15m</p>
          </motion.div>
        </div>

        {/* Leo's Insights Card */}
        <motion.div variants={itemVariants} className="bg-indigo-600/20 border border-indigo-500/30 rounded-3xl p-6 mb-10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Star size={64} fill="currentColor" className="text-indigo-400" />
           </div>
           <h3 className="text-indigo-300 font-bold flex items-center gap-2 mb-3">
             <Star size={18} fill="currentColor" /> Leo's Insights
           </h3>
           <p className="text-white text-lg font-medium leading-relaxed italic">
             "Сегодня твои фразы стали на 20% естественнее! Твоя работа с Past Simple заслуживает отдельной награды 🦁🔥"
           </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="mt-auto space-y-3 pb-8">
          <button 
            onClick={onShare}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Share2 size={20} />
            Опубликовать в Leo Bot
          </button>
          <button 
            onClick={onClose}
            className="w-full h-14 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-bold active:scale-95 transition-all"
          >
            Продолжить завтра
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
