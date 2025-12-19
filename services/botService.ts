import { getEnv } from './utils';

// Now securely retrieved from environment variables
const BOT_TOKEN = getEnv('BOT_TOKEN');

/**
 * Service to interact with the Telegram Bot API.
 */
export const sendBotMessage = async (chatId: number, text: string) => {
  // Method 1: Preferred for WebApps - Send data to bot via Telegram UI
  // The bot backend should handle the 'web_app_data' event and reply to the user.
  if (window.Telegram?.WebApp) {
    try {
      // We send a JSON string that the bot can parse
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

  // Method 2: Fallback HTTP Request (Only works if VITE_BOT_TOKEN is set in .env)
  // WARNING: Exposing tokens in frontend code is risky. Use only for dev/prototyping.
  if (!BOT_TOKEN) {
    console.warn("Bot Token not set. Cannot send message via HTTP.");
    return null;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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