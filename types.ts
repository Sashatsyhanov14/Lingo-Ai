export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  context: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  correction?: Correction;
  translation?: string;
}

export interface User {
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}