import type { PrepareAgentRequest, TranscribeResponse, SynthesizeRequest } from "@/types/api";

/**
 * Internal API layer — all calls go to Next.js App Router routes.
 * No external URLs (NEXT_PUBLIC_API_URL / NEXT_PUBLIC_STT_URL) are used.
 */

export async function prepareAgent(data: PrepareAgentRequest): Promise<void> {
  const res = await fetch("/api/conversation/prepare-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error ?? `prepare-agent failed: ${res.status}`);
  }
}

export async function resetAgent(): Promise<void> {
  await fetch("/api/conversation/reset-agent", { method: "POST" });
}

export function streamConverse(message: string): Promise<Response> {
  return fetch("/api/conversation/converse/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function transcribeAudio(
  audioBlob: Blob,
): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  const res = await fetch("/api/speech/transcribe", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error ?? `transcribeAudio failed: ${res.status}`);
  }
  return res.json();
}

export async function synthesizeSpeech(text: string, voice?: string): Promise<Blob> {
  const res = await fetch("/api/speech/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice } satisfies SynthesizeRequest),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.error ?? `synthesizeSpeech failed: ${res.status}`);
  }
  return res.blob();
}
