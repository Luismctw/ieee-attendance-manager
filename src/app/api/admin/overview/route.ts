import { cookies } from "next/headers";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET() {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY no está configurada." }, { status: 503 });

  const [{ data: attendances, error: attendanceError }, { data: justifications, error: justificationError }] = await Promise.all([
    supabase.from("attendances").select("id,meeting_id,student_id,attended_at,meetings(title,meeting_date),students(name,control,group_name)").order("attended_at", { ascending: false }),
    supabase.from("justifications").select("id,meeting_id,student_id,subject,group_name,professor,overlap_start,overlap_end,overlap_minutes,note,students(name,control)").order("created_at", { ascending: false }),
  ]);
  if (attendanceError || justificationError) return Response.json({ error: attendanceError?.message ?? justificationError?.message }, { status: 500 });
  return Response.json({ attendances: attendances ?? [], justifications: justifications ?? [] });
}

export async function PATCH(request: Request) {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY no está configurada." }, { status: 503 });
  const body = await request.json().catch(() => null) as { id?: unknown; note?: unknown } | null;
  if (typeof body?.id !== "string" || typeof body.note !== "string") return Response.json({ error: "id y note son obligatorios." }, { status: 400 });
  const { error } = await supabase.from("justifications").update({ note: body.note.trim() }).eq("id", body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
