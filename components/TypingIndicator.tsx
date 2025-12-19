
import React from 'react';

const TUTOR_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end gap-3 fade-in">
      <div 
        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 mb-2 border border-gray-700" 
        style={{ backgroundImage: `url("${TUTOR_AVATAR}")` }}
      ></div>
      <div className="flex items-center space-x-1 rounded-2xl rounded-bl-sm px-4 py-3 bg-[#1F2937] border border-gray-700 shadow-soft">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
