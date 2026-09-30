"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VoiceSelector } from "@/components/VoiceSelector";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTheme } from "@/hooks/useTheme";
import { prepareAgent, resetAgent } from "@/lib/api";

export default function ChatPage() {
  const [isReady, setIsReady] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const { messages, isStreaming, sendMessage, clearMessages } = useStreamChat();
  const { speak, stop: stopSpeech, selectedVoice, setSelectedVoice } = useTextToSpeech();
  const { theme, toggleTheme } = useTheme();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length < 2) return;
    const last = messages[messages.length - 1];
    if (
      last.role === "assistant" &&
      !last.isStreaming &&
      last.content &&
      last.id !== lastSpokenIdRef.current
    ) {
      lastSpokenIdRef.current = last.id;
      speak(last.content);
    }
  }, [messages, speak]);

  const handleSelectScenario = async (scenario: string, topic: string) => {
    setIsPreparing(true);
    try {
      await prepareAgent({ scenario, topic });
      setIsReady(true);
    } catch {
      console.error("Failed to prepare agent");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleReset = async () => {
    stopSpeech();
    await resetAgent();
    clearMessages();
    setIsReady(false);
  };

  if (!isReady) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <ScenarioSelector onSelect={handleSelectScenario} isLoading={isPreparing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            E
          </div>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Emily</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isStreaming ? "speaking..." : "online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VoiceSelector selectedVoice={selectedVoice} onSelect={setSelectedVoice} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            onClick={handleReset}
            className="text-xs px-3 py-1.5 rounded-lg
              text-zinc-500 dark:text-zinc-400
              hover:bg-zinc-100 dark:hover:bg-zinc-800
              transition-colors"
          >
            New chat
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
                <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
                <rect x="11" y="19" width="2" height="4" rx="1" />
              </svg>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Press the microphone or type to start talking with Emily
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onReplay={msg.role === "assistant" ? () => speak(msg.content) : undefined}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
