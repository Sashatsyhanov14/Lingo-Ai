
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './utils';

const SUPABASE_URL = getEnv('SUPABASE_URL') || "https://wobqnxojxuhrckaxxiip.supabase.co";
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvYnFueG9qeHVocmNrYXh4aWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzIxNjgsImV4cCI6MjA4MDk0ODE2OH0.YGPMu-e3b8cTEgfs-HnAKhzkr7YuO5tDZCBpnhON-rc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// --- Auth & User Sync ---
export const getOrCreateUser = async (tgUser: any): Promise<UserProfile | null> => {
    if (!tgUser || !tgUser.id) {
        console.error("Invalid tgUser provided to getOrCreateUser");
        return null;
    }

    try {
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', tgUser.id)
            .maybeSingle();

        if (existingUser) {
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', tgUser.id);
            return existingUser;
        }

        const newUser = {
            id: tgUser.id,
            first_name: tgUser.first_name || 'Student',
            username: tgUser.username || '',
            language_code: tgUser.language_code || 'en',
            xp: 0,
            current_level: 1,
            avatar_url: tgUser.photo_url || undefined,
            last_login: new Date().toISOString()
        };

        const { data, error: insertError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (insertError && insertError.code !== '23505') throw insertError;
        
        // Retry fetch if insert race condition or success
        const { data: retryUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', tgUser.id)
            .maybeSingle();
        return retryUser;

    } catch (err: any) {
        console.error("User Sync Error:", err);
        return null;
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

        return true;
    } catch (e) {
        console.error("Reset Account Exception:", e);
        return false;
    }
};

// --- Levels ---
export const getLevels = async (): Promise<LevelSchema[]> => {
    const { data } = await supabase
      .from('levels')
      .select('*')
      .order('level', { ascending: true });
    return data || [];
};

// --- Profile & XP ---
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
};

export const updateUserAvatar = async (userId: string, avatarUrl: string): Promise<boolean> => {
    const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
    return !error;
};

export const addUserXP = async (userId: string, amount: number): Promise<boolean> => {
    try {
        const { error } = await supabase.rpc('add_xp', { 
            user_tg_id: Number(userId), 
            amount: amount 
        });
        return !error;
    } catch (e) {
        return false;
    }
};

// --- Memory System ---
export const getUserMemories = async (userId: string): Promise<MemoryItem[]> => {
    const { data } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return data || [];
};

export const addUserMemory = async (userId: string, text: string): Promise<void> => {
    await supabase.from('user_memories').insert({ user_id: userId, memory_text: text });
};

export const deleteUserMemory = async (id: number): Promise<void> => {
    await supabase.from('user_memories').delete().eq('id', id);
};

export const updateUserMemory = async (id: number, text: string): Promise<void> => {
    await supabase.from('user_memories').update({ memory_text: text }).eq('id', id);
};

// --- Learning History (The Path) ---
export const getLearningHistory = async (userId: string): Promise<HistoryItem[]> => {
    const { data } = await supabase
        .from('learning_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    return data || [];
};

export const addLearningHistoryItem = async (userId: string, item: Omit<HistoryItem, 'id' | 'created_at'>): Promise<void> => {
    await supabase.from('learning_history').insert({
        user_id: userId,
        ...item
    });
};

// --- Achievements ---
export const getAchievements = async (): Promise<AchievementSchema[]> => {
    const { data } = await supabase.from('achievements').select('*');
    return data || [];
};

export const getUserAchievements = async (userId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);
    return data ? data.map((row: any) => row.achievement_id) : [];
};

// --- Chat History ---
export const getChatHistory = async (userId: string): Promise<any[]> => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50);
    
    return (data || []).map((msg: any) => ({
      id: msg.id.toString(),
      role: msg.role === 'assistant' ? 'model' : 'user',
      text: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      correction: msg.correction_data || undefined
    }));
};

export const saveChatMessage = async (userId: string, message: any): Promise<void> => {
    await supabase.from('chat_messages').insert({
        user_id: userId,
        role: message.role === 'model' ? 'assistant' : 'user',
        content: message.text,
        correction_data: message.correction || null
    });
};
