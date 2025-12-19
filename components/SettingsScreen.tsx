
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Shield, Info, LogOut, Moon, Sun, Camera, Check, RefreshCw, AlertTriangle, User, MessageSquarePlus, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserAvatar, submitUserFeedback } from '../services/supabase';
import { notifyAdmin } from '../services/botService';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onResetProgress?: () => void;
  currentAvatar?: string;
  userId?: string;
  onAvatarChange?: (newUrl: string) => void;
}

// Curated list of high-quality avatar styles from DiceBear
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/9.x/micah/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/micah/svg?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/micah/svg?seed=George&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Leo&backgroundColor=e1f5fe',
  'https://api.dicebear.com/9.x/notionists/svg?seed=Mila&backgroundColor=fce4ec',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sophia&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Robot1&backgroundColor=e1f5fe',
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onBack, 
  onLogout, 
  onResetProgress,
  currentAvatar,
  userId,
  onAvatarChange 
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  // Sync with actual DOM class
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDarkMode) {
        html.classList.remove('dark');
        setIsDarkMode(false);
    } else {
        html.classList.add('dark');
        setIsDarkMode(true);
    }
  };

  const handleSelectAvatar = async (url: string) => {
      setSelectedAvatar(url);
      
      // Update locally immediately
      if (onAvatarChange) onAvatarChange(url);
      
      // Persist to Supabase
      if (userId) {
          await updateUserAvatar(userId, url);
      }
      
      // Close menu after short delay
      setTimeout(() => setIsAvatarMenuOpen(false), 300);
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !userId) return;
    
    // UI Feedback
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Спасибо! Лео передал ваш отзыв разработчику. 💌");
    }
    
    setShowFeedbackInput(false);
    
    try {
        await submitUserFeedback(userId, feedbackText, 'manual');
        await notifyAdmin(`📨 **Ручной отзыв**\n\nЮзер: ${userId}\nТекст: "${feedbackText}"`);
    } catch (e) {
        console.error("Feedback error", e);
    }
    
    setFeedbackText("");
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-[#111827] text-text-light dark:text-white overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header Area */}
      <div className="flex flex-col gap-2 bg-background-light dark:bg-[#111827] px-4 pt-4 pb-2 sticky top-0 z-10">
        <div className="flex items-center h-12">
            <button onClick={onBack} className="flex items-center justify-center rounded-full text-text-light dark:text-[#F3F4F6] -ml-2 p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft size={24} />
            </button>
        </div>
        <p className="text-text-light dark:text-[#F3F4F6] font-heading tracking-tight text-[32px] font-bold leading-tight">Настройки</p>
      </div>

      <div className="flex-grow p-4 space-y-8">
        
        {/* AVATAR SECTION */}
        <div className="flex justify-center mb-6">
            <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-white/10 shadow-xl overflow-hidden bg-indigo-900/20 flex items-center justify-center">
                    {selectedAvatar ? (
                        <img 
                            src={selectedAvatar} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                         <User size={48} className="text-indigo-300/50" />
                    )}
                </div>
                <button 
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2.5 rounded-full border-4 border-[#111827] shadow-lg hover:bg-indigo-500 transition-transform active:scale-95"
                >
                    <Camera size={18} />
                </button>
            </div>
        </div>

        {/* AVATAR SELECTION GRID (Expandable) */}
        <AnimatePresence>
            {isAvatarMenuOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="bg-[#1F2937] border border-white/5 rounded-2xl p-4 mb-6 shadow-inner">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-3 text-center">Выберите персонажа</p>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATAR_OPTIONS.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectAvatar(url)}
                                    className={`relative rounded-full aspect-square overflow-hidden border-2 transition-all ${selectedAvatar === url ? 'border-indigo-500 scale-110 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'border-transparent hover:border-white/20'}`}
                                >
                                    <img src={url} className="w-full h-full object-cover" alt="avatar option" />
                                    {selectedAvatar === url && (
                                        <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
                                            <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* General Section */}
        <div className="space-y-2">
            <p className="text-text-secondary-light dark:text-[#9CA3AF] text-sm font-semibold uppercase px-4">Общие</p>
            <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 shadow-sm">
                {/* Theme Toggle */}
                <div 
                    onClick={toggleTheme}
                    className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="text-[#6366F1] flex items-center justify-center rounded-lg bg-[#6366F1]/10 shrink-0 size-10">
                            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <p className="text-text-light dark:text-[#F3F4F6] text-base font-medium leading-normal flex-1 truncate">
                            {isDarkMode ? 'Тёмная тема' : 'Светлая тема'}
                        </p>
                    </div>
                    <div className={`relative flex h-[31px] w-[51px] items-center rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-[#6366F1]' : 'bg-gray-300'}`}>
                        <div className={`h-[27px] w-[27px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-[20px]' : 'translate-x-0'}`}></div>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-[#374151] mx-4"></div>

                {/* Notifications */}
                <div className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="text-[#6366F1] flex items-center justify-center rounded-lg bg-[#6366F1]/10 shrink-0 size-10">
                            <Bell size={20} />
                        </div>
                        <p className="text-text-light dark:text-[#F3F4F6] text-base font-medium leading-normal flex-1 truncate">Уведомления</p>
                    </div>
                    <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-gray-300 dark:bg-[#374151] p-0.5 has-[:checked]:bg-[#6366F1]">
                        <div className="h-full w-[27px] rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out translate-x-[20px]"></div>
                        <input defaultChecked className="invisible absolute" type="checkbox"/>
                    </label>
                </div>
            </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-2">
            <p className="text-text-secondary-light dark:text-[#9CA3AF] text-sm font-semibold uppercase px-4">Обратная связь</p>
            <div className="rounded-xl bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 shadow-sm p-4">
                {!showFeedbackInput ? (
                    <button 
                        onClick={() => setShowFeedbackInput(true)}
                        className="w-full flex items-center justify-between text-indigo-400 hover:text-indigo-300 transition"
                    >
                        <div className="flex items-center gap-3">
                            <MessageSquarePlus size={20} />
                            <span className="font-medium text-gray-200">Написать разработчику</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                    </button>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <textarea 
                            autoFocus
                            placeholder="Что можно улучшить? Напишите любую идею..."
                            className="w-full bg-black/20 rounded-lg p-3 text-sm text-white border border-gray-600 focus:border-indigo-500 outline-none resize-none h-24"
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => setShowFeedbackInput(false)}
                                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleSendFeedback}
                                disabled={!feedbackText.trim()}
                                className="px-4 py-1.5 bg-indigo-600 rounded-lg text-xs font-bold text-white flex items-center gap-1 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={12} /> Отправить
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Security Section */}
        <div className="space-y-2">
             <p className="text-text-secondary-light dark:text-[#9CA3AF] text-sm font-semibold uppercase px-4">Безопасность и информация</p>
             <div className="flex flex-col gap-px overflow-hidden rounded-xl bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-800 shadow-sm">
                {/* Privacy */}
                <div className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="text-[#6366F1] flex items-center justify-center rounded-lg bg-[#6366F1]/10 shrink-0 size-10">
                            <Shield size={20} />
                        </div>
                        <p className="text-text-light dark:text-[#F3F4F6] text-base font-medium leading-normal flex-1 truncate">Конфиденциальность</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 dark:text-[#9CA3AF]">chevron_right</span>
                </div>
                
                <div className="h-px bg-gray-100 dark:bg-[#374151] mx-4"></div>
                
                {/* About */}
                <div className="flex items-center gap-4 px-4 min-h-[56px] justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2d3748] transition-colors">
                    <div className="flex items-center gap-4">
                         <div className="text-[#6366F1] flex items-center justify-center rounded-lg bg-[#6366F1]/10 shrink-0 size-10">
                            <Info size={20} />
                        </div>
                        <p className="text-text-light dark:text-[#F3F4F6] text-base font-medium leading-normal flex-1 truncate">О приложении</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 dark:text-[#9CA3AF]">chevron_right</span>
                </div>
             </div>
        </div>
        
        {/* DANGER ZONE: Reset Progress */}
        {onResetProgress && (
           <div className="space-y-2">
              <p className="text-red-400 text-sm font-semibold uppercase px-4">Опасная зона</p>
              <div className="rounded-xl bg-white dark:bg-[#1F2937] border border-red-500/20 shadow-sm p-4">
                {!showResetConfirm ? (
                   <button 
                     onClick={() => setShowResetConfirm(true)}
                     className="w-full flex items-center justify-between text-red-500 hover:text-red-400 transition"
                   >
                     <div className="flex items-center gap-3">
                       <RefreshCw size={20} />
                       <span className="font-medium">Сбросить весь прогресс</span>
                     </div>
                     <span className="text-xs font-bold border border-red-500/30 px-2 py-1 rounded">RESET</span>
                   </button>
                ) : (
                   <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                     <div className="flex items-start gap-3 text-red-400">
                       <AlertTriangle size={24} className="shrink-0" />
                       <p className="text-xs leading-relaxed">
                         Вы уверены? Это действие <b>удалит</b> ваш уровень, опыт, переписку и все достижения. Отменить нельзя.
                       </p>
                     </div>
                     <div className="flex gap-2">
                       <button 
                         onClick={() => setShowResetConfirm(false)}
                         className="flex-1 py-2 bg-gray-700 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-600 transition"
                       >
                         Отмена
                       </button>
                       <button 
                         onClick={onResetProgress}
                         className="flex-1 py-2 bg-red-600 rounded-lg text-sm font-bold text-white hover:bg-red-500 transition"
                       >
                         Да, удалить
                       </button>
                     </div>
                   </div>
                )}
              </div>
           </div>
        )}

        {/* Logout */}
        <div className="mt-4">
            <button 
                onClick={onLogout}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-white dark:bg-[#1F2937] hover:bg-red-50 dark:hover:bg-[#2d3748] transition-colors py-3.5 border border-red-200 dark:border-transparent active:scale-[0.99] shadow-sm"
            >
                <LogOut size={18} className="text-[#EF4444]" />
                <span className="text-[#EF4444] text-base font-semibold">Закрыть приложение</span>
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">Версия 1.0.4 (Release Candidate)</p>
        </div>
      </div>
    </div>
  );
};
