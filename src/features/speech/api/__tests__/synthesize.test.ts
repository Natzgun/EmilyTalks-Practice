import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/features/speech/api/synthesize/route";

const { mockSynthesize } = vi.hoisted(() => ({
  mockSynthesize: vi.fn(),
}));

vi.mock("@/features/speech/lib/speech-client", () => ({
  synthesize: mockSynthesize,
  getWorkerBaseUrl: vi.fn(),
}));

describe("POST /api/speech/synthesize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSynthesize.mockResolvedValue(new Blob(["wav data"], { type: "audio/wav" }));
  });

  function createRequest(body: unknown): Request {
    return new Request("http://localhost/api/speech/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns audio/wav on success", async () => {
    const req = createRequest({ text: "Hello there" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/wav");
  });

  it("returns an audio blob from the worker", async () => {
    const req = createRequest({ text: "Hello there" });
    const res = await POST(req);

    const blob = await res.blob();
    expect(blob.type).toBe("audio/wav");
  });

  it("calls the worker synthesize function with text", async () => {
    const req = createRequest({ text: "Hello there" });
    await POST(req);

    expect(mockSynthesize).toHaveBeenCalledWith("Hello there", undefined);
  });

  it("calls the worker synthesize function with text and voice", async () => {
    const req = createRequest({ text: "Hello there", voice: "en-US-GuyNeural" });
    await POST(req);

    expect(mockSynthesize).toHaveBeenCalledWith("Hello there", "en-US-GuyNeural");
  });

  it("trims trailing whitespace from text", async () => {
    const req = createRequest({ text: "  Hello there  " });
    await POST(req);

    expect(mockSynthesize).toHaveBeenCalledWith("Hello there", undefined);
  });

  it("returns 400 when text is missing", async () => {
    const req = createRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("text is required");
  });

  it("returns 400 when text is empty string", async () => {
    const req = createRequest({ text: "" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("text is required");
  });

  it("returns 400 when text is only whitespace", async () => {
    const req = createRequest({ text: "   " });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("text is required");
  });

  it("returns 400 when text is not a string", async () => {
    const req = createRequest({ text: 123 });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("text is required");
  });

  it("returns 503 when PYTHON_WORKER_PORT is not set", async () => {
    mockSynthesize.mockRejectedValue(new Error("PYTHON_WORKER_PORT is not set"));

    const req = createRequest({ text: "Hello" });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data).toEqual({ error: "Speech worker unavailable" });
  });

  it("returns 502 on other errors", async () => {
    mockSynthesize.mockRejectedValue(new Error("Network timeout"));

    const req = createRequest({ text: "Hello" });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("Synthesis failed");
  });
});
