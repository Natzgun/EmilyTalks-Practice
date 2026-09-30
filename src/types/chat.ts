export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
}

export type RecorderState = "idle" | "recording" | "transcribing";

export type InputState = "idle" | "recording" | "transcribing" | "sending";
