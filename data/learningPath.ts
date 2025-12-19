
export interface LessonModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  systemPrompt: string;
  xpReward: number;
}

export const LEARNING_PATH: LessonModule[] = [
  // === LEVEL A1 ===
  {
    id: 'intro_a1',
    title: 'Знакомство',
    description: 'Расскажи о себе и узнай Лео.',
    icon: 'Hand',
    level: 'A1',
    xpReward: 50,
    systemPrompt: "TOPIC: Introduction. The user has just opened the 'Introduction' lesson. Your goal: Ask the user for their name, where they are from, and one hobby. Speak simple English (A1). Correct major mistakes only. Start by saying: 'Hello! I am Leo. Let's get to know each other! What is your name?'"
  },
  {
    id: 'food_a1',
    title: 'Еда и Напитки',
    description: 'Научись заказывать кофе.',
    icon: 'Coffee',
    level: 'A1',
    xpReward: 100,
    systemPrompt: "START_SCENARIO: Barista at 'Lingo Café'. The user wants to order. Ask: 'Hi there! Welcome to Lingo Café. What can I get started for you today?'. Help them order a drink and a snack. Be friendly."
  },
  {
    id: 'routine_a1',
    title: 'Мой день',
    description: 'Present Simple: Твоя рутина.',
    icon: 'Sun',
    level: 'A1',
    xpReward: 100,
    systemPrompt: "TOPIC: Daily Routine. Ask user what they do in the morning. Focus on Present Simple (I wake up, I go). Correct 'I am go' mistakes. Start by asking: 'Tell me, what time do you usually wake up?'"
  },
  
  // === LEVEL A2 ===
  {
    id: 'travel_a2',
    title: 'Путешествия',
    description: 'Past Simple: Как прошел отпуск?',
    icon: 'Plane',
    level: 'A2',
    xpReward: 150,
    systemPrompt: "TOPIC: Travel Memories. Ask user about their last trip. Focus on Past Simple verbs (went, saw, ate). Start by asking: 'I love traveling! 🌍 Where was the last place you visited?'"
  },
  {
    id: 'future_plans_a2',
    title: 'Планы на будущее',
    description: 'Going to / Will',
    icon: 'Rocket',
    level: 'A2',
    xpReward: 150,
    systemPrompt: "TOPIC: Future Plans. Discuss next weekend or next summer. Force usage of 'going to' for plans and 'will' for predictions. Start by asking: 'Do you have any big plans for the next weekend?'"
  },

  // === LEVEL B1 ===
  {
    id: 'job_interview_b1',
    title: 'Собеседование',
    description: 'Roleplay: Устройся на работу.',
    icon: 'Briefcase',
    level: 'B1',
    xpReward: 200,
    systemPrompt: "START_SCENARIO: HR Manager. You are interviewing the user for a job at a Tech Company. Ask about their strengths and weaknesses. Be professional but encouraging."
  }
];
