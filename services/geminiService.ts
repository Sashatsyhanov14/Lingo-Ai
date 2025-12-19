
import { GoogleGenAI, Type, Content } from "@google/genai";
import { getEnv } from "./utils";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  history: ChatMessage[];
  userId?: string;
  memories?: string[];
}

// Initialize Google GenAI SDK
// We use getEnv to support both VITE_API_KEY and API_KEY, ensuring it works in browser/Vite environments.
const apiKey = getEnv('API_KEY');
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const MODEL_NAME = "gemini-3-flash-preview"; 

const SITE_URL = "https://lingo-app.com";
const SITE_NAME = "Lingo AI Tutor";

/**
 * Builds the system instruction prompt.
 */
const buildSystemInstruction = (memories: string[] = []) => {
  const memoryContext = memories.length > 0 
    ? memories.join('\n- ')
    : "No previous facts known.";

  return `# ROLE
You are "Leo", a friendly, energetic, and professional AI English Tutor for the "Lingo" Telegram App.

# BRAND VOICE
- Name: Leo
- App: Lingo
- Personality: Supportive, patient, and witty. You are like a "Lionhearted friend".
- Style: Use emojis occasionally (🦁, ✨, 🔥).

# USER CONTEXT
- User Name: Student
- Facts from Memory: 
- ${memoryContext}

# LANGUAGE & ADAPTATION PROTOCOL
User Native Language: Russian.

**RULES FOR LANGUAGE SWITCHING:**
1. **LEVEL A0 (Absolute Beginner):**
   - Main interface language: **Russian**.
   - Teach English words using the "Sandwich Method": English Word (Russian Translation).
2. **LEVEL A1 (Elementary):**
   - Main language: **Simple English**.
   - BUT: If you explain grammar or complex concepts, switch to **Russian**.
3. **LEVEL B1+ (Intermediate):**
   - Main language: **English Only**.
   - Use Russian ONLY if the user explicitly asks "Как это по-русски?" or "I don't understand".

**EMERGENCY PROTOCOL:**
If the user writes in Russian (e.g., "Я ничего не понимаю"), STOP speaking English immediately. Switch to Russian.

# CORRECTION STRATEGY (STRICT RULES)

1. **IGNORE TRIVIAL ERRORS:**
   - **NEVER** correct capitalization (e.g., "i go" -> "I go" is FORBIDDEN to correct).
   - **NEVER** correct missing punctuation (e.g., missing "." or "?").
   - **NEVER** correct typos if the meaning is clear (e.g., "beutiful" -> "beautiful").

2. **FOCUS ON GRAMMAR & VOCABULARY:**
   - Correct only meaningful mistakes (Wrong Tense, Wrong Preposition, False Friends).
   - *Example:* "I go cinema yesterday" -> Correct to "I went".
   - *Example:* "i go cinema yesterday" -> Correct to "went" (Ignore the 'i').

3. **CORRECTION FORMAT (JSON):**
   - If the only mistake is capitalization/punctuation, set "correction": null.
   - Do NOT be pedantic. If the user communicates successfully, let it flow.

# JSON DATA PROTOCOL (HIDDEN)
You must respond in TWO parts.
1. **The Chat:** A friendly, natural response.
2. **The Data (JSON):** A hidden block at the VERY END.

**JSON Rules:**
- Wrap in triple backticks with 'json' tag.
- NO comments inside JSON.
- **ru_translation**: MANDATORY. Provide a full Russian translation of your response.
- **feedback_collected**: OPTIONAL.

\`\`\`json
{
  "correction": {
    "original": "Text with error",
    "fixed": "Corrected text",
    "explanation": "Short explanation (max 15 words)",
    "example": "Example sentence"
  },
  "memory": "New permanent fact about the user",
  "ru_translation": "Полный перевод твоего ответа на русский язык",
  "feedback_collected": "User thinks I explain grammar well."
}
\`\`\`
`;
};

export const createChatSession = (userId?: string, memories: string[] = []): ChatSession => {
  return {
    history: [], 
    userId,
    memories
  };
};

/**
 * Sends a message using Google GenAI SDK with Streaming
 */
