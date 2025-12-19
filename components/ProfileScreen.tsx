
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Brain, Star, Trophy, Fingerprint, 
  Trash2, Edit2, Check, X, Plus, Copy, Users, Lock, Construction, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';

// Types
interface MemoryItem {
  id: number;
  memory_text: string;
  created_at: string;
}

export type ProfileTabType = 'notes' | 'farm' | 'awards';

interface ProfileScreenProps {
  userId?: string;
  initialTab?: ProfileTabType;
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ userId, initialTab = 'notes', onBack }) => {
  const [activeTab, setActiveTab] = useState<ProfileTabType>(initialTab);
  
  // === STATE: NOTES ===
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isMemLoading, setIsMemLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');

  // === STATE: FARM ===
  const [copied, setCopied] = useState(false);
  // Updated bot username based on user screenshot
  const botUsername = "Lingooai_bot"; 
  const inviteLink = `https://t.me/${botUsername}?start=ref_${userId || 'guest'}`;

  // === EFFECTS ===
  useEffect(() => {
    if (activeTab === 'notes' && userId) loadMemories();
  }, [activeTab, userId]);

  const loadMemories = async () => {
    if (!userId) return;
    setIsMemLoading(true);
    const { data } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setMemories(data);
    setIsMemLoading(false);
  };

  // === HANDLERS: NOTES ===
  const handleDelete = async (id: number) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    await supabase.from('user_memories').delete().eq('id', id);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editText.trim()) return;
    setMemories(prev => prev.map(m => m.id === id ? { ...m, memory_text: editText } : m));
    setEditingId(null);
    await supabase.from('user_memories').update({ memory_text: editText }).eq('id', id);
  };

  const handleAddNew = async () => {
    if (!newMemoryText.trim() || !userId) return;
    const tempId = Date.now();
    setMemories([{ id: tempId, memory_text: newMemoryText, created_at: new Date().toISOString() }, ...memories]);
    setIsAddingNew(false);
    setNewMemoryText('');
    await supabase.from('user_memories').insert({ user_id: userId, memory_text: newMemoryText });
    loadMemories();
  };

  // === HANDLERS: FARM ===
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
    <div className="flex flex-col h-full bg-[#111827] text-white font-sans animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="p-4 pt-4 bg-[#111827] sticky top-0 z-20 border-b border-white/5 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-heading">Профиль</h1>
        </div>

        {/* TABS SWITCHER */}
        <div className="bg-[#1F2937] p-1 rounded-xl flex shadow-inner">
          <button 
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'notes' ? 'bg-[#374151] text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Brain size={16} /> Мозг
          </button>
          <button 
            onClick={() => setActiveTab('farm')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'farm' ? 'bg-[#374151] text-yellow-400 shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Star size={16} /> Ферма
          </button>
          <button 
            onClick={() => setActiveTab('awards')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'awards' ? 'bg-[#374151] text-indigo-400 shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Trophy size={16} /> Награды
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          
          {/* === TAB 1: МОЗГ ЛЕО (NOTES) === */}
          {activeTab === 'notes' && (
            <motion.div 
              key="notes"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3">
                <div className="mt-1"><Fingerprint size={20} className="text-indigo-400" /></div>
                <div>
                  <h3 className="text-sm font-bold text-indigo-300">Память Лео</h3>
                  <p className="text-xs text-indigo-200/70 mt-1">
                    Здесь всё, что ИИ запомнил о тебе. Редактируй факты или добавляй свои правила обучения.
                  </p>
                </div>
              </div>

              {!isAddingNew ? (
                <button onClick={() => setIsAddingNew(true)} className="w-full py-3 border border-dashed border-gray-600 rounded-xl text-gray-400 text-sm hover:bg-white/5 transition flex items-center justify-center gap-2 active:scale-95">
                  <Plus size={16} /> Добавить заметку
                </button>
              ) : (
                <div className="bg-[#1F2937] p-3 rounded-xl border border-indigo-500/50 animate-in fade-in zoom-in-95">
                  <input autoFocus type="text" value={newMemoryText} onChange={(e) => setNewMemoryText(e.target.value)} placeholder="Например: Я работаю дизайнером..." className="w-full bg-transparent text-white text-sm focus:outline-none mb-3 placeholder:text-gray-600" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingNew(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X size={16}/></button>
                    <button onClick={handleAddNew} className="bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 text-white"><Check size={14} /> OK</button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {memories.length === 0 && !isMemLoading && (
                    <div className="text-center py-8 opacity-40">
                        <p className="text-sm">Лео пока ничего не знает о тебе.</p>
                    </div>
                )}
                
                {memories.map((mem) => (
                  <div key={mem.id} className="bg-[#1F2937] p-4 rounded-xl border border-white/5 group relative">
                    {editingId === mem.id ? (
                      <div>
                        <input className="w-full bg-black/20 text-white text-sm p-2 rounded-lg border border-indigo-500/50 focus:outline-none" value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 px-2 py-1">Отмена</button>
                          <button onClick={() => handleSaveEdit(mem.id)} className="text-xs bg-indigo-600 px-3 py-1 rounded-lg text-white">Сохранить</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-3">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_5px_#10B981]"></div>
                          <p className="text-sm text-gray-200">{mem.memory_text}</p>
                        </div>
                        <div className="flex gap-1 opacity-60 group-hover:opacity-100">
                          <button onClick={() => { setEditingId(mem.id); setEditText(mem.memory_text); }} className="p-1.5 hover:text-indigo-400 transition"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(mem.id)} className="p-1.5 hover:text-red-400 transition"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* === TAB 2: ФЕРМА ЗВЕЗД (FARM) === */}
          {activeTab === 'farm' && (
            <motion.div 
              key="farm"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/10 border border-yellow-500/30 p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Star size={100} /></div>
                <p className="text-yellow-200/70 text-xs font-bold uppercase tracking-wider mb-2">Текущий баланс</p>
                <div className="text-5xl font-black text-white flex items-center justify-center gap-2 drop-shadow-md">
                  0 <Star size={36} className="text-yellow-400 fill-yellow-400" />
                </div>
                <p className="text-xs text-gray-400 mt-4">Используй звезды для разблокировки сценариев.</p>
              </div>

              {/* "Coming Soon" Placeholder */}
              <div className="w-full bg-[#1F2937] p-4 rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center text-center opacity-80">
                  <div className="bg-gray-700/30 p-2 rounded-full mb-2">
                    <Clock size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">Скоро вы сможете здесь зарабатывать</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Раздел с заданиями находится в разработке</p>
              </div>

              {/* Referral */}
              <div className="bg-[#1F2937] rounded-2xl p-5 border border-white/5 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={20} className="text-emerald-400" />
                  <h3 className="font-bold text-sm">Реферальная программа</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Пригласи друга и получи <span className="text-yellow-400 font-bold">приятные бонусы</span>. 
                  За переход друга вам обоим будет начислено <span className="text-emerald-400 font-bold">XP</span>.
                </p>
                <div className="bg-black/30 p-1 pl-3 rounded-xl flex items-center justify-between border border-white/10">
                  <span className="text-xs text-gray-500 truncate w-32 select-all">{inviteLink}</span>
                  <button 
                    onClick={copyLink} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-gray-200'}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* === TAB 3: НАГРАДЫ (AWARDS) === */}
          {activeTab === 'awards' && (
            <motion.div 
              key="awards"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center pt-10"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-[#1F2937] rounded-full flex items-center justify-center border-2 border-dashed border-gray-600 shadow-2xl">
                  <Construction size={48} className="text-yellow-500 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-full border-4 border-[#111827]">
                  <Lock size={20} className="text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold mb-2 font-heading">Зал Славы строится 🏗️</h2>
              <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed mb-8">
                Система достижений в разработке. Здесь ты будешь получать медали и Звезды.
              </p>

              {/* Связка с фермой */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-3 w-full max-w-xs text-left backdrop-blur-sm">
                <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0">
                  <Star className="text-yellow-500" size={20} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-yellow-200">Связь с Фермой</h3>
                  <p className="text-[10px] text-yellow-200/70 mt-0.5 leading-snug">
                    Каждая ачивка будет пополнять твой баланс звезд. Весь текущий прогресс будет учтен!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
