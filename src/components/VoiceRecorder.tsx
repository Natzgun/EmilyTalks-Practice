"use client";

import type { RecorderState } from "@/types/chat";

interface VoiceRecorderProps {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}

export function VoiceRecorder({ state, onStart, onStop, disabled }: VoiceRecorderProps) {
  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";

  return (
    <button
      type="button"
      onClick={isRecording ? onStop : onStart}
      disabled={disabled || isTranscribing}
      className={`p-2.5 rounded-full transition-all ${
        isRecording
          ? "bg-red-500 text-white animate-pulse"
          : isTranscribing
            ? "bg-yellow-500 text-white cursor-wait"
            : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isTranscribing ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a1 1 0 011 1v2h-2v-2a1 1 0 011-1z" />
        </svg>
      )}
    </button>
  );
}
