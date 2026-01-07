
import { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { createChatSession, sendMessageStream, ChatSession } from '../services/geminiService';
import { getChatHistory, saveChatMessage, getUserMemories, addUserMemory, submitUserFeedback } from '../services/supabase';
import { logEvent, AnalyticsEvents } from '../services/analytics';
import { notifyAdmin } from '../services/botService';

const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: "Привет! Я Leo 🦁. Я помогу тебе заговорить на английском.\n\nДавай определим твой уровень. Ты уже учил английский раньше или начинаем с нуля?",
  timestamp: getCurrentTime(),
  translation: "Hi! I am Leo. I will help you speak English. Let's define your level. Have you studied English before or are we starting from scratch?"
};

export const useChatLogic = (userId?: string, onAddXP?: (amount: number) => void, initialTopic?: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const chatSessionRef = useRef<ChatSession | null>(null);
  const topicHandledRef = useRef<string | null>(null);

  useEffect(() => {
    const initChat = async () => {
      setIsInitializing(true);
      try {
        let loadedMessages: Message[] = [];
        let memories: string[] = [];

        if (userId) {
          const [history, memoryData] = await Promise.all([
            getChatHistory(userId),
            getUserMemories(userId)
          ]);
          loadedMessages = history;
          memories = memoryData.map(m => m.memory_text);
        }

        // If no history from DB, show welcome message
        if (loadedMessages.length === 0) {
          loadedMessages = [WELCOME_MESSAGE];
        }

        setMessages(loadedMessages);
        chatSessionRef.current = createChatSession(userId, memories);
        
        // Populate session history for the AI
        // IMPORTANT: We now INCLUDE the welcome message so the AI knows it asked a question.
        loadedMessages.forEach(msg => {
           chatSessionRef.current?.history.push({
               role: msg.role === 'model' ? 'assistant' : 'user',
               content: msg.text
           });
        });
        
        // Handle Lesson Start (System Prompt Injection)
        if (initialTopic && topicHandledRef.current !== initialTopic) {
             topicHandledRef.current = initialTopic;
             
             // If the topic looks like a system prompt (long, contains "TOPIC:" or "SCENARIO:"), use it directly.
             // Otherwise, wrap it.
             let steeringPrompt = initialTopic;
             if (!initialTopic.includes("TOPIC:") && !initialTopic.includes("SCENARIO:")) {
                steeringPrompt = `(SYSTEM INSTRUCTION: The user started the lesson "${initialTopic}". Stop being a general tutor. Act as if we are in a Roleplay Scenario related to this topic immediately. Ask the first question to start the scene.)`;
             } else {
                steeringPrompt = `(SYSTEM INSTRUCTION: ${initialTopic})`;
             }
             
             triggerLessonStart(steeringPrompt);
        }

      } catch (err) {
        console.error("Init Chat Error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initChat();
  }, [userId, initialTopic]);

  /**
   * Removes the hidden JSON block from the stream for display purposes.
   * This ensures the user doesn't see "```json ..." while the bot is typing.
   */
  const cleanStreamText = (text: string) => {
    const jsonStart = text.indexOf('```json');
    if (jsonStart !== -1) {
      return text.substring(0, jsonStart).trim();
    }
    return text;
  };

  const triggerLessonStart = async (steeringPrompt: string) => {
      if (!chatSessionRef.current) return;
      setIsLoading(true);
      
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
          id: modelMsgId,
          role: 'model',
          text: '...',
          timestamp: getCurrentTime()
      }]);

      try {
          let currentAccumulated = "";
          await sendMessageStream(chatSessionRef.current, steeringPrompt, (chunk) => {
            currentAccumulated += chunk;
            const displaySafeText = cleanStreamText(currentAccumulated);

            setMessages(prev => {
              const newMessages = [...prev];
              const idx = newMessages.findIndex(m => m.id === modelMsgId);
              if (idx !== -1) {
                newMessages[idx] = { ...newMessages[idx], text: displaySafeText };
              }
              return newMessages;
            });
          });
          
          const { cleanText, correction, translation } = parseAIResponse(currentAccumulated);
          
           setMessages(prev => {
            const newMessages = [...prev];
            const idx = newMessages.findIndex(m => m.id === modelMsgId);
            if (idx !== -1) {
              newMessages[idx] = { 
                ...newMessages[idx], 
                text: cleanText, 
                correction: correction,
                translation: translation
              };
            }
            return newMessages;
          });
          
          if (userId) {
             await saveChatMessage(userId, {
                 id: modelMsgId,
                 role: 'model',
                 text: cleanText,
                 timestamp: getCurrentTime(),
                 translation: translation
             });
          }

      } catch (e) {
          console.error("Lesson Trigger Error", e);
      } finally {
          setIsLoading(false);
      }
  };

  const parseAIResponse = (accumulatedText: string) => {
    const jsonMatch = accumulatedText.match(/```json\s*([\s\S]*?)\s*```/);
    let cleanText = accumulatedText;
    let correction = undefined;
    let memory = null;
    let translation = undefined;
    let feedback = null;

    if (jsonMatch) {
      try {
        const cleanJson = jsonMatch[1].trim()
          .replace(/,\s*}/g, '}') 
          .replace(/,\s*]/g, ']')
          .replace(/\/\/.*$/gm, '');

        const data = JSON.parse(cleanJson);
        cleanText = accumulatedText.replace(jsonMatch[0], '').trim();

        if (data.correction) {
          correction = {
            original: data.correction.original,
            corrected: data.correction.fixed || data.correction.corrected,
            explanation: data.correction.explanation,
            context: data.correction.example ? [data.correction.example] : []
          };
        }
        if (data.memory) memory = data.memory;
        if (data.ru_translation) translation = data.ru_translation;
        if (data.feedback_collected) feedback = data.feedback_collected;

      } catch (e) {
        console.warn("AI JSON parse failure", e);
      }
    }

    return { cleanText, correction, memory, translation, feedback };
  };

  const handleCollectedFeedback = async (feedback: string) => {
     if (!userId) return;
     try {
         await submitUserFeedback(userId, feedback, 'chat_auto');
         notifyAdmin(`🗣 **Лео разговорил юзера!**\n\nОтзыв: "${feedback}"`);
     } catch (e) {
         console.error("Failed to submit feedback", e);
     }
  };

  const sendMessage = async (text: string) => {
    if (!chatSessionRef.current || isLoading) return;

    logEvent(AnalyticsEvents.SEND_MESSAGE);
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: getCurrentTime()
    };

    setMessages(prev => [...prev, userMsg]);
    if (userId) await saveChatMessage(userId, userMsg);

    const modelMsgId = (Date.now() + 1).toString();
    const modelMsgPlaceholder: Message = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: getCurrentTime()
    };

    setMessages(prev => [...prev, modelMsgPlaceholder]);

    try {
      let currentAccumulated = "";
      await sendMessageStream(chatSessionRef.current, text, (chunk) => {
        currentAccumulated += chunk;
        const displaySafeText = cleanStreamText(currentAccumulated);

        setMessages(prev => {
          const newMessages = [...prev];
          const idx = newMessages.findIndex(m => m.id === modelMsgId);
          if (idx !== -1) {
            newMessages[idx] = { ...newMessages[idx], text: displaySafeText };
          }
          return newMessages;
        });
      });

      const { cleanText, correction, memory, translation, feedback } = parseAIResponse(currentAccumulated);

      setMessages(prev => {
        const newMessages = [...prev];
        const idx = newMessages.findIndex(m => m.id === modelMsgId);
        if (idx !== -1) {
          newMessages[idx] = { 
            ...newMessages[idx], 
            text: cleanText, 
            correction: correction,
            translation: translation
          };
        }
        return newMessages;
      });

      if (userId) {
        const finalModelMsg: Message = {
          id: modelMsgId,
          role: 'model',
          text: cleanText,
          timestamp: getCurrentTime(),
          correction: correction,
          translation: translation
        };
        await saveChatMessage(userId, finalModelMsg);
        
        if (memory) await addUserMemory(userId, memory);
        if (feedback) handleCollectedFeedback(feedback);
      }

      if (onAddXP) {
        let xp = 5;
        if (text.length > 30) xp += 10;
        if (correction) xp += 20;
        onAddXP(xp);
      }

    } catch (error) {
      console.error("Chat Logic Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having a bit of trouble connecting to my brain! 📡 Could you try again?",
        timestamp: getCurrentTime()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, isInitializing, sendMessage };
};
