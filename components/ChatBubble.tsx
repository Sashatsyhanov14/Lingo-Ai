import React, { useState } from 'react';
import { Message } from '../types';
import { ArrowRight, Lightbulb, MessageSquare, Languages } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
}

const TUTOR_AVATAR_DEFAULT = "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4";

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showTranslation, setShowTranslation] = useState(false);

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
          <div className="flex flex-col group">
            <div 
              className={`
                px-4 py-3 text-base font-normal leading-relaxed shadow-sm relative min-w-[120px]
                ${isUser 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm' 
                  : 'bg-[#1F2937] text-gray-100 rounded-2xl rounded-bl-sm border border-gray-700'}
              `}
            >
              <div className="whitespace-pre-wrap">{message.text}</div>
              
              {/* Magic Translation Toggle */}
              {!isUser && message.translation && (
                <div className="mt-2 pt-2 border-t border-white/5">
                   {showTranslation ? (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                         <p className="text-sm text-gray-400 italic leading-relaxed">{message.translation}</p>
                         <button 
                            onClick={() => setShowTranslation(false)}
                            className="mt-2 text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1 hover:text-indigo-300 transition"
                         >
                            <Languages size={12} /> Скрыть перевод
                         </button>
                      </div>
                   ) : (
                      <button 
                        onClick={() => setShowTranslation(true)}
                        className="text-[10px] font-bold text-gray-500 hover:text-indigo-400 uppercase flex items-center gap-1 transition-colors"
                      >
                         <Languages size={12} /> Перевести
                      </button>
                   )}
                </div>
              )}
            </div>
            
            {!isUser && (
              <p className="text-[10px] text-gray-500 mt-1 ml-1">
                {message.timestamp}
              </p>
            )}
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