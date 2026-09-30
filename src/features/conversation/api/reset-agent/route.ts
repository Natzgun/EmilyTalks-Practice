import { store } from "@/features/conversation/lib/conversation-store";

export async function POST() {
  store.reset();
  return Response.json({ status: "reset" });
}
