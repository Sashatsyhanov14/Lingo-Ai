
import React from 'react';
import { ArrowLeft, Construction, Star, Clock } from 'lucide-react';

interface AchievementsScreenProps {
  onBack: () => void;
  userId?: string;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-[#111827] text-white p-6 relative overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex items-center gap-4 mb-8 pt-2 relative z-10">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition active:scale-90">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 relative z-10 -mt-20">
        
        {/* Icon Construction */}
        <div className="relative">
          <div className="w-24 h-24 bg-[#1F2937] rounded-full flex items-center justify-center border-2 border-dashed border-gray-600 shadow-2xl">
            <Construction size={40} className="text-yellow-500 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-full border-4 border-[#111827] shadow-lg">
            <Clock size={20} className="text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-3 font-heading tracking-tight">Зал Славы строится 🏗️</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            Мы готовим систему легендарных наград. Скоро ты сможешь получать медали за каждый выученный модуль.
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-3 max-w-xs text-left backdrop-blur-sm">
          <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0">
             <Star className="text-yellow-500" size={18} fill="currentColor" />
          </div>
          <p className="text-xs text-yellow-200/90 font-medium leading-snug">
            Твой прогресс уже учитывается! Все награды будут выданы задним числом при обновлении.
          </p>
        </div>
      </div>
    </div>
  );
};
