/**
 * In-memory conversation store (singleton for single-user dev mode).
 * Maintains full message history and applies truncation when MAX_MESSAGES is exceeded.
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 10;

class ConversationStore {
  private messages: Message[] = [];
  private scenario: string = "";
  private topic: string = "";

  /**
   * Initialize a new conversation session.
   * Prepends the system prompt as the first message.
   */
  init(scenario: string, topic: string, systemPrompt: string): void {
    this.scenario = scenario;
    this.topic = topic;
    this.messages = [{ role: "system", content: systemPrompt }];
  }

  /**
   * Reset the store to a clean state. Idempotent.
   */
  reset(): void {
    this.messages = [];
    this.scenario = "";
    this.topic = "";
  }

  /**
   * Append a user or assistant message to the history.
   */
  addMessage(role: "user" | "assistant", content: string): void {
    this.messages.push({ role, content });
  }

  /**
   * Return the full message array for sending to Ollama.
   * Applies truncation if the history exceeds MAX_MESSAGES,
   * always preserving the system prompt at index 0.
   */
  getMessagesForOllama(): Message[] {
    if (this.messages.length <= MAX_MESSAGES) {
      return [...this.messages];
    }

    // Keep system prompt (index 0) + most recent MAX_MESSAGES-1 messages
    const keep = MAX_MESSAGES - 1;
    console.warn(
      `[conversation-store] Truncating messages: ${this.messages.length} → ${MAX_MESSAGES}`,
    );
    return [this.messages[0], ...this.messages.slice(-keep)];
  }

  /**
   * Returns true if a session has been initialized (has at least a system message).
   */
  isActive(): boolean {
    return this.messages.length > 0;
  }

  /**
   * Get the current scenario metadata (for debugging/logging).
   */
  getMetadata(): { scenario: string; topic: string } {
    return { scenario: this.scenario, topic: this.topic };
  }
}

// Singleton instance — single-user dev mode
export const store = new ConversationStore();
