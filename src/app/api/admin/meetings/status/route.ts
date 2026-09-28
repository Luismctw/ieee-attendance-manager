import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated" || !supabase) return Response.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as { meetingId?: unknown; status?: unknown } | null;
  if (typeof body?.meetingId !== "string" || typeof body.status !== "string") return Response.json({ error: "Datos incompletos." }, { status: 400 });
  const { error } = await supabase.rpc("admin_set_meeting_status", { p_pin: process.env.ADMIN_PIN ?? "", p_meeting_id: body.meetingId, p_status: body.status });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
