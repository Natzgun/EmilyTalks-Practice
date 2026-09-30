/**
 * Conversation context metadata.
 * Tracks the scenario and topic associated with the current session.
 * Ported from the Java backend's ConversationContext.
 */

export interface ConversationContext {
  scenario: string;
  topic: string;
  createdAt: number;
}

/**
 * Create a new conversation context.
 */
export function createContext(scenario: string, topic: string): ConversationContext {
  return {
    scenario,
    topic,
    createdAt: Date.now(),
  };
}

/**
 * Validate that a context has the required fields.
 */
export function isValidContext(ctx: ConversationContext): boolean {
  return !!(ctx.scenario && ctx.topic);
}
