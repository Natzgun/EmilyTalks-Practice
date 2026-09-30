import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/features/conversation/api/converse/stream/route";

const { mockStore, mockFetch } = vi.hoisted(() => ({
  mockStore: {
    init: vi.fn(),
    reset: vi.fn(),
    addMessage: vi.fn(),
    getMessagesForOllama: vi.fn().mockReturnValue([
      { role: "system", content: "You are Emily" },
      { role: "user", content: "Hello" },
    ]),
    isActive: vi.fn().mockReturnValue(true),
    getMetadata: vi.fn().mockReturnValue({ scenario: "casual", topic: "test" }),
  },
  mockFetch: vi.fn(),
}));

vi.mock("@/features/conversation/lib/conversation-store", () => ({
  store: mockStore,
}));

vi.stubGlobal("fetch", mockFetch);

describe("POST /api/conversation/converse/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isActive.mockReturnValue(true);
  });

  function createRequest(body: unknown): Request {
    return new Request(
      "http://localhost/api/conversation/converse/stream",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }

  it("returns 400 when no active session exists", async () => {
    mockStore.isActive.mockReturnValue(false);
    const req = createRequest({ message: "Hello" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({
      error: "No active session. Call prepare-agent first.",
    });
  });

  it("returns SSE content type on success", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        '{"message":{"role":"assistant","content":"Hello"}}\n{"message":{"role":"assistant","content":" world"}}\n',
        { status: 200 },
      ),
    );
    const req = createRequest({ message: "Hi" });
    const res = await POST(req);

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("appends user message to store", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        '{"message":{"role":"assistant","content":"Hello"}}\n',
        { status: 200 },
      ),
    );
    const req = createRequest({ message: "Hi" });
    await POST(req);

    expect(mockStore.addMessage).toHaveBeenCalledWith("user", "Hi");
  });

  it("returns 400 when message is missing", async () => {
    const req = createRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "message is required" });
  });

  it("returns SSE stream on success (ReadableStream body)", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        '{"message":{"role":"assistant","content":"token1"}}\n{"message":{"role":"assistant","content":"token2"}}\n',
        { status: 200 },
      ),
    );
    const req = createRequest({ message: "Hi" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(ReadableStream);
  });

  it("returns SSE error when Ollama fetch rejects", async () => {
    mockFetch.mockRejectedValue(new Error("Connection refused"));
    const req = createRequest({ message: "Hello" });
    const res = await POST(req);

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: true }));
    }
    const fullOutput = chunks.join("");
    expect(fullOutput).toContain("Ollama unavailable");
  });

  it("returns SSE error when Ollama response is not ok", async () => {
    mockFetch.mockResolvedValue(new Response("Error", { status: 500 }));
    const req = createRequest({ message: "Hello" });
    const res = await POST(req);

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: true }));
    }
    const fullOutput = chunks.join("");
    expect(fullOutput).toContain("Ollama unavailable");
  });
});
