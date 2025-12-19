
import { GoogleGenAI, Type } from "@google/genai";
import { MemoryItem } from "./supabase";

/**
 * Standardized ChatMessage to use official Gemini roles internally.
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatSession {
  history: ChatMessage[];
  userId?: string;
  memories?: string[];
}

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
   - *Example:* "Привет! Давай выучим слово **Apple** (Яблоко). Повтори за мной: Apple."

2. **LEVEL A1 (Elementary):**
   - Main language: **Simple English**.
   - BUT: If you explain grammar or complex concepts, switch to **Russian**.
   - *Example:* "Good job! Now let's talk about Past Simple. Мы используем это время, когда говорим о прошлом."

3. **LEVEL B1+ (Intermediate):**
   - Main language: **English Only**.
   - Use Russian ONLY if the user explicitly asks "Как это по-русски?" or "I don't understand".

**EMERGENCY PROTOCOL:**
If the user writes in Russian (e.g., "Я ничего не понимаю"), STOP speaking English immediately. Switch to Russian, calm them down, and explain simply.

# FIRST MEETING PROTOCOL (PLACEMENT TEST)
If the chat history is empty, the user has just started. Use the **Greeting** to gauge their level.
- If they reply in Russian ("С нуля", "Немного учил"): Mark as A0/A1 -> Speak Russian/Simple English.
- If they reply in English ("I studied before"): Mark as B1 -> Speak English.
- **Always adapt immediately.**

# TEACHING METHODOLOGY (THE SANDWICH LOOP)
1. **Validation:** Acknowledge what the user said positively.
2. **Implicit Correction:** Reuse the correct phrase in your sentence naturally.
3. **The Push:** Ask a follow-up question.

# SCENARIO MODE INSTRUCTIONS
If a system message says "START_SCENARIO: [Role]", act fully in character. Do not correct immediately.

# JSON DATA PROTOCOL (HIDDEN)
You must respond in TWO parts.
1. **The Chat:** A friendly, natural response.
2. **The Data (JSON):** A hidden block at the VERY END.

**JSON Rules:**
- Wrap in triple backticks with 'json' tag.
- NO comments inside JSON.
- **ru_translation**: MANDATORY. Provide a full Russian translation of your response (for the UI translation button).

\`\`\`json
{
  "correction": {
    "original": "Text with error",
    "fixed": "Corrected text",
    "explanation": "Short explanation (max 15 words)",
    "example": "Example sentence"
  },
  "memory": "New permanent fact about the user",
  "ru_translation": "Полный перевод твоего ответа на русский язык"
}
\`\`\`
`;
};

export const createChatSession = (userId?: string, memories: string[] = []): ChatSession => {
  return {
    history: [
      { role: 'system', content: buildSystemInstruction(memories) }
    ],
    userId,
    memories
  };
};

export const sendMessageStream = async (
  session: ChatSession,
  userText: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Refresh system instruction with latest memories if needed
  const dynamicSystemInstruction = buildSystemInstruction(session.memories);

  const contents = session.history
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
      parts: [{ text: m.content }]
    }));
  
  contents.push({ role: 'user', parts: [{ text: userText }] });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: dynamicSystemInstruction,
        temperature: 0.7,
      },
    });

    let fullText = "";

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }

    session.history.push({ role: 'user', content: userText });
    session.history.push({ role: 'assistant', content: fullText });

    return fullText;
  } catch (err) {
    console.error("Gemini Stream Error:", err);
    throw err;
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    - If new: Start with "Introduction" or "Basics".
    - If they have history: Suggest something new related to their interests (Memories) or a logical next step (e.g. Food -> Restaurant -> Cooking).
    - If they failed previously: Suggest a "Review" session.
    
    AVAILABLE ICONS (Choose one):
    Hand, Coffee, Sun, Plane, Rocket, Briefcase, MapPin, Camera, Music, Heart, Star, Book, Gamepad, Pizza, Car
    
    OUTPUT JSON SCHEMA:
    {
      "title": "Short catchy title in Russian (max 3 words)",
      "description": "One sentence description in Russian motivating the user",
      "system_prompt": "Hidden instructions for the AI Tutor (Leo) to start this specific roleplay/lesson. Must include 'START_SCENARIO:' prefix.",
      "icon": "String name from available icons"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                system_prompt: { type: Type.STRING },
                icon: { type: Type.STRING },
            },
            required: ['title', 'description', 'system_prompt', 'icon']
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
