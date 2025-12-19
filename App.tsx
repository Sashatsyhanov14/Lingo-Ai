
import React, { useState, useEffect, useMemo } from 'react';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { ProgramScreen } from './components/ProgramScreen';
import { AchievementsScreen } from './components/AchievementsScreen';
import { ChatInterface } from './components/ChatInterface';
import { TopLevelBar } from './components/TopLevelBar';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SessionReport } from './components/SessionReport';
import { MessageCircle, Map, User } from 'lucide-react';
import { signOut, getLevels, LevelSchema, addUserXP, resetUserAccount, addLearningHistoryItem } from './services/supabase';
import { sendBotMessage, formatSessionSummary } from './services/botService';

export default function App() {
  const { user, dbProfile, isLoading, triggerHaptic, signIn } = useTelegramAuth();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'program' | 'profile' | 'settings'>('chat');
  const [previousTab, setPreviousTab] = useState<'chat' | 'program' | 'profile'>('chat');
  const [xp, setXp] = useState(0); 
  const [xpSession, setXpSession] = useState(0);
  const [correctionsSession, setCorrectionsSession] = useState(0);
  const [levelsConfig, setLevelsConfig] = useState<LevelSchema[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [showReport, setShowReport] = useState(false);
  
  // Stores the ACTIVE lesson context
  const [lessonContext, setLessonContext] = useState<string | null>(null);
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string | null>(null);

  useEffect(() => {
    if (dbProfile) {
        setXp(dbProfile.xp);
        setAvatarUrl(dbProfile.avatar_url || user?.photo_url);
    }
  }, [dbProfile, user]);

  useEffect(() => {
    const initLevels = async () => {
        const data = await getLevels();
        setLevelsConfig(data);
    };
    initLevels();
  }, []);

  const { level, xpToNext } = useMemo(() => {
    if (levelsConfig.length === 0) return { level: 1, xpToNext: 500 };
    let currentLvlObj = levelsConfig[0];
    let nextLvlObj = levelsConfig[1];
    for (const l of levelsConfig) {
        if (xp >= l.xp_required) {
            currentLvlObj = l;
            const nextIdx = levelsConfig.indexOf(l) + 1;
            nextLvlObj = levelsConfig[nextIdx] || { level: l.level + 1, xp_required: l.xp_required * 1.5 };
        } else break;
    }
    return { level: currentLvlObj.level, xpToNext: nextLvlObj.xp_required };
  }, [xp, levelsConfig]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const showBack = activeTab !== 'chat' && activeTab !== 'program';
    if (showBack) {
      tg.BackButton.show();
      const handleBack = () => {
        triggerHaptic('selection');
        setActiveTab(previousTab);
      };
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
        tg.BackButton.hide();
      };
    } else {
      tg.BackButton.hide();
    }
  }, [activeTab, previousTab]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !user || showReport) return;

    if (activeTab === 'chat' && xpSession > 0) {
      tg.MainButton.setText('ЗАВЕРШИТЬ ПРАКТИКУ 🦁');
      tg.MainButton.show();
      tg.MainButton.setParams({
        color: '#6366F1',
        text_color: '#ffffff'
      });

      const handleMainAction = () => {
        triggerHaptic('notification', 'success');
        finishSession();
      };

      tg.MainButton.onClick(handleMainAction);
      return () => {
        tg.MainButton.offClick(handleMainAction);
        tg.MainButton.hide();
      };
    } else {
      tg.MainButton.hide();
    }
  }, [activeTab, xpSession, user, showReport]);

  const finishSession = async () => {
    setShowReport(true);
    if (window.Telegram?.WebApp) window.Telegram.WebApp.MainButton.hide();
    
    // Save to Learning History if we were in a specific topic
    if (user?.id && currentTopicTitle) {
        await addLearningHistoryItem(user.id.toString(), {
            topic_title: currentTopicTitle,
            topic_summary: "Урок завершен.", // In a real app, generate summary with AI
            score: xpSession,
            ai_feedback: "Great job keeping the conversation going."
        });
        // Clear current topic so we generate a new one next time
        setLessonContext(null);
        setCurrentTopicTitle(null);
    }
  };

  const handleAddXP = async (amount: number) => {
    setXp(prev => prev + amount);
    setXpSession(prev => prev + amount);
    triggerHaptic('notification', 'success');
    if (user?.id) await addUserXP(user.id.toString(), amount);
  };

  const handleCorrection = () => {
    setCorrectionsSession(prev => prev + 1);
  };

  const handleShareReport = async () => {
    const tg = window.Telegram?.WebApp;
    if (!user) return;

    if (tg) tg.MainButton.showProgress();
    
    const summary = formatSessionSummary(
      user.first_name, 
      level, 
      xpSession, 
      correctionsSession
    );
    
    await sendBotMessage(user.id, summary);
    
    if (tg) {
      tg.MainButton.hideProgress();
      tg.showAlert('Leo получил твой отчет! Проверь чат с ботом. 🦁📩');
    }
    
    setXpSession(0);
    setCorrectionsSession(0);
    setShowReport(false);
  };

  // Called when user clicks the active node in ProgramScreen
  const handleStartLesson = (systemPrompt: string, title: string) => {
    setLessonContext(systemPrompt);
    setCurrentTopicTitle(title);
    switchTab('chat');
  };

  const handleResetProgress = async () => {
    if (!user?.id) return;
    
    triggerHaptic('impact', 'heavy');
    const success = await resetUserAccount(user.id.toString());
    
    if (success) {
       setXp(0);
       setXpSession(0);
       setCorrectionsSession(0);
       setLessonContext(null);
       setCurrentTopicTitle(null);
       if (window.Telegram?.WebApp) {
           window.Telegram.WebApp.showAlert('Ваш прогресс был полностью сброшен.');
       }
       switchTab('chat');
    } else {
       if (window.Telegram?.WebApp) {
           window.Telegram.WebApp.showAlert('Ошибка при сбросе данных. Попробуйте позже.');
       }
    }
  };

  const switchTab = (tab: any) => {
    if (activeTab === tab) return;
    triggerHaptic('selection');
    setPreviousTab(activeTab as any);
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#111827] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            <p className="text-sm text-gray-500 font-medium">Leo is waking up...</p>
        </div>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <WelcomeScreen 
        onStart={() => {
           signIn({
             id: 123456789,
             first_name: 'Guest',
             username: 'guest_user',
             language_code: 'en',
             photo_url: undefined
           });
        }} 
      />
    );
  }

  if (activeTab === 'settings') {
     return (
        <SettingsScreen 
            onBack={() => switchTab(previousTab)} 
            onLogout={async () => {
               await signOut();
               if (window.Telegram?.WebApp) window.Telegram.WebApp.close();
            }}
            onResetProgress={handleResetProgress}
            currentAvatar={avatarUrl}
            userId={user?.id.toString()}
            onAvatarChange={setAvatarUrl}
        />
     );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#111827] text-white flex flex-col overflow-hidden">
      {showReport && user && (
        <SessionReport 
          userName={user.first_name}
          level={level}
          xpGained={xpSession}
          corrections={correctionsSession}
          onClose={() => { setShowReport(false); setXpSession(0); setCorrectionsSession(0); }}
          onShare={handleShareReport}
        />
      )}

      <TopLevelBar 
         currentXP={xp} 
         level={level} 
         xpToNextLevel={xpToNext}
         userPhoto={avatarUrl} 
         onOpenSettings={() => switchTab('settings')}
         onOpenProfile={() => switchTab('profile')}
      />

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'chat' && (
          <ChatInterface 
            userId={user?.id.toString()} 
            onAddXP={handleAddXP} 
            onCorrection={handleCorrection}
            initialTopic={lessonContext} // Pass the specific system prompt
          />
        )}
        {activeTab === 'program' && (
          <ProgramScreen onStartLesson={handleStartLesson} />
        )}
        {activeTab === 'profile' && (
          <AchievementsScreen onBack={() => switchTab('chat')} userId={user?.id.toString()} />
        )}
      </main>

      <nav className="flex-shrink-0 bg-[#111827] border-t border-white/5 px-6 pt-2 pb-6 safe-area-bottom flex justify-between items-center z-50">
        <NavBtn icon={<Map size={24} />} label="Path" isActive={activeTab === 'program'} onClick={() => switchTab('program')} />
        <div className="relative -top-5">
          <button onClick={() => switchTab('chat')} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-[#1F2937] text-gray-400 border border-gray-700'}`}>
            <MessageCircle size={26} fill={activeTab === 'chat' ? "white" : "none"} />
          </button>
        </div>
        <NavBtn icon={<User size={24} />} label="Profile" isActive={activeTab === 'profile'} onClick={() => switchTab('profile')} />
      </nav>
    </div>
  );
}

const NavBtn = ({ icon, label, isActive, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 w-16 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
    {React.cloneElement(icon, { strokeWidth: isActive ? 2.5 : 2 })}
    <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
  </button>
);
