/**
 * Thin client for the Python speech worker.
 * Builds URLs from PYTHON_WORKER_PORT env var and handles retries.
 */

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

export function getWorkerBaseUrl(): string {
  const port = process.env.PYTHON_WORKER_PORT;
  if (!port) {
    throw new Error("PYTHON_WORKER_PORT is not set. Is the dev script running?");
  }
  return `http://127.0.0.1:${port}`;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(30_000),
      });
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
      }
    }
  }

  throw lastError ?? new Error("Speech worker unreachable after retries");
}

export async function transcribe(audioBlob: Blob): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");

  const res = await fetchWithRetry(`${getWorkerBaseUrl()}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Transcription failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function synthesize(text: string, voice?: string): Promise<Blob> {
  const res = await fetchWithRetry(`${getWorkerBaseUrl()}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });

  if (!res.ok) {
    throw new Error(`Synthesis failed: ${res.status} ${res.statusText}`);
  }

  return res.blob();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${getWorkerBaseUrl()}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
