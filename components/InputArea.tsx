import React, { useState, useRef } from 'react';
import { Send, PlusCircle } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !isLoading) {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="sticky bottom-0 bg-[#111827] pt-2 shrink-0 border-t border-gray-800/50">
      <div className="flex items-center px-4 py-3 gap-3">
        <button 
          type="button"
          onClick={() => {
             if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.selectionChanged();
             alert('Photo & File support coming soon! 🚀');
          }}
          className="flex items-center justify-center shrink-0 text-[#9CA3AF] hover:text-[#F3F4F6] active:scale-90 transition-all"
        >
          <PlusCircle size={24} />
        </button>
        
        <div className="flex w-full flex-1 items-center rounded-full border transition-all px-4 h-12 bg-[#1F2937] border-gray-700/50 focus-within:border-indigo-500/50">
          <input 
            ref={inputRef}
            className="flex w-full min-w-0 flex-1 bg-transparent text-[#F3F4F6] focus:outline-none placeholder:text-[#9CA3AF] text-base" 
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        </div>
        
        <button 
          onClick={() => handleSubmit()}
          disabled={!text.trim() || isLoading}
          className={`flex items-center justify-center shrink-0 transition-all active:scale-90 ${text.trim() ? 'text-[#6366F1] hover:text-indigo-400' : 'text-[#4B5563] cursor-default'}`}
        >
          <Send size={24} />
        </button>
      </div>
    </div>
  );
};