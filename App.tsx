
import React, { useState, useEffect, useMemo } from 'react';
import { useTelegramAuth } from './hooks/useTelegramAuth';
import { ProgramScreen } from './components/ProgramScreen';
import { ChatInterface } from './components/ChatInterface';
import { TopLevelBar } from './components/TopLevelBar';
import { SettingsScreen } from './components/SettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SessionReport } from './components/SessionReport';
import { ProfileScreen, ProfileTabType } from './components/ProfileScreen';
import { MessageCircle, Map, User } from 'lucide-react';
import { signOut, getLevels, LevelSchema, addUserXP, resetUserAccount, addLearningHistoryItem } from './services/supabase';
import { sendBotMessage, formatSessionSummary } from './services/botService';

export default function App() {
  const { user, dbProfile, isLoading, triggerHaptic, signIn } = useTelegramAuth();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'program' | 'profile' | 'settings'>('chat');
  const [previousTab, setPreviousTab] = useState<'chat' | 'program' | 'profile'>('chat');
  
  // Controls which sub-tab opens when Profile is selected (e.g. clicking Star opens Farm)
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTabType>('notes');

  const [xp, setXp] = useState(0); 
  const [xpSession, setXpSession] = useState(0);
  const [correctionsSession, setCorrectionsSession] = useState(0);
  const [levelsConfig, setLevelsConfig] = useState<LevelSchema[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [showReport, setShowReport] = useState(false);
  
  // Stores the ACTIVE lesson context
  const [lessonContext, setLessonContext] = useState<string | null>(null);
  const [currentTopicTitle, setCurrentTopicTitle] = useState<string | null>(null);

  // Helper to safely show alerts (fallback for TG version < 6.2)
  const safeShowAlert = (message: string) => {
    const tg = window.Telegram?.WebApp;
    // 'showAlert' uses 'showPopup' internally, which was introduced in Bot API 6.2
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
      tg.showAlert(message);
    } else {
      // Fallback for older versions (like 6.0) or web browser
      alert(message);
    }
  };

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

  // Force hide MainButton whenever tabs change or component mounts
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.MainButton.hide();
      tg.MainButton.text = ""; // Clear text just in case
    }
  }, [activeTab]);

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
      tg.MainButton.hide(); // CRITICAL: Ensure button is hidden after sharing
      safeShowAlert('Leo получил твой отчет! Проверь чат с ботом. 🦁📩');
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
       safeShowAlert('Ваш прогресс был полностью сброшен.');
       switchTab('chat');
    } else {
       safeShowAlert('Ошибка при сбросе данных. Попробуйте позже.');
    }
  };

  const switchTab = (tab: any, profileTab: ProfileTabType = 'notes') => {
    if (activeTab === tab && tab !== 'profile') return;
    
    triggerHaptic('selection');
    
    if (tab === 'profile') {
        setProfileInitialTab(profileTab);
    }
    
    if (tab === 'chat' || tab === 'program' || tab === 'profile') {
        setPreviousTab(tab as any);
    }
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#111827] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
            <p className="text-sm text-gray-500 font-medium animate-pulse">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <WelcomeScreen 
        onStart={() => {
           // Create a nice looking Demo User
           signIn({
             id: 123456789,
             first_name: 'Student',
             username: 'guest_user',
             language_code: 'en',
             photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=c0aede'
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
         onOpenProfile={() => switchTab('profile', 'notes')}
         onOpenStarFarm={() => switchTab('profile', 'farm')}
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
          <ProfileScreen 
            userId={user?.id.toString()} 
            initialTab={profileInitialTab}
            onBack={() => switchTab('chat')} 
          />
        )}
      </main>

      <nav className="flex-shrink-0 bg-[#111827] border-t border-white/5 px-6 pt-2 pb-6 safe-area-bottom flex justify-between items-center z-50">
        <NavBtn icon={<Map size={24} />} label="Path" isActive={activeTab === 'program'} onClick={() => switchTab('program')} />
        <div className="relative -top-5">
          <button onClick={() => switchTab('chat')} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-[#1F2937] text-gray-400 border border-gray-700'}`}>
            <MessageCircle size={26} fill={activeTab === 'chat' ? "white" : "none"} />
          </button>
        </div>
        <NavBtn icon={<User size={24} />} label="Profile" isActive={activeTab === 'profile'} onClick={() => switchTab('profile', 'notes')} />
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
