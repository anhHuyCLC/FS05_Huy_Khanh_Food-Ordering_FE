import React from "react";
import type { Message } from "../../types/chat.types";
import { Bot, User } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={twMerge("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={twMerge(
        "flex max-w-[85%] items-end space-x-2",
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}>

        {/* Avatar */}
        <div className={twMerge(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
          isUser ? "bg-blue-600 text-white" : "bg-orange-500 text-white"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Message Bubble */}
        <div className={twMerge(
          "px-4 py-3 shadow-sm text-[15px]",
          isUser
            ? "bg-blue-600 text-white rounded-2xl rounded-br-none"
            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none"
        )}>
          <div className="whitespace-pre-wrap leading-relaxed break-words">
            {message.content}
          </div>
          <div className={twMerge(
            "text-[10px] mt-1.5 opacity-60 font-medium",
            isUser ? "text-right" : "text-left"
          )}>
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </div>
        </div>

      </div>
    </div>
  );
};
