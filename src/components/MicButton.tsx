"use client";

import type { RecorderState } from "@/types/chat";

interface MicButtonProps {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
  disabled: boolean;
}

export function MicButton({ state, onStart, onStop, disabled }: MicButtonProps) {
  const isRecording = state === "recording";
  const isTranscribing = state === "transcribing";

  return (
    <div className="relative flex items-center justify-center">
      {isRecording && (
        <div className="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping" />
      )}
      <button
        type="button"
        onClick={isRecording ? onStop : onStart}
        disabled={disabled || isTranscribing}
        className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center
          shadow-lg transition-all duration-200 ${
            isRecording
              ? "bg-red-500 text-white scale-110 shadow-red-500/40"
              : isTranscribing
                ? "bg-amber-500 text-white cursor-wait"
                : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-blue-500/30"
          } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isTranscribing ? (
          <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isRecording ? (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
            <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
            <rect x="11" y="19" width="2" height="4" rx="1" />
          </svg>
        )}
      </button>
    </div>
  );
}