export const sendMessageStream = async (
  session: ChatSession,
  userText: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  
  if (!apiKey) {
    const errorMsg = "⚠️ Configuration Error: API_KEY is missing. Please check your .env file.";
    console.error(errorMsg);
    onChunk(errorMsg);
    return "Error";
  }

  // 1. Prepare system instruction
  const systemPrompt = buildSystemInstruction(session.memories);
  
  // 2. Map history to SDK Content format
  // Filter out system messages (handled via config) and map roles
  const history: Content[] = session.history
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  try {
    // 3. Create Chat Instance
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    // 4. Send Message & Stream Response
    // FIX: sendMessageStream expects an object with 'message' property
    const resultStream = await chat.sendMessageStream({ message: userText });
    
    let fullText = "";
    for await (const chunk of resultStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }

    // 5. Update Local Session History
    session.history.push({ role: 'user', content: userText });
    session.history.push({ role: 'assistant', content: fullText });

    return fullText;

  } catch (err: any) {
    console.error("Gemini SDK Stream Error:", err);
    
    let userMessage = "⚠️ Connection error. Please check your internet.";
    if (err.toString().includes("API key")) {
        userMessage = "⚠️ Invalid API Key. Please check your settings.";
    } else if (err.toString().includes("429")) {
        userMessage = "⚠️ Too many requests. Please wait a moment.";
    }

    onChunk(userMessage);
    return "Error";
  }
};

// --- PROCEDURAL GENERATION ENGINE ---

export interface GeneratedLesson {
  title: string;
  description: string;
  system_prompt: string;
  icon: string;
}

export const generateNextLessonPlan = async (
  recentHistoryTitles: string[],
  userMemories: string[]
): Promise<GeneratedLesson> => {
  
  if (!apiKey) return {
    title: "Свободная беседа",
    description: "Настройте API ключ чтобы получить уроки.",
    system_prompt: "Chat freely.",
    icon: "MessageCircle"
  };

  const historyContext = recentHistoryTitles.length > 0 
    ? `User has completed: ${recentHistoryTitles.join(', ')}.` 
    : "User is brand new.";
    
  const memoryContext = userMemories.length > 0 
    ? `User Facts: ${userMemories.join(', ')}` 
    : "No personal facts known.";

  const prompt = `
    ROLE: You are the "Architect" of a procedural language learning path.
    
    INPUT:
    - ${historyContext}
    - ${memoryContext}
    
    TASK:
    Generate the ONE best NEXT lesson topic for this user.
    
    AVAILABLE ICONS (Choose one):
    Hand, Coffee, Sun, Plane, Rocket, Briefcase, MapPin, Camera, Music, Heart, Star, Book, Gamepad, Pizza, Car
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Short catchy title in Russian (max 3 words)" },
                description: { type: Type.STRING, description: "One sentence description in Russian motivating the user" },
                system_prompt: { type: Type.STRING, description: "Hidden instructions for the AI Tutor (Leo) to start this specific roleplay/lesson. Must include 'START_SCENARIO:' prefix." },
                icon: { type: Type.STRING, description: "String name from available icons" }
            },
            required: ["title", "description", "system_prompt", "icon"]
        }
      }
    });

    const jsonText = response.text;
    
    if (!jsonText) throw new Error("Empty response from Architect");
    return JSON.parse(jsonText) as GeneratedLesson;

  } catch (e) {
    console.error("Architect Error:", e);
    // Fallback Lesson
    return {
      title: "Свободная беседа",
      description: "Лео готов обсудить любую тему.",
      system_prompt: "Just chat with the user freely. Ask them what they want to talk about.",
      icon: "MessageCircle"
    };
  }
};

/**
 * On-demand translation helper.
 */
export const translateText = async (text: string): Promise<string> => {
  if (!apiKey) return "API Key missing";
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Translate the following English text to Russian. Output ONLY the translation string, no explanations.\n\nText: "${text}"`,
    });

    return response.text?.trim() || "Не удалось перевести.";
  } catch (e) {
    console.error("Translation failed", e);
    return "Не удалось перевести.";
  }
};
