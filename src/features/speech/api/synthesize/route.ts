import { synthesize as workerSynthesize } from "@/features/speech/lib/speech-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json(
        { error: "text is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const { voice } = body;
    const audioBlob = await workerSynthesize(text.trim(), voice);
    return new Response(audioBlob, {
      headers: { "Content-Type": "audio/wav" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("PYTHON_WORKER_PORT")) {
      return Response.json(
        { error: "Speech worker unavailable" },
        { status: 503 },
      );
    }
    return Response.json(
      { error: `Synthesis failed: ${message}` },
      { status: 502 },
    );
  }
}
