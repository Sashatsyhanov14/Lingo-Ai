
import { getEnv } from './utils';

// Retrieve keys from environment variables
// Matches VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_ADMIN_ID
const BOT_TOKEN = getEnv('TELEGRAM_BOT_TOKEN');
const ADMIN_CHAT_ID = getEnv('TELEGRAM_ADMIN_ID');

/**
 * Service to interact with the Telegram Bot API.
 */
export const sendBotMessage = async (chatId: number, text: string) => {
  // Method 1: Preferred for WebApps - Send data to bot via Telegram UI
  if (window.Telegram?.WebApp) {
    try {
      const data = JSON.stringify({
        type: 'session_report',
        text: text
      });
      window.Telegram.WebApp.sendData(data);
      return { success: true, method: 'web_app_data' };
    } catch (e) {
      console.warn("WebApp sendData failed, falling back to HTTP", e);
    }
  }

  // Method 2: Fallback HTTP Request
  if (!BOT_TOKEN) {
    console.warn("Bot Token not set in .env. Cannot send message via HTTP.");
    return null;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending bot message:', error);
    return null;
  }
};

export const formatSessionSummary = (userName: string, level: number, xpGained: number, correctionsCount: number) => {
  return `*🦁 LINGO: ОТЧЕТ О ПРАКТИКЕ*\n\n` +
         `Потрясающе, *${userName}*! Ты стал на шаг ближе к свободному английскому.\n\n` +
         `📊 *Статистика сессии:*\n` +
         `━━━━━━━━━━━━━━━\n` +
         `🔝 *Уровень:* ${level}\n` +
         `✨ *Опыт:* +${xpGained} XP\n` +
         `🎯 *Исправлено ошибок:* ${correctionsCount}\n\n` +
         `💭 *Leo говорит:* "Твой прогресс вдохновляет! Увидимся на следующей тренировке в Lingo."\n\n` +
         `🔥 _Не сбавляй темп!_`;
};

// --- Admin Notifications (Feedback Loop) ---

export const notifyAdmin = async (text: string) => {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("Cannot notify admin: Keys not set in .env");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: `🔔 **LINGO FEEDBACK**\n\n${text}`,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error("Failed to notify admin", e);
  }
};
