
import { getEnv } from "./utils";

// --- CONFIGURATION ---
const API_KEY = getEnv('API_KEY'); // OpenRouter API Key
const SITE_URL = "https://lingo-app.com";
const SITE_NAME = "Lingo AI Tutor";
const MODEL_NAME = "google/gemini-2.0-flash-001"; // Standard high-quality Gemini on OpenRouter

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  history: ChatMessage[];
  userId?: string;
  memories?: string[];
}

export interface GeneratedLesson {
  title: string;
  description: string;
  system_prompt: string;
  icon: string;
}

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
 * Sends a message using OpenRouter API (Streaming)
 */
export const sendMessageStream = async (
  session: ChatSession,
  userText: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  
  const systemPrompt = buildSystemInstruction(session.memories);
  
  // Construct full message history for stateless API
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...session.history,
    { role: 'user', content: userText }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        stream: true,
        temperature: 0.7
      })
    });

    if (!response.ok) {
       console.error("OpenRouter API Error", response.status, response.statusText);
       throw new Error(`OpenRouter API Error: ${response.status}`);
    }
    
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") break;
          
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content || "";
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch (e) {
            console.warn("Error parsing stream chunk", e);
          }
        }
      }
    }

    // Update Session History
    session.history.push({ role: 'user', content: userText });
    session.history.push({ role: 'assistant', content: fullText });

    return fullText;

  } catch (err) {
    console.error("OpenRouter Error:", err);
    onChunk("⚠️ Connection error. Please check your internet or API key.");
    return "Error";
  }
};

/**
 * Procedural Lesson Generation (OpenRouter)
 */
export const generateNextLessonPlan = async (
  recentHistoryTitles: string[],
  userMemories: string[]
): Promise<GeneratedLesson> => {
  
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

    OUTPUT FORMAT:
    JSON ONLY.
    {
       "title": "Short catchy title in Russian (max 3 words)",
       "description": "One sentence description in Russian motivating the user",
       "system_prompt": "Hidden instructions for the AI Tutor (Leo) to start this specific roleplay/lesson. Must include 'START_SCENARIO:' prefix.",
       "icon": "String name from available icons"
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        // OpenRouter supports response_format for some models, but plain JSON instruction is safer generally
        response_format: { type: "json_object" } 
      })
    });

    const data = await response.json();
    let jsonText = data.choices?.[0]?.message?.content || "";
    
    if (!jsonText) throw new Error("Empty response from Architect");
    
    // Clean markdown if present
    jsonText = jsonText.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonText) as GeneratedLesson;

  } catch (e) {
    console.error("Architect Error:", e);
    // Fallback Lesson
    return {
      title: "Свободная беседа",
      description: "Лео готов обсудить любую тему.",
      system_prompt: "Just chat with the user freely.",
      icon: "MessageCircle"
    };
  }
};

/**
 * On-demand translation helper.
 */
export const translateText = async (text: string): Promise<string> => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: `Translate the following English text to Russian. Output ONLY the translation string.\n\nText: "${text}"` }]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "Не удалось перевести.";
  } catch (e) {
    console.error("Translation failed", e);
    return "Не удалось перевести.";
  }
};
