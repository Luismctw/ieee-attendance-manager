import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { meetingId?: unknown } | null;
  if (typeof body?.meetingId !== "string") return Response.json({ error: "meetingId es obligatorio." }, { status: 400 });
  const { error } = await supabase.rpc("admin_close_meeting", { p_pin: process.env.ADMIN_PIN ?? "", p_meeting_id: body.meetingId });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
