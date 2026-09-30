"use client";

import { useState } from "react";
import { AVAILABLE_VOICES } from "@/hooks/useTextToSpeech";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (voice: string) => void;
}

export function VoiceSelector({ selectedVoice, onSelect }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const current = AVAILABLE_VOICES.find((v) => v.id === selectedVoice) || AVAILABLE_VOICES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg
          text-zinc-500 dark:text-zinc-400
          hover:bg-zinc-100 dark:hover:bg-zinc-800
          transition-colors"
        title="Change voice"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span>{current.name}</span>
        <span className="text-[10px] opacity-60">{current.gender === "male" ? "♂" : "♀"}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
              Select Voice
            </div>
            {AVAILABLE_VOICES.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  onSelect(voice.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedVoice === voice.id
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="text-base">{voice.gender === "male" ? "♂" : "♀"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{voice.name}</div>
                  <div className="text-[10px] text-zinc-400">{voice.accent}</div>
                </div>
                {selectedVoice === voice.id && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
