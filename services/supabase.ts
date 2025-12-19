
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

// Remove hardcoded fallbacks to ensure security and usage of .env
const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase keys missing in environment variables.");
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co', 
  SUPABASE_ANON_KEY || 'placeholder'
);

export interface LevelSchema {
  level: number;
  xp_required: number;
}

export interface AchievementSchema {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
  is_secret: boolean;
}

export interface UserProfile {
  id: number;
  first_name: string;
  username: string;
  language_code: string;
  xp: number;
  current_level: number;
  avatar_url?: string;
  stars_balance?: number;
}

export interface MemoryItem {
  id: number;
  user_id: number;
  memory_text: string;
  created_at: string;
}

export interface HistoryItem {
  id: number;
  topic_title: string;
  topic_summary?: string;
  ai_feedback?: string;
  score: number;
  created_at: string;
}

// Fallback Data for Offline Mode
const FALLBACK_LEVELS: LevelSchema[] = [
    { level: 1, xp_required: 0 },
    { level: 2, xp_required: 100 },
    { level: 3, xp_required: 300 },
    { level: 4, xp_required: 600 },
    { level: 5, xp_required: 1000 },
    { level: 6, xp_required: 1500 },
    { level: 7, xp_required: 2100 },
    { level: 8, xp_required: 2800 },
    { level: 9, xp_required: 3600 },
    { level: 10, xp_required: 4500 },
];

// --- Auth & User Sync ---
export const getOrCreateUser = async (tgUser: any): Promise<UserProfile | null> => {
    if (!tgUser || !tgUser.id) {
        console.error("Invalid tgUser provided to getOrCreateUser");
        return null;
    }

    // Default Profile to return in case of Network Error (Offline Mode)
    const fallbackProfile: UserProfile = {
        id: tgUser.id,
        first_name: tgUser.first_name || 'Student',
        username: tgUser.username || '',
        language_code: tgUser.language_code || 'en',
        xp: 0,
        current_level: 1,
        avatar_url: tgUser.photo_url || undefined,
        stars_balance: 0
    };

    try {
        // 1. Check for existing user
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', tgUser.id)
            .maybeSingle();

        if (fetchError) {
             throw fetchError;
        }

        if (existingUser) {
            // Update last_login (fire and forget)
            supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', tgUser.id)
                .then(({ error }) => {
                    if (error) console.warn("Background update last_login failed:", error.message);
                });
            return existingUser;
        }

        // 2. Create new user
        const newUser = {
            ...fallbackProfile,
            last_login: new Date().toISOString()
        };

        const { data, error: insertError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (insertError) {
            // Handle race condition where user was created between select and insert
            if (insertError.code === '23505') { // Unique violation
                 const { data: retryUser, error: retryError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', tgUser.id)
                    .maybeSingle();
                 
                 if (retryError) throw retryError;
                 return retryUser;
            }
            throw insertError;
        }
        
        return data;

    } catch (err: any) {
        // Detect Network/Offline errors specifically
        const isNetworkError = 
            err.name === 'TypeError' || 
            err.message?.includes('fetch') || 
            err.message?.includes('Load failed') ||
            err.message?.includes('Failed to fetch') ||
            (err.details && err.details.includes('fetch'));

        if (isNetworkError) {
            console.warn("⚠️ Supabase unreachable (Offline Mode). Using fallback profile.");
            return fallbackProfile;
        }

        console.error("User Sync Error:", err);
        // Even for other errors, allow entry with fallback
        return fallbackProfile;
    }
};

export const signOut = async () => {
    await supabase.auth.signOut();
};

export const resetUserAccount = async (userId: string): Promise<boolean> => {
    try {
        await supabase.from('users').update({ 
            xp: 0, 
            current_level: 1,
            stars_balance: 0
        }).eq('id', userId);

        await supabase.from('user_memories').delete().eq('user_id', userId);
        await supabase.from('chat_messages').delete().eq('user_id', userId);
        await supabase.from('user_achievements').delete().eq('user_id', userId);
        await supabase.from('learning_history').delete().eq('user_id', userId); // Reset history too
        await supabase.from('app_feedback').delete().eq('user_id', userId); // Reset feedback

        return true;
    } catch (e) {
        console.error("Reset Account Exception:", e);
        return false;
    }
};

// --- Levels ---
export const getLevels = async (): Promise<LevelSchema[]> => {
    try {
        const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });
        
        if (error) throw error;
        return data && data.length > 0 ? data : FALLBACK_LEVELS;
    } catch (e) {
        console.warn("Using fallback levels (Offline/Error)");
        return FALLBACK_LEVELS;
    }
};

