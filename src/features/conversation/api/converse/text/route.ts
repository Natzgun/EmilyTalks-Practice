import { store } from "@/features/conversation/lib/conversation-store";
import { OLLAMA_URL, OLLAMA_MODEL } from "@/features/conversation/lib/ollama-client";
import type { OllamaChatResponse } from "@/features/conversation/types/ollama";

export async function POST(req: Request) {
  if (!store.isActive()) {
    return Response.json(
      { error: "No active session. Call prepare-agent first." },
      { status: 400 },
    );
  }

  let body: { message: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  store.addMessage("user", body.message);

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: store.getMessagesForOllama(),
        stream: false,
        options: {
          num_predict: 80,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    if (!ollamaRes.ok) {
      return Response.json(
        { error: "Ollama request failed" },
        { status: 502 },
      );
    }

    const data = (await ollamaRes.json()) as OllamaChatResponse;
    const assistantMessage = data.message?.content ?? "";

    if (assistantMessage) {
      store.addMessage("assistant", assistantMessage);
    }

    return Response.json({ message: assistantMessage });
  } catch {
    return Response.json(
      { error: "Ollama request failed" },
      { status: 502 },
    );
  }
}
