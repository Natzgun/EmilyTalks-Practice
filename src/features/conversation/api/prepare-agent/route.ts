import { store } from "@/features/conversation/lib/conversation-store";
import { buildSystemPrompt } from "@/features/conversation/lib/system-prompt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenario, topic } = body;

    if (!scenario || !topic) {
      return Response.json(
        { error: "scenario and topic are required" },
        { status: 400 },
      );
    }

    const systemPrompt = buildSystemPrompt(scenario, topic);
    store.init(scenario, topic, systemPrompt);

    return Response.json({ status: "prepared" });
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