// --- Profile & XP ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
        const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        return data;
    } catch (e) {
        return null;
    }
};

export const updateUserAvatar = async (userId: string, avatarUrl: string): Promise<boolean> => {
    try {
        const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
        return !error;
    } catch (e) {
        return false;
    }
};

export const addUserXP = async (userId: string, amount: number): Promise<boolean> => {
    try {
        const { error } = await supabase.rpc('add_xp', { 
            user_tg_id: Number(userId), 
            amount: amount 
        });
        if (error) console.error("Error adding XP:", JSON.stringify(error, null, 2));
        return !error;
    } catch (e) {
        // Silently fail in offline mode
        return false;
    }
};

// --- Memory System ---
export const getUserMemories = async (userId: string): Promise<MemoryItem[]> => {
    try {
        const { data, error } = await supabase
            .from('user_memories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

export const addUserMemory = async (userId: string, text: string): Promise<void> => {
    try {
        await supabase.from('user_memories').insert({ user_id: userId, memory_text: text });
    } catch (e) { /* ignore */ }
};

export const deleteUserMemory = async (id: number): Promise<void> => {
    try {
        await supabase.from('user_memories').delete().eq('id', id);
    } catch (e) { /* ignore */ }
};

export const updateUserMemory = async (id: number, text: string): Promise<void> => {
    try {
        await supabase.from('user_memories').update({ memory_text: text }).eq('id', id);
    } catch (e) { /* ignore */ }
};

// --- Learning History (The Path) ---
export const getLearningHistory = async (userId: string): Promise<HistoryItem[]> => {
    try {
        const { data, error } = await supabase
            .from('learning_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

export const addLearningHistoryItem = async (userId: string, item: Omit<HistoryItem, 'id' | 'created_at'>): Promise<void> => {
    try {
        await supabase.from('learning_history').insert({
            user_id: userId,
            ...item
        });
    } catch (e) { /* ignore */ }
};

// --- Achievements ---
export const getAchievements = async (): Promise<AchievementSchema[]> => {
    try {
        const { data, error } = await supabase.from('achievements').select('*');
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
};

export const getUserAchievements = async (userId: string): Promise<string[]> => {
    try {
        const { data, error } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);
        
        if (error) throw error;
        return data ? data.map((row: any) => row.achievement_id) : [];
    } catch (e) {
        return [];
    }
};

// --- Chat History ---
export const getChatHistory = async (userId: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);
        
        if (error) throw error;
        
        return (data || []).map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role === 'assistant' ? 'model' : 'user',
        text: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        correction: msg.correction_data || undefined,
        rating: msg.rating || undefined,
        translation: msg.translation || undefined
        }));
    } catch (e) {
        return [];
    }
};

export const saveChatMessage = async (userId: string, message: any): Promise<void> => {
    try {
        await supabase.from('chat_messages').insert({
            user_id: userId,
            role: message.role === 'model' ? 'assistant' : 'user',
            content: message.text,
            correction_data: message.correction || null,
            translation: message.translation || null
        });
    } catch (e) {
        // This is expected if offline
    }
};

export const saveMessageTranslation = async (userId: string, messageContent: string, translation: string): Promise<void> => {
    try {
        await supabase
            .from('chat_messages')
            .update({ translation: translation })
            .eq('user_id', userId)
            .eq('content', messageContent)
            .order('created_at', { ascending: false })
            .limit(1);
    } catch (e) { /* ignore */ }
};

// --- Feedback & Ratings ---

export const rateChatMessage = async (userId: string, messageContent: string, rating: 'like' | 'dislike'): Promise<void> => {
    try {
        await supabase
            .from('chat_messages')
            .update({ rating: rating })
            .eq('user_id', userId)
            .eq('content', messageContent) 
            .order('created_at', { ascending: false })
            .limit(1);
    } catch (e) { /* ignore */ }
};

export const submitUserFeedback = async (userId: string, message: string, type: 'chat_auto' | 'manual' = 'manual'): Promise<void> => {
    try {
        await supabase.from('app_feedback').insert({
            user_id: userId,
            message: message,
            type: type
        });
    } catch (e) { /* ignore */ }
};
