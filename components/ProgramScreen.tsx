
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, MapPin, Loader2, Hand, Coffee, Sun, Plane, Rocket, Briefcase, Camera, Music, Heart, Star, Book, Gamepad, Pizza, Car, MessageCircle } from 'lucide-react';
import { getLearningHistory, getUserMemories } from '../services/supabase';
import { generateNextLessonPlan, GeneratedLesson } from '../services/geminiService';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

// Dynamic Icon Mapping
const ICONS: Record<string, any> = {
  Hand, Coffee, Sun, Plane, Rocket, Briefcase, MapPin, 
  Camera, Music, Heart, Star, Book, Gamepad, Pizza, Car, MessageCircle
};

interface ProgramScreenProps {
  onStartLesson: (topicPrompt: string, topicTitle: string) => void;
}

export const ProgramScreen: React.FC<ProgramScreenProps> = ({ onStartLesson }) => {
  const { user } = useTelegramAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [nextStep, setNextStep] = useState<GeneratedLesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // We use a simplified in-memory cache for the session so we don't regenerate on every tab switch
  // In a real app, you might save the "current proposed lesson" to the DB too.
  const cachedNextStep = useMemo(() => {
     return nextStep;
  }, [nextStep]);

  useEffect(() => {
    if (!user?.id) return;

    const loadPathData = async () => {
      setIsLoading(true);
      try {
        // 1. Load History
        const historyData = await getLearningHistory(user.id.toString());
        setHistory(historyData);

        // 2. Generate Next Step (if we don't have one cached)
        if (!cachedNextStep) {
            setIsGenerating(true);
            const memoryData = await getUserMemories(user.id.toString());
            const memories = memoryData.map(m => m.memory_text);
            const historyTitles = historyData.map(h => h.topic_title);

            // Artificial delay for effect if history is small (to show off the "Thinking" state)
            if (historyData.length < 3) await new Promise(r => setTimeout(r, 1200));

            const lesson = await generateNextLessonPlan(historyTitles, memories);
            setNextStep(lesson);
        }
      } catch (err) {
        console.error("Path Error:", err);
      } finally {
        setIsLoading(false);
        setIsGenerating(false);
      }
    };

    loadPathData();
  }, [user?.id]);

  const handleStart = () => {
    if (nextStep) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        }
        onStartLesson(nextStep.system_prompt, nextStep.title);
    }
  };

  const NextIcon = nextStep && ICONS[nextStep.icon] ? ICONS[nextStep.icon] : MapPin;

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white font-display relative overflow-y-auto animate-in fade-in duration-500">
      
      {/* BACKGROUND LINE connecting Past to Future */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-indigo-900/50 to-transparent pointer-events-none" />

      {/* HEADER */}
      <div className="p-6 pb-2 sticky top-0 z-20 bg-[#111827]/90 backdrop-blur-sm">
         <h1 className="text-2xl font-bold font-heading text-indigo-100 pl-2">Твой Путь 🗺️</h1>
      </div>

      <div className="flex-1 px-4 py-4 pb-32">
        
        {/* 1. PAST (History) */}
        <div className="space-y-8 mb-12">
            {history.length === 0 && !isLoading && (
                <div className="pl-12 opacity-50 text-sm text-gray-500">
                    Твоя история начинается здесь...
                </div>
            )}
            
            {history.map((item, i) => (
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={item.id} 
                className="relative pl-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-300 group"
            >
                {/* Connector Dot */}
                <div className="absolute left-8 top-4 w-3 h-3 bg-[#111827] rounded-full border-2 border-emerald-600 transform -translate-x-1/2 z-10 flex items-center justify-center group-hover:scale-125 transition-transform">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                </div>
                
                <div className="bg-[#1F2937] p-4 rounded-xl border border-white/5 group-hover:border-emerald-500/30">
                    <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-gray-300">{item.topic_title}</h3>
                        {item.score > 0 && (
                            <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                                +{item.score} XP
                            </span>
                        )}
                    </div>
                    {item.topic_summary && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.topic_summary}</p>
                    )}
                     <p className="text-[10px] text-gray-600 mt-2 font-mono uppercase">
                        {new Date(item.created_at).toLocaleDateString()}
                    </p>
                </div>
            </motion.div>
            ))}
        </div>

        {/* 2. PRESENT (Active Generation/Card) */}
        <div className="relative pl-12 min-h-[200px]">
            
            {/* The "NOW" Marker */}
            <div className="absolute left-8 top-10 w-6 h-6 bg-indigo-600 rounded-full border-4 border-[#111827] transform -translate-x-1/2 z-10 shadow-[0_0_20px_rgba(99,102,241,0.6)]">
                 <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
            </div>

            {isGenerating || isLoading ? (
                <div className="bg-[#1F2937]/50 border border-white/5 border-dashed p-6 rounded-2xl flex flex-col items-center justify-center gap-4 animate-pulse h-48">
                    <Loader2 size={32} className="text-indigo-400 animate-spin" />
                    <div className="text-center">
                        <p className="text-indigo-300 font-bold text-sm">Лео анализирует прогресс...</p>
                        <p className="text-gray-500 text-xs mt-1">Подбираем идеальную тему</p>
                    </div>
                </div>
            ) : nextStep ? (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                    
                    <div className="relative bg-[#1F2937] border border-indigo-500/40 p-1 rounded-2xl shadow-2xl">
                        <div className="bg-[#111827]/80 backdrop-blur-md p-5 rounded-xl">
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-3 rounded-xl shadow-lg">
                                    <NextIcon size={24} className="text-white" />
                                </div>
                                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                                    Текущая цель
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-white mb-2 leading-tight">
                                {nextStep.title}
                            </h2>
                            <p className="text-sm text-gray-300 leading-relaxed mb-6">
                                {nextStep.description}
                            </p>

                            <button 
                                onClick={handleStart}
                                className="w-full py-3.5 bg-white hover:bg-gray-100 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg group"
                            >
                                <Play size={18} fill="black" className="group-hover:translate-x-0.5 transition-transform" /> 
                                Начать урок
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm">
                    Ошибка генерации пути. Попробуйте обновить.
                </div>
            )}

        </div>

        {/* 3. FUTURE (Fog of War) */}
        <div className="mt-12 pl-12">
            <div className="flex flex-col gap-4 opacity-30">
                <div className="h-20 bg-gray-800 rounded-xl w-full border border-gray-700 border-dashed"></div>
                <div className="h-20 bg-gray-800 rounded-xl w-3/4 border border-gray-700 border-dashed"></div>
            </div>
            <div className="text-center mt-4 text-xs font-mono text-indigo-300/40 uppercase tracking-widest">
                ••• Будущее формируется •••
            </div>
        </div>

      </div>
    </div>
  );
};
