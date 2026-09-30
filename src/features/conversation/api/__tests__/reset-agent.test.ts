import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/features/conversation/api/reset-agent/route";

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

describe("POST /api/conversation/reset-agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls store.reset() and returns status reset", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ status: "reset" });
    expect(mockStore.reset).toHaveBeenCalledTimes(1);
  });

  it("is idempotent — succeeds even with no active session", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(mockStore.reset).toHaveBeenCalledTimes(1);
  });

  it("works when called multiple times in a row", async () => {
    const res1 = await POST();
    expect(res1.status).toBe(200);

    const res2 = await POST();
    expect(res2.status).toBe(200);

    expect(mockStore.reset).toHaveBeenCalledTimes(2);
  });
});
