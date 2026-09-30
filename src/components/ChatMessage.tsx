"use client";

import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { StreamingText } from "./StreamingText";

interface ChatMessageProps {
  message: ChatMessageType;
  onReplay?: () => void;
}

export function ChatMessage({ message, onReplay }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const showReplay = isAssistant && !message.isStreaming && onReplay && message.content;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
          E
        </div>
      )}
      <div className="max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-md"
          }`}
        >
          {message.isStreaming ? (
            <StreamingText text={message.content} isStreaming />
          ) : (
            message.content
          )}
        </div>
        {showReplay && (
          <button
            onClick={onReplay}
            className="mt-1 ml-1 flex items-center gap-1 text-[10px] text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            title="Listen again"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Listen</span>
          </button>
        )}
      </div>
    </div>
  );
}
