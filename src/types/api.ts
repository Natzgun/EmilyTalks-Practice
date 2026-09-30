export interface PrepareAgentRequest {
  scenario: string;
  topic: string;
}

export interface ConverseRequest {
  message: string;
}

export interface TranscribeResponse {
  text: string;
}

export interface SynthesizeRequest {
  text: string;
  voice?: string;
}
