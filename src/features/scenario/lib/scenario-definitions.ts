/**
 * Scenario definitions.
 * Central source of truth for all conversation scenarios.
 * Each scenario has metadata for UI display and a system prompt builder.
 *
 * Scenario IDs MUST match the keys used in system-prompt.ts.
 */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "casual",
    name: "Casual Conversation",
    description: "Practice everyday conversations in a friendly, relaxed setting.",
    icon: "💬",
  },
  {
    id: "interview",
    name: "Job Interview",
    description: "Prepare for job interviews with realistic practice questions.",
    icon: "💼",
  },
  {
    id: "education",
    name: "Education",
    description: "Learn new topics with a patient, structured tutor.",
    icon: "📚",
  },
  {
    id: "storytelling",
    name: "Storytelling",
    description: "Co-create imaginative stories with a creative AI partner.",
    icon: "📖",
  },
  {
    id: "debate",
    name: "Debate",
    description: "Sharpen your argumentation skills with respectful debate.",
    icon: "⚖️",
  },
];

/**
 * Get a scenario by its ID.
 */
export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
