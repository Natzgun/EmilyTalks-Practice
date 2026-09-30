import { transcribe as workerTranscribe } from "@/features/speech/lib/speech-client";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return Response.json(
        { error: "No audio file provided. Use FormData with field 'file'." },
        { status: 400 },
      );
    }

    const result = await workerTranscribe(file);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("PYTHON_WORKER_PORT")) {
      return Response.json(
        { error: "Speech worker unavailable" },
        { status: 503 },
      );
    }
    return Response.json(
      { error: `Transcription failed: ${message}` },
      { status: 502 },
    );
  }
}
