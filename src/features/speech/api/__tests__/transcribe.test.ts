import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/features/speech/api/transcribe/route";

const { mockTranscribe } = vi.hoisted(() => ({
  mockTranscribe: vi.fn(),
}));

vi.mock("@/features/speech/lib/speech-client", () => ({
  transcribe: mockTranscribe,
  getWorkerBaseUrl: vi.fn(),
}));

describe("POST /api/speech/transcribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTranscribe.mockResolvedValue({ text: "Hello world" });
  });

  // Minimal Request-like object that provides formData().get("file")
  function makeReq(file: Blob | null): Request {
    return {
      formData: () =>
        Promise.resolve({
          get: (name: string) => (name === "file" ? file : null),
        }),
    } as unknown as Request;
  }

  it("returns transcribed text on success", async () => {
    const blob = new Blob(["audio data"]);
    const res = await POST(makeReq(blob));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ text: "Hello world" });
  });

  it("passes the audio blob to the worker", async () => {
    const blob = new Blob(["fake audio"]);
    await POST(makeReq(blob));
    expect(mockTranscribe).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when no file is provided", async () => {
    const res = await POST(makeReq(null));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("No audio file provided");
  });

  it("returns 503 when PYTHON_WORKER_PORT is not set", async () => {
    mockTranscribe.mockRejectedValue(
      new Error("PYTHON_WORKER_PORT is not set. Is the dev script running?"),
    );

    const res = await POST(makeReq(new Blob(["audio"])));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data).toEqual({ error: "Speech worker unavailable" });
  });

  it("returns 502 on other errors", async () => {
    mockTranscribe.mockRejectedValue(new Error("Network timeout"));

    const res = await POST(makeReq(new Blob(["audio"])));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("Transcription failed");
  });
});
