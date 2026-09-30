"use client";

import { useCallback, useRef, useState } from "react";
import { synthesizeSpeech } from "@/lib/api";

export type VoiceOption = {
  id: string;
  name: string;
  gender: "female" | "male";
  accent: string;
};

export const AVAILABLE_VOICES: readonly VoiceOption[] = [
  { id: "en-US-AriaNeural", name: "Aria", gender: "female", accent: "🇺🇸 American" },
  { id: "en-US-GuyNeural", name: "Guy", gender: "male", accent: "🇺🇸 American" },
  { id: "en-US-ChristopherNeural", name: "Christopher", gender: "male", accent: "🇺🇸 American" },
  { id: "en-GB-RyanNeural", name: "Ryan", gender: "male", accent: "🇬🇧 British" },
  { id: "en-GB-SoniaNeural", name: "Sonia", gender: "female", accent: "🇬🇧 British" },
  { id: "en-AU-WilliamNeural", name: "William", gender: "male", accent: "🇦🇺 Australian" },
];

export function useTextToSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedVoice, setSelectedVoiceState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("emily-voice") || "en-US-AriaNeural";
    }
    return "en-US-AriaNeural";
  });

  const setSelectedVoice = useCallback((voice: string) => {
    setSelectedVoiceState(voice);
    if (typeof window !== "undefined") {
      localStorage.setItem("emily-voice", voice);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    stop();

    try {
      const audioBlob = await synthesizeSpeech(text, selectedVoice);
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error("TTS failed:", err);
    }
  }, [selectedVoice]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { speak, stop, selectedVoice, setSelectedVoice, voices: AVAILABLE_VOICES };
}
