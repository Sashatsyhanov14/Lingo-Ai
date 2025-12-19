
import React, { useState } from 'react';
import { ArrowLeft, Star, Users, Copy, Check } from 'lucide-react';

interface StarFarmScreenProps {
  onBack: () => void;
  userId?: string;
}

export const StarFarmScreen: React.FC<StarFarmScreenProps> = ({ onBack, userId }) => {
  const [copied, setCopied] = useState(false);

  // Dynamic Referral Link
  // Updated to match the screenshot provided by user (@Lingooai_bot)
  const botUsername = "Lingooai_bot"; 
  const safeUserId = userId || 'unknown';
  const inviteLink = `https://t.me/${botUsername}?start=ref_${safeUserId}`;

  const copyLink = () => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white p-4 animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pt-2">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition active:scale-90">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-heading">Ферма Звезд ✨</h1>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/10 border border-yellow-500/30 p-8 rounded-3xl text-center mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 opacity-10 rotate-12 pointer-events-none">
            <Star size={180} fill="currentColor" />
        </div>
        
        <p className="text-yellow-200/70 text-xs font-bold uppercase tracking-widest mb-2">Твой баланс</p>
        <div className="text-6xl font-black text-white flex items-center justify-center gap-3 drop-shadow-lg">
          0 <Star size={36} className="text-yellow-400 fill-yellow-400" />
        </div>
        <div className="mt-6 flex justify-center">
            <span className="text-[10px] bg-black/30 text-gray-400 px-3 py-1 rounded-full border border-white/5">
                Магазин откроется на 5 уровне
            </span>
        </div>
      </div>

      {/* Referral Section */}
      <div className="bg-[#1F2937] rounded-2xl p-5 border border-white/5 shadow-lg">
        <div className="flex items-start gap-4 mb-5">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Зови друзей</h3>
            <p className="text-sm text-gray-400 leading-snug mt-1">
              Получи <span className="text-yellow-400 font-bold">100 звезд</span> за каждого друга, который начнет учить английский.
            </p>
          </div>
        </div>

        {/* Link Box */}
        <div className="bg-black/30 p-1.5 pl-4 rounded-xl flex items-center justify-between border border-white/10">
          <span className="text-xs text-gray-500 truncate max-w-[160px] font-mono select-all">
            t.me/{botUsername}...
          </span>
          <button 
            onClick={copyLink}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95
              ${copied 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-white text-black hover:bg-gray-200'}
            `}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Готово' : 'Копировать'}
          </button>
        </div>
      </div>

      <div className="mt-auto text-center p-4 opacity-50">
         <p className="text-[10px] text-gray-500 uppercase tracking-widest">
             Leo Beta v1.0 • Referral System
         </p>
      </div>
    </div>
  );
};
