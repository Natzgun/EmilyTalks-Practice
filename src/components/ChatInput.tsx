"use client";

import { useState, type FormEvent } from "react";
import { MicButton } from "./MicButton";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const { recorderState, setRecorderState, startRecording, stopRecording } = useVoiceRecorder();
  const { transcribe } = useSpeechToText();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleVoiceStart = async () => {
    try {
      await startRecording();
    } catch {
      console.error("Microphone access denied");
    }
  };

  const handleVoiceStop = async () => {
    setRecorderState("transcribing");
    const blob = await stopRecording();
    try {
      const transcribed = await transcribe(blob);
      if (transcribed.trim()) {
        onSend(transcribed.trim());
      }
    } catch {
      console.error("Transcription failed");
    }
    setRecorderState("idle");
  };

  return (
    <div className="px-4 pb-6 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex justify-center">
        <MicButton
          state={recorderState}
          onStart={handleVoiceStart}
          onStop={handleVoiceStop}
          disabled={disabled}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type a message..."
          disabled={disabled || recorderState !== "idle"}
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
            rounded-xl px-4 py-2.5 text-sm
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            outline-none focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-40 transition-colors"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="p-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full
            hover:bg-blue-500 dark:hover:bg-blue-400
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
