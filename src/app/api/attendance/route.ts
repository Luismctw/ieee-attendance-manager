import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { meetingId?: unknown; control?: unknown } | null;
  if (typeof body?.meetingId !== "string") {
    return Response.json({ error: "meetingId es obligatorio." }, { status: 400 });
  }
  const token = (await cookies()).get("student_session")?.value;
  if (!token) return Response.json({ error: "Debes iniciar sesión como alumno." }, { status: 401 });
  const { data, error } = await supabase.rpc("register_student_attendance", { p_token: token, p_meeting_id: body.meetingId });
  if (error) return Response.json({ error: error.message }, { status: error.code === "23505" ? 409 : 400 });
  return Response.json({ ok: true, student: { name: data.name, control: data.control } });
}
