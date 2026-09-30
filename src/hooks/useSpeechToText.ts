"use client";

import { useCallback } from "react";
import { transcribeAudio } from "@/lib/api";

export function useSpeechToText() {
  const transcribe = useCallback(async (audioBlob: Blob): Promise<string> => {
    const result = await transcribeAudio(audioBlob);
    return result.text;
  }, []);

  return { transcribe };
}
