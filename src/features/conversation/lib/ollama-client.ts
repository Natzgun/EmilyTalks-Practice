/**
 * Shared Ollama client configuration.
 * Reads from environment variables with sensible defaults for dev mode.
 */

export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
