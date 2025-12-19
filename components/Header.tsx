
import React, { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onNavigate: (screen: 'settings' | 'achievements') => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-4 pb-3 justify-between border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <div className="relative size-12 shrink-0">
          <div className="liquid-ring"></div>
          <div 
            className="absolute inset-1.5 bg-center bg-no-repeat aspect-square bg-cover rounded-full" 
            style={{ backgroundImage: 'url("https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4")' }}
            aria-label="Avatar of Leo, the AI tutor"
          ></div>
        </div>
        <div>
          <h2 className="text-text-light dark:text-text-dark text-lg font-bold font-heading leading-tight">Leo</h2>
          <p className="text-sm text-green-500 font-medium">Online</p>
        </div>
      </div>
      <div className="relative flex items-center justify-end" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex cursor-pointer items-center justify-center rounded-full h-12 w-12 text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${isMenuOpen ? 'bg-gray-200 dark:bg-gray-800' : 'bg-transparent'}`}
        >
          <span className="material-symbols-outlined text-2xl">more_vert</span>
        </button>
        
        {isMenuOpen && (
          <div className="absolute top-12 right-0 w-56 bg-white dark:bg-[#1F2937] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
             <button 
               onClick={() => { onNavigate('achievements'); setIsMenuOpen(false); }}
               className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
             >
               <span className="material-symbols-outlined text-xl text-[#6366F1]">emoji_events</span>
               Достижения
             </button>
             <button 
               onClick={() => { onNavigate('settings'); setIsMenuOpen(false); }}
               className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
             >
               <span className="material-symbols-outlined text-xl text-[#9CA3AF]">settings</span>
               Настройки
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
