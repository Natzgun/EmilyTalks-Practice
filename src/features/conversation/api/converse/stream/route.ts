import { store } from "@/features/conversation/lib/conversation-store";
import { OLLAMA_URL, OLLAMA_MODEL } from "@/features/conversation/lib/ollama-client";

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

  const encoder = new TextEncoder();
  let fullResponse = "";

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: store.getMessagesForOllama(),
        stream: true,
        options: {
          num_predict: 80,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });
  } catch {
    // Ollama unreachable — send error via SSE and close
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data:${JSON.stringify({ error: "Ollama unavailable" })}\n\n`));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data:${JSON.stringify({ error: "Ollama unavailable" })}\n\n`));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaRes.body!.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          // Ollama returns NDJSON: one JSON object per line
          for (const line of text.split("\n")) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              const content = parsed.message?.content;
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(`data:${content}\n\n`));
              }
            } catch {
              // Skip malformed NDJSON lines
            }
          }
        }
        // Append the full assistant response to the store
        if (fullResponse) {
          store.addMessage("assistant", fullResponse);
        }
        controller.enqueue(encoder.encode("data:[DONE]\n\n"));
      } catch {
        controller.enqueue(encoder.encode("data:[ERROR]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
