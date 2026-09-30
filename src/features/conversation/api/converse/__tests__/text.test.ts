import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/features/conversation/api/converse/text/route";

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

describe("POST /api/conversation/converse/text", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isActive.mockReturnValue(true);
    mockStore.getMessagesForOllama.mockReturnValue([
      { role: "system", content: "You are Emily" },
      { role: "user", content: "Hello" },
    ]);
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          model: "llama3.2",
          message: { role: "assistant", content: "Hi there!" },
          done: true,
        }),
        { status: 200 },
      ),
    );
  });

  function createRequest(body: unknown): Request {
    return new Request(
      "http://localhost/api/conversation/converse/text",
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

  it("appends user message and sends full history to Ollama", async () => {
    const req = createRequest({ message: "Tell me a joke" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockStore.addMessage).toHaveBeenCalledWith("user", "Tell me a joke");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:11434/api/chat");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("llama3.2");
    expect(body.stream).toBe(false);
    expect(body.messages).toEqual([
      { role: "system", content: "You are Emily" },
      { role: "user", content: "Hello" },
    ]);
  });

  it("returns the assistant message in the response", async () => {
    const req = createRequest({ message: "Hello" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ message: "Hi there!" });
  });

  it("stores the assistant response", async () => {
    const req = createRequest({ message: "Hello" });
    await POST(req);

    expect(mockStore.addMessage).toHaveBeenCalledWith("assistant", "Hi there!");
  });

  it("returns 400 when message is missing", async () => {
    const req = createRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "message is required" });
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request(
      "http://localhost/api/conversation/converse/text",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "Invalid request body" });
  });

  it("returns 502 when Ollama request fails", async () => {
    mockFetch.mockRejectedValue(new Error("Connection refused"));
    const req = createRequest({ message: "Hello" });
    const res = await POST(req);

    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data).toEqual({ error: "Ollama request failed" });
  });

  it("returns 502 when Ollama returns non-ok status", async () => {
    mockFetch.mockResolvedValue(new Response("Internal Error", { status: 500 }));
    const req = createRequest({ message: "Hello" });
    const res = await POST(req);

    expect(res.status).toBe(502);
  });
});
