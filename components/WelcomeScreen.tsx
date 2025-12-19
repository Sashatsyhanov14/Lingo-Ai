
import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-1 flex-col h-full w-full p-6 items-center justify-center text-center">
      <div className="flex flex-1 flex-col justify-center items-center w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <span className="material-symbols-outlined text-5xl text-primary">translate</span>
        </div>
        
        {/* HeadlineText */}
        <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl font-black leading-tight font-heading mb-4">
          Добро пожаловать в Lingo
        </h1>
        
        {/* BodyText */}
        <p className="text-slate-600 dark:text-slate-300 text-base font-normal leading-normal max-w-sm">
            Ваш личный ИИ-репетитор Лео. Персональные уроки, практика 24/7 и мгновенная обратная связь.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 pb-8 pt-4 w-full max-w-[480px]">
        <button 
          onClick={onStart} 
          className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-[#24A1DE] hover:bg-[#24A1DE]/90 active:scale-95 transition-all text-white text-lg font-bold leading-normal tracking-wide shadow-lg shadow-[#24A1DE]/30 gap-3"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 -ml-1">
             <path d="M21.6 3.6L2.4 11.4C1.2 11.8 1.2 12.6 2.4 13L6.8 14.4L18.4 7.2C19 6.8 19.6 7 19.2 7.4L9.6 16.2H9.4L10 21.6C10.4 21.6 10.6 21.4 10.8 21.2L13.6 18.6L18.4 22.2C19.4 22.8 20 22.4 20.2 21.4L22.8 4.6C23 3.6 22.4 3.2 21.6 3.6Z" fill="white"/>
          </svg>
          <span className="truncate">Войти через Telegram</span>
        </button>
      </div>
    </div>
  );
};
