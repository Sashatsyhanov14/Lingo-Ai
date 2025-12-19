
import { useEffect, useState } from 'react';
import { getOrCreateUser, UserProfile } from '../services/supabase';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [dbProfile, setDbProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Allow manual sign-in for Guest Mode / Web Testing
  const signIn = async (userData: TelegramUser) => {
    setUser(userData);
    try {
        const profile = await getOrCreateUser(userData);
        setDbProfile(profile);
    } catch (err) {
        console.error("Manual sign-in sync error:", err);
    }
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    const init = async () => {
        if (tg) {
            tg.ready();
            tg.expand();
            
            // Set header color to match the app theme
            tg.setHeaderColor('#111827');
            tg.setBackgroundColor('#111827');

            const tgUser = tg.initDataUnsafe?.user;

            if (tgUser) {
              await signIn(tgUser);
            }
        }
        setIsLoading(false);
    };

    init();
  }, []);

  const triggerHaptic = (type: 'impact' | 'notification' | 'selection' = 'selection', style: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' = 'light') => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;

    if (type === 'impact') tg.HapticFeedback.impactOccurred(style as any);
    if (type === 'notification') tg.HapticFeedback.notificationOccurred(style as any);
    if (type === 'selection') tg.HapticFeedback.selectionChanged();
  };

  return { user, dbProfile, isLoading, triggerHaptic, signIn };
}
