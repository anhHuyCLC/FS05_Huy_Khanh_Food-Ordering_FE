import React from "react";

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-1 items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none max-w-[fit-content] shadow-sm mb-4">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
};
