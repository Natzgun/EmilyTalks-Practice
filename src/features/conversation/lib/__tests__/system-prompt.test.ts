import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  getAvailableScenarios,
} from "@/features/conversation/lib/system-prompt";

describe("buildSystemPrompt", () => {
  describe("casual scenario", () => {
    it("generates a prompt with the topic interpolated", () => {
      const prompt = buildSystemPrompt("casual", "travel");
      expect(prompt).toContain("Emily");
      expect(prompt).toContain('"travel"');
      expect(prompt).toContain("friendly");
      expect(prompt).toContain("Write in clear, natural spoken English");
    });

    it("contains behavioral instructions", () => {
      const prompt = buildSystemPrompt("casual", "hobbies");
      expect(prompt).toContain("Ask follow-up questions");
      expect(prompt).toContain("natural, warm, and engaging");
    });
  });

  describe("interview scenario", () => {
    it("generates a prompt with the topic interpolated", () => {
      const prompt = buildSystemPrompt("interview", "software engineering");
      expect(prompt).toContain("Emily");
      expect(prompt).toContain('"software engineering"');
      expect(prompt).toContain("professional job interviewer");
    });

    it("contains interview-specific instructions", () => {
      const prompt = buildSystemPrompt("interview", "product management");
      expect(prompt).toContain("structured interview questions");
      expect(prompt).toContain("constructive feedback");
      expect(prompt).toContain("professional but encouraging");
    });
  });

  describe("education scenario", () => {
    it("generates a prompt with the topic interpolated", () => {
      const prompt = buildSystemPrompt("education", "calculus");
      expect(prompt).toContain('"calculus"');
      expect(prompt).toContain("educational tutor");
    });

    it("contains education-specific instructions", () => {
      const prompt = buildSystemPrompt("education", "physics");
      expect(prompt).toContain("Explain concepts clearly with examples");
      expect(prompt).toContain("Encourage the student to think critically");
      expect(prompt).toContain("Break down complex ideas");
    });
  });

  describe("storytelling scenario", () => {
    it("generates a prompt with the topic interpolated", () => {
      const prompt = buildSystemPrompt("storytelling", "space adventure");
      expect(prompt).toContain('"space adventure"');
      expect(prompt).toContain("creative storyteller");
    });

    it("contains storytelling-specific instructions", () => {
      const prompt = buildSystemPrompt("storytelling", "fantasy");
      expect(prompt).toContain("vivid, imaginative narratives");
      expect(prompt).toContain("Invite the user to contribute");
      expect(prompt).toContain("build suspense");
    });
  });

  describe("debate scenario", () => {
    it("generates a prompt with the topic interpolated", () => {
      const prompt = buildSystemPrompt("debate", "climate policy");
      expect(prompt).toContain('"climate policy"');
      expect(prompt).toContain("debate partner");
    });

    it("contains debate-specific instructions", () => {
      const prompt = buildSystemPrompt("debate", "AI regulation");
      expect(prompt).toContain("well-reasoned arguments and counterarguments");
      expect(prompt).toContain("Challenge the user's thinking respectfully");
      expect(prompt).toContain("evidence-based discussion");
    });
  });

  describe("fallback for unknown scenario", () => {
    it("returns a generic prompt when scenario is not recognized", () => {
      const prompt = buildSystemPrompt("unknown_scenario", "some topic");
      expect(prompt).toContain("Emily, a friendly AI assistant");
      expect(prompt).toContain('"some topic"');
      expect(prompt).toContain('"unknown_scenario"');
    });

    it("includes the Unknown scenario key and topic in the message", () => {
      const prompt = buildSystemPrompt("random123", "gardening");
      expect(prompt).toContain("gardening");
      expect(prompt).toContain("random123");
    });
  });

  describe("prompt quality", () => {
    const scenarios = ["casual", "interview", "education", "storytelling", "debate"] as const;

    for (const scenario of scenarios) {
      it(`${scenario} prompt is non-empty`, () => {
        const prompt = buildSystemPrompt(scenario, "test topic");
        expect(prompt.length).toBeGreaterThan(50);
      });

      it(`${scenario} prompt always includes language instruction`, () => {
        const prompt = buildSystemPrompt(scenario, "test topic");
      expect(prompt).toContain("Write in clear, natural spoken English");
      });

      it(`${scenario} prompt contains "Emily" as the assistant name`, () => {
        const prompt = buildSystemPrompt(scenario, "test topic");
        expect(prompt).toContain("Emily");
      });
    }
  });
});

describe("getAvailableScenarios", () => {
  it("returns all five scenario keys", () => {
    const scenarios = getAvailableScenarios();
    expect(scenarios).toContain("casual");
    expect(scenarios).toContain("interview");
    expect(scenarios).toContain("education");
    expect(scenarios).toContain("storytelling");
    expect(scenarios).toContain("debate");
    expect(scenarios).toHaveLength(5);
  });
});
