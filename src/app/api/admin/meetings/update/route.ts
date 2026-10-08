import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated" || !supabase) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.meetingId !== "string" || typeof body.title !== "string" || typeof body.date !== "string" || typeof body.start !== "string" || typeof body.end !== "string" || typeof body.place !== "string") {
    return Response.json({ error: "Todos los datos de la junta son obligatorios." }, { status: 400 });
  }
  const { error } = await supabase.rpc("admin_update_meeting", {
    p_pin: process.env.ADMIN_PIN ?? "",
    p_meeting_id: body.meetingId,
    p_title: body.title,
    p_meeting_date: body.date,
    p_start_time: body.start,
    p_end_time: body.end,
    p_place: body.place,
  });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
