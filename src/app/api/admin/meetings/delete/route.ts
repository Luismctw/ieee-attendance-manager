import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function DELETE(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated" || !supabase) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as { meetingId?: unknown } | null;
  if (typeof body?.meetingId !== "string") return Response.json({ error: "meetingId es obligatorio." }, { status: 400 });
  const { error } = await supabase.rpc("admin_delete_meeting", {
    p_pin: process.env.ADMIN_PIN ?? "",
    p_meeting_id: body.meetingId,
  });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
