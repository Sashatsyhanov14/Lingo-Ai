
import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { ArrowRight, Lightbulb, MessageSquare, Languages, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { rateChatMessage, saveMessageTranslation } from '../services/supabase';
import { notifyAdmin } from '../services/botService';
import { translateText } from '../services/geminiService';
import { useTelegramAuth } from '../hooks/useTelegramAuth';

interface ChatBubbleProps {
  message: Message;
}

const TUTOR_AVATAR_DEFAULT = "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4";

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const { user } = useTelegramAuth();
  
  // Translation State
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | undefined>(message.translation);
  const [isTranslating, setIsTranslating] = useState(false);

  // Rating State
  const [rated, setRated] = useState<'like' | 'dislike' | null>(null);

  // Sync translation prop if it arrives late
  useEffect(() => {
    if (message.translation) setTranslation(message.translation);
  }, [message.translation]);

  const handleToggleTranslation = async () => {
    // 1. Collapse if already open
    if (showTranslation) {
        setShowTranslation(false);
        return;
    }

    // 2. Open if we already have the text
    if (translation) {
        setShowTranslation(true);
        return;
    }

    // 3. Fetch if we don't have it
    setIsTranslating(true);
    try {
        const text = await translateText(message.text);
        setTranslation(text);
        setShowTranslation(true);

        // 4. SAVE the translation to DB so Lingo knows the user used translation
        if (user?.id) {
            await saveMessageTranslation(user.id.toString(), message.text, text);
        }

    } catch (e) {
        console.error("Translation error", e);
    } finally {
        setIsTranslating(false);
    }
  };

  const handleRate = async (rating: 'like' | 'dislike') => {
    if (rated || !user?.id) return;
    
    setRated(rating);
    
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(rating === 'like' ? 'light' : 'medium');
    }

    await rateChatMessage(user.id.toString(), message.text, rating);

    if (rating === 'dislike') {
        await notifyAdmin(`👎 **Дизлайк ответа!**\n\nЮзер: ${user.first_name}\nID: ${user.id}\n\nОтвет Лео: "${message.text.substring(0, 100)}..."`);
    }
  };

  return (
    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : ''} fade-in`}>
      {/* Avatar (Assistant only) */}
      {!isUser && (
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 mb-2 border border-gray-700" 
          style={{ backgroundImage: `url("${TUTOR_AVATAR_DEFAULT}")` }}
          aria-label="Leo Avatar"
        ></div>
      )}

      <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-md w-full ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* 1. TEXT BUBBLE */}
        {message.text && (
          <div className="flex flex-col group relative">
            <div 
              className={`
                px-4 py-3 text-base font-normal leading-relaxed shadow-sm relative min-w-[120px]
                ${isUser 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                  : 'bg-[#1F2937] text-gray-100 rounded-2xl rounded-bl-sm border border-gray-700'}
              `}
            >
              <div className="whitespace-pre-wrap">{message.text}</div>
              
              {/* Magic Translation Toggle - Available for ALL bot messages */}
              {!isUser && (
                <div className="mt-2 pt-2 border-t border-white/5">
                   {showTranslation && translation && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-300 mb-2">
                         <p className="text-sm text-gray-400 italic leading-relaxed">{translation}</p>
                      </div>
                   )}
                   
                   <button 
                      onClick={handleToggleTranslation}
                      disabled={isTranslating}
                      className={`text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors ${showTranslation ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-500 hover:text-indigo-400'}`}
                   >
                      {isTranslating ? (
                          <Loader2 size={12} className="animate-spin" />
                      ) : (
                          <Languages size={12} />
                      )}
                      {isTranslating ? 'Переводим...' : (showTranslation ? 'Скрыть перевод' : 'Перевести')}
                   </button>
                </div>
              )}
            </div>
            
            {/* Metadata Row: Time & Rating */}
            <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-between ml-1'}`}>
               {!isUser && (
                 <div className="flex items-center gap-3">
                   <p className="text-[10px] text-gray-500">{message.timestamp}</p>
                   {/* Rating Buttons */}
                   <div className={`flex items-center gap-2 transition-opacity duration-300 ${rated ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button 
                        onClick={() => handleRate('like')}
                        disabled={!!rated}
                        className={`p-1 rounded hover:bg-white/10 transition ${rated === 'like' ? 'text-green-400' : 'text-gray-600 hover:text-green-400'}`}
                      >
                        <ThumbsUp size={12} fill={rated === 'like' ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => handleRate('dislike')}
                        disabled={!!rated}
                        className={`p-1 rounded hover:bg-white/10 transition ${rated === 'dislike' ? 'text-red-400' : 'text-gray-600 hover:text-red-400'}`}
                      >
                        <ThumbsDown size={12} fill={rated === 'dislike' ? "currentColor" : "none"} />
                      </button>
                   </div>
                 </div>
               )}
               {isUser && (
                 <p className="text-[10px] text-gray-500 mr-1">{message.timestamp}</p>
               )}
            </div>
          </div>
        )}

        {/* 2. CORRECTION CARD (If present) */}
        {!isUser && message.correction && (
          <div className="mt-1 w-full max-w-full">
            <div className="bg-[#1F2937] rounded-2xl border border-indigo-500/30 overflow-hidden shadow-lg animate-in slide-in-from-top-2 duration-500">
              
              {/* Header: Visual Diff */}
              <div className="bg-[#111827]/50 p-3 flex flex-wrap items-center gap-2 border-b border-white/5">
                <span className="text-red-400 line-through decoration-red-500/50 decoration-2 text-sm opacity-80">
                  {message.correction.original}
                </span>
                <ArrowRight size={14} className="text-gray-500" />
                <span className="text-[#10B981] font-bold text-base bg-emerald-500/10 px-2 py-0.5 rounded">
                  {message.correction.corrected}
                </span>
              </div>

              {/* Body: Explanation & Context */}
              <div className="p-3 space-y-3">
                
                {/* Explanation */}
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 bg-yellow-500/10 p-1 rounded-md shrink-0">
                     <Lightbulb size={14} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Почему так?</p>
                    <p className="text-sm text-gray-300 leading-snug">
                      {message.correction.explanation}
                    </p>
                  </div>
                </div>

                {/* Example / Context */}
                {message.correction.context && message.correction.context.length > 0 && (
                  <div className="flex gap-3 items-start">
                    <div className="mt-0.5 bg-indigo-500/10 p-1 rounded-md shrink-0">
                       <MessageSquare size={14} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Пример</p>
                      <p className="text-sm text-gray-300 italic">
                        "{message.correction.context[0]}"
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
