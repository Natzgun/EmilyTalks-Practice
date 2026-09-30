import { describe, it, expect, beforeEach } from "vitest";
import { store } from "@/features/conversation/lib/conversation-store";

describe("ConversationStore", () => {
  beforeEach(() => {
    store.reset();
  });

  describe("init()", () => {
    it("sets scenario and topic metadata", () => {
      store.init("casual", "weather", "You are Emily");

      const meta = store.getMetadata();
      expect(meta).toEqual({ scenario: "casual", topic: "weather" });
    });

    it("prepends system message as first entry", () => {
      store.init("casual", "weather", "You are Emily, a friendly AI");

      const messages = store.getMessagesForOllama();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: "system",
        content: "You are Emily, a friendly AI",
      });
    });

    it("replaces existing session when called again", () => {
      store.init("casual", "weather", "System prompt 1");
      store.addMessage("user", "Hello");
      store.addMessage("assistant", "Hi there");

      // Re-initialize — should clear previous messages
      store.init("interview", "SWE role", "System prompt 2");

      const messages = store.getMessagesForOllama();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        role: "system",
        content: "System prompt 2",
      });
      expect(store.getMetadata()).toEqual({
        scenario: "interview",
        topic: "SWE role",
      });
    });
  });

  describe("addMessage()", () => {
    it("appends user messages to history", () => {
      store.init("casual", "weather", "System");
      store.addMessage("user", "What is the weather?");

      const messages = store.getMessagesForOllama();
      expect(messages).toHaveLength(2);
      expect(messages[1]).toEqual({ role: "user", content: "What is the weather?" });
    });

    it("appends assistant messages to history", () => {
      store.init("casual", "weather", "System");
      store.addMessage("user", "Hello");
      store.addMessage("assistant", "Hi, how can I help?");

      const messages = store.getMessagesForOllama();
      expect(messages).toHaveLength(3);
      expect(messages[2]).toEqual({ role: "assistant", content: "Hi, how can I help?" });
    });

    it("accumulates messages in order", () => {
      store.init("casual", "weather", "System");
      store.addMessage("user", "Q1");
      store.addMessage("assistant", "A1");
      store.addMessage("user", "Q2");
      store.addMessage("assistant", "A2");

      const messages = store.getMessagesForOllama();
      expect(messages).toHaveLength(5);
      // System at [0], then user/assistant pairs
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
      expect(messages[2].role).toBe("assistant");
      expect(messages[3].role).toBe("user");
      expect(messages[4].role).toBe("assistant");
    });
  });

  describe("getMessagesForOllama()", () => {
    it("returns full history when under MAX_MESSAGES", () => {
      store.init("casual", "weather", "System");
      store.addMessage("user", "Q1");
      store.addMessage("assistant", "A1");

      const messages = store.getMessagesForOllama();
      expect(messages).toHaveLength(3);
    });

    it("returns a copy, not the internal array reference", () => {
      store.init("casual", "weather", "System");
      const msgs1 = store.getMessagesForOllama();
      msgs1.push({ role: "user", content: "mutation" });

      const msgs2 = store.getMessagesForOllama();
      expect(msgs2).toHaveLength(1); // Still just system
    });

    it("truncates when message count exceeds MAX_MESSAGES (10)", () => {
      store.init("casual", "weather", "SYSTEM_PROMPT");
      // Add 12 user messages (total: 13 — 1 system + 12 user)
      for (let i = 0; i < 12; i++) {
        store.addMessage("user", `Message ${i}`);
      }

      const messages = store.getMessagesForOllama();
      // Should be MAX_MESSAGES = 10: system + last 9
      expect(messages).toHaveLength(10);

      // System prompt preserved at index 0
      expect(messages[0]).toEqual({ role: "system", content: "SYSTEM_PROMPT" });

      // First user messages discarded, last 9 kept
      expect(messages[1].content).toBe("Message 3"); // messages 0,1,2 discarded; message 3 is the 4th
      expect(messages[9].content).toBe("Message 11");
    });
  });

  describe("reset()", () => {
    it("clears all messages", () => {
      store.init("casual", "weather", "System");
      store.addMessage("user", "Hello");

      store.reset();

      expect(store.getMessagesForOllama()).toEqual([]);
    });

    it("clears scenario and topic metadata", () => {
      store.init("casual", "weather", "System");

      store.reset();

      expect(store.getMetadata()).toEqual({ scenario: "", topic: "" });
    });

    it("is idempotent", () => {
      store.init("casual", "weather", "System");
      store.reset();
      store.reset(); // Second reset should not throw

      expect(store.getMessagesForOllama()).toEqual([]);
      expect(store.getMetadata()).toEqual({ scenario: "", topic: "" });
    });

    it("does nothing on empty store", () => {
      store.reset(); // No session exists

      expect(store.getMessagesForOllama()).toEqual([]);
      expect(store.isActive()).toBe(false);
    });
  });

  describe("isActive()", () => {
    it("returns false when store is empty", () => {
      expect(store.isActive()).toBe(false);
    });

    it("returns true after init", () => {
      store.init("casual", "weather", "System");
      expect(store.isActive()).toBe(true);
    });

    it("returns false after reset", () => {
      store.init("casual", "weather", "System");
      store.reset();
      expect(store.isActive()).toBe(false);
    });
  });

  describe("getMetadata()", () => {
    it("returns current scenario and topic", () => {
      store.init("debate", "AI ethics", "System");
      expect(store.getMetadata()).toEqual({ scenario: "debate", topic: "AI ethics" });
    });

    it("returns empty strings when store is empty", () => {
      expect(store.getMetadata()).toEqual({ scenario: "", topic: "" });
    });
  });
});
