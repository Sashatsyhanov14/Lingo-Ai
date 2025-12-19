import React, { useEffect, useRef } from 'react';
import { ChatBubble } from './ChatBubble';
import { InputArea } from './InputArea';
import { TypingIndicator } from './TypingIndicator';
import { useChatLogic } from '../hooks/useChatLogic';

interface ChatInterfaceProps {
  userId?: string;
  onAddXP: (amount: number) => void;
  onCorrection?: () => void;
  initialTopic?: string | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId, onAddXP, onCorrection, initialTopic }) => {
  const { messages, isLoading, isInitializing, sendMessage } = useChatLogic(userId, (xp) => {
    onAddXP(xp);
    // If the message has a correction, trigger the callback
  }, initialTopic);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check for new corrections in the last message
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model' && lastMsg.correction && onCorrection) {
        onCorrection();
      }
    }
  }, [isLoading, messages]);

  // Auto-scroll
  useEffect(() => {
    if (!isInitializing) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isInitializing]);

  if (isInitializing) {
      return (
          <div className="flex items-center justify-center h-full bg-[#111827]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#111827]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
           <TypingIndicator />
        )}
        
        <div ref={bottomRef} />
      </div>

      <InputArea onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
};