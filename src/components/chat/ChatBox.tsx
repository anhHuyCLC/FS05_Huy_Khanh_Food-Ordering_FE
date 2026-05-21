import React, { useEffect, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { useChatStore } from "../../app/hooks/useChat";
import { MessageSquare, Sparkles } from "lucide-react";
import { twMerge } from "tailwind-merge";

export const ChatBox: React.FC = () => {
  const { messages, isLoading, isOpen, toggleChat, sendMessage, clearHistory } = useChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={twMerge(
          "fixed bottom-6 right-6 p-4 rounded-full bg-orange-500 text-white shadow-xl hover:bg-orange-600 hover:shadow-2xl transition-all hover:scale-105 active:scale-95 z-50",
          isOpen && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <MessageSquare size={26} />
      </button>

      {/* Chat Popup Container */}
      <div
        className={twMerge(
          "fixed bottom-6 right-6 w-[92vw] max-w-[420px] h-[650px] max-h-[85vh] flex flex-col bg-gray-50 dark:bg-gray-950 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 z-50 transform transition-all duration-300 origin-bottom-right overflow-hidden",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <ChatHeader onClose={toggleChat} onClear={clearHistory} hasMessages={messages.length > 0} />

        {/* Messages Viewport */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70 space-y-5 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Sparkles size={40} className="text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">How can I help you?</p>
                <p className="text-sm text-gray-500 mt-1 max-w-[250px] mx-auto">
                  Ask me for recommendations, check your order status, or explore our menu.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
            </div>
          )}
        </div>

        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </>
  );
};
