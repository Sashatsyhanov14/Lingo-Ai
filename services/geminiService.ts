
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

// OpenRouter Configuration
const API_KEY = getEnv('API_KEY'); // Ensure your .env has API_KEY set to your OpenRouter key
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Using the free Mistral model on OpenRouter
const MODEL_NAME = "mistralai/mistral-7b-instruct:free"; 

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
 * Sends a message using OpenRouter (Fetch API) with Streaming
 */
export const sendMessageStream = async (
  session: ChatSession,
  userText: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  
  if (!API_KEY) {
    const errorMsg = "⚠️ Configuration Error: API_KEY is missing. Please check your .env file.";
    console.error(errorMsg);
    onChunk(errorMsg);
    return "Error";
  }

  // 1. Prepare messages
  const systemPrompt = buildSystemInstruction(session.memories);
  const messages = [
      { role: "system", content: systemPrompt },
      ...session.history.filter(m => m.role !== 'system'),
      { role: "user", content: userText }
  ];

  try {
    // 2. Fetch from OpenRouter
    const response = await fetch(API_URL, {
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
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
    }
    
    if (!response.body) throw new Error("No response body");

    // 3. Process Stream
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
            const content = data.choices[0]?.delta?.content || "";
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch (e) {
            // ignore partial json
          }
        }
      }
    }

    // 4. Update Local Session History
    session.history.push({ role: 'user', content: userText });
    session.history.push({ role: 'assistant', content: fullText });

    return fullText;

  } catch (err: any) {
    console.error("OpenRouter Stream Error:", err);
    
    let userMessage = "⚠️ Connection error. Please check your internet.";
    if (err.toString().includes("401")) {
        userMessage = "⚠️ Invalid API Key. Please check your OpenRouter settings.";
    } else if (err.toString().includes("429")) {
        userMessage = "⚠️ Too many requests. Please wait a moment.";
    } else if (err.toString().includes("503") || err.toString().includes("502")) {
        userMessage = "⚠️ AI Model is busy (OpenRouter). Please try again.";
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
  
  if (!API_KEY) return {
    title: "Свободная беседа",
    description: "Настройте API ключ чтобы получить уроки.",
    system_prompt: "Chat freely.",
    icon: "MessageCircle"
  };

  const historyContext = recentHistoryTitles.length > 0 ? recentHistoryTitles.join(', ') : "None";
  const memoryContext = userMemories.length > 0 ? userMemories.join(', ') : "None";

  const prompt = `
    ROLE: You are the "Architect" of a procedural language learning path.
    INPUT: History=[${historyContext}], Memories=[${memoryContext}].
    TASK: Generate ONE next lesson plan JSON.
    AVAILABLE ICONS: Hand, Coffee, Sun, Plane, Rocket, Briefcase, MapPin, Camera, Music, Heart, Star, Book, Gamepad, Pizza, Car.
    
    RESPONSE FORMAT (JSON ONLY, NO MARKDOWN):
    {
      "title": "Short Russian Title",
      "description": "Short Russian Description",
      "system_prompt": "START_SCENARIO: [Instructions for Tutor]",
      "icon": "IconName"
    }
  `;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        // REMOVED response_format: { type: "json_object" } 
        // Mistral Free often fails with strict json param, better to rely on prompt.
      })
    });

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("Empty response from Architect");
    
    // Cleanup if markdown code blocks are present
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(content) as GeneratedLesson;

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
  if (!API_KEY) return "API Key missing";
  
  try {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "HTTP-Referer": SITE_URL,
          "X-Title": SITE_NAME,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: "user", content: `Translate the following English text to Russian. Output ONLY the translation string, no explanations.\n\nText: "${text}"` }],
          temperature: 0.3
        })
      });
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || "Не удалось перевести.";
  } catch (e) {
    console.error("Translation failed", e);
    return "Не удалось перевести.";
  }
};
