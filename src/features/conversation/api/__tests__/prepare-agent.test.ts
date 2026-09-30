import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/features/conversation/api/prepare-agent/route";

const { mockStore } = vi.hoisted(() => ({
  mockStore: {
    init: vi.fn(),
    reset: vi.fn(),
    addMessage: vi.fn(),
    getMessagesForOllama: vi.fn().mockReturnValue([]),
    isActive: vi.fn().mockReturnValue(false),
    getMetadata: vi.fn().mockReturnValue({ scenario: "", topic: "" }),
  },
}));

vi.mock("@/features/conversation/lib/conversation-store", () => ({
  store: mockStore,
}));

describe("POST /api/conversation/prepare-agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.isActive.mockReturnValue(false);
  });

  function createRequest(body: unknown): Request {
    return new Request("http://localhost/api/conversation/prepare-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("initializes the store with scenario and topic", async () => {
    const req = createRequest({ scenario: "casual", topic: "weather" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: "prepared" });
    expect(mockStore.init).toHaveBeenCalledWith(
      "casual",
      "weather",
      expect.any(String),
    );
  });

  it("replaces existing session when store is already active", async () => {
    mockStore.isActive.mockReturnValue(true);
    const req = createRequest({ scenario: "interview", topic: "SWE role" });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: "prepared" });
    expect(mockStore.init).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when scenario is missing", async () => {
    const req = createRequest({ topic: "weather" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "scenario and topic are required" });
    expect(mockStore.init).not.toHaveBeenCalled();
  });

  it("returns 400 when topic is missing", async () => {
    const req = createRequest({ scenario: "casual" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "scenario and topic are required" });
    expect(mockStore.init).not.toHaveBeenCalled();
  });

  it("returns 400 when both fields are missing", async () => {
    const req = createRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: "scenario and topic are required" });
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request(
      "http://localhost/api/conversation/prepare-agent",
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

  it("generates the correct system prompt for each scenario", async () => {
    const scenarios = ["casual", "interview", "education", "storytelling", "debate"];

    for (const scenario of scenarios) {
      vi.clearAllMocks();
      const req = createRequest({ scenario, topic: "test" });
      await POST(req);

      const prompt = mockStore.init.mock.calls[0][2] as string;
      expect(prompt).toContain("Emily");
      expect(prompt.length).toBeGreaterThan(50);
    }
  });
});
