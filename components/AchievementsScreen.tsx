
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Brain, Plus, X, Check, Fingerprint, Edit2, Trash2 } from 'lucide-react';
import { 
  getUserMemories, 
  addUserMemory, 
  updateUserMemory, 
  deleteUserMemory,
  MemoryItem 
} from '../services/supabase';
import { AchievementsBatch1 } from './AchievementsBatch1';
import { AchievementsBatch2 } from './AchievementsBatch2';
import { AchievementsBatch3 } from './AchievementsBatch3';
import { AchievementsBatch4 } from './AchievementsBatch4';
import { AchievementsBatch5 } from './AchievementsBatch5';

interface AchievementsScreenProps {
  onBack: () => void;
  userId?: string;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ onBack, userId }) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'memories'>('achievements');
  
  const effectiveUserId = userId || '12345';
  
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'memories') {
          const data = await getUserMemories(effectiveUserId);
          setMemories(data);
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [effectiveUserId, activeTab]);

  const handleDeleteMemory = async (id: number) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    await deleteUserMemory(id);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editText.trim()) return;
    
    setMemories(prev => prev.map(m => m.id === id ? { ...m, memory_text: editText } : m));
    setEditingId(null);
    
    try {
      await updateUserMemory(id, editText);
    } catch (err) {
      console.error("Failed to update memory:", err);
    }
  };

  const handleAddNew = async () => {
    if (!newMemoryText.trim()) return;
    
    const textToSave = newMemoryText.trim();
    setIsAddingNew(false);
    setNewMemoryText('');
    
    const tempId = Date.now();
    const newItem = { 
      id: tempId, 
      user_id: Number(effectiveUserId), 
      memory_text: textToSave, 
      created_at: new Date().toISOString() 
    };
    
    setMemories(prev => [newItem, ...prev]);
    
    try {
      await addUserMemory(effectiveUserId, textToSave);
      const freshData = await getUserMemories(effectiveUserId);
      setMemories(freshData);
    } catch (err) {
      console.error("Failed to add memory:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      action();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white font-display">
      
      <div className="p-4 bg-[#111827] sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition active:scale-90">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-heading">Личный профиль</h1>
        </div>

        <div className="bg-[#1F2937] p-1 rounded-xl flex shadow-inner">
          <button 
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 ${activeTab === 'achievements' ? 'bg-[#374151] text-white shadow' : 'text-gray-400'}`}
          >
            <Trophy size={16} /> Награды
          </button>
          <button 
            onClick={() => setActiveTab('memories')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all active:scale-95 ${activeTab === 'memories' ? 'bg-[#374151] text-white shadow' : 'text-gray-400'}`}
          >
            <Brain size={16} /> Заметки Лео
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        
        {activeTab === 'achievements' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
            {/* Using the provided visual batches */}
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Начало пути</h3>
                <AchievementsBatch1 />
            </section>
            
            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Режим дня</h3>
                <AchievementsBatch2 />
            </section>

            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Навыки общения</h3>
                <AchievementsBatch3 />
            </section>

            <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Эрудиция</h3>
                <AchievementsBatch4 />
            </section>

             <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Зал славы</h3>
                <AchievementsBatch5 />
            </section>
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3">
              <div className="mt-1"><Fingerprint size={20} className="text-indigo-400" /></div>
              <div>
                <h3 className="text-sm font-bold text-indigo-300 font-heading">Цифровой след</h3>
                <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">
                  Здесь хранятся факты, которые Лео узнал о тебе. Редактируй их или добавляй свои пожелания (например: "Исправляй меня строже").
                </p>
              </div>
            </div>

            {!isAddingNew ? (
              <button 
                onClick={() => setIsAddingNew(true)}
                className="w-full py-4 border border-dashed border-gray-700 rounded-xl text-gray-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition active:scale-[0.98] group"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> Добавить заметку
              </button>
            ) : (
              <div className="bg-[#1F2937] p-4 rounded-xl border border-indigo-500/50 animate-in zoom-in-95 duration-200 shadow-2xl">
                <textarea 
                  autoFocus
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleAddNew)}
                  placeholder="Я работаю дизайнером..."
                  className="w-full bg-black/20 text-white text-sm p-3 rounded-lg focus:outline-none mb-4 placeholder-gray-600 resize-none min-h-[100px] border border-white/5 focus:border-indigo-500/50 transition-all"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Ctrl + Enter для сохранения</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsAddingNew(false)} 
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition"
                    >
                      <X size={18} />
                    </button>
                    <button 
                      onClick={handleAddNew} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-lg shadow-indigo-600/20"
                    >
                      <Check size={16} /> Сохранить
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {memories.length === 0 && !isLoading && (
                 <div className="text-center py-10">
                    <Brain size={48} className="mx-auto text-gray-800 mb-4 animate-pulse" />
                    <p className="text-gray-500 text-sm">Пока Лео ничего не запомнил. <br/> Попробуй рассказать о своих хобби в чате!</p>
                 </div>
              )}
              
              {memories.map((mem) => (
                <motion.div 
                  layout
                  key={mem.id} 
                  className="bg-[#1F2937] p-4 rounded-xl border border-white/5 group relative transition-all hover:border-indigo-500/30 shadow-sm"
                >
                  {editingId === mem.id ? (
                    <div className="animate-in fade-in duration-200">
                      <textarea 
                        className="w-full bg-black/20 text-white text-sm p-3 rounded-lg focus:outline-none border border-indigo-500/50 resize-none min-h-[80px]"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(mem.id))}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-white px-3 py-2 transition">Отмена</button>
                        <button 
                          onClick={() => handleSaveEdit(mem.id)} 
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition active:scale-95"
                        >
                          Готово
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 flex-1">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                        <p className="text-sm text-gray-200 leading-snug">{mem.memory_text}</p>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingId(mem.id); setEditText(mem.memory_text); }}
                          className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
