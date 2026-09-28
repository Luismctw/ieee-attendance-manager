import { supabase } from "@/lib/supabase";

function mexicoNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

export async function POST(request: Request) {
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { meetingId?: unknown; control?: unknown } | null;
  if (typeof body?.meetingId !== "string" || typeof body.control !== "string" || !body.control.trim()) {
    return Response.json({ error: "meetingId y control son obligatorios." }, { status: 400 });
  }

  const [{ data: meeting, error: meetingError }, { data: student, error: studentError }] = await Promise.all([
    supabase.from("meetings").select("id,title,meeting_date,start_time,end_time,status").eq("id", body.meetingId).single(),
    supabase.from("students").select("id,name,control").eq("control", body.control.trim()).single(),
  ]);
  if (meetingError || !meeting) return Response.json({ error: "La junta no existe." }, { status: 404 });
  if (studentError || !student) return Response.json({ error: "El alumno no está en el padrón." }, { status: 404 });

  const now = mexicoNow();
  const currentDate = `${now.year}-${now.month}-${now.day}`;
  const currentTime = `${now.hour}:${now.minute}:00`;
  if (meeting.status !== "active" || meeting.meeting_date !== currentDate || currentTime < meeting.start_time || currentTime > meeting.end_time) {
    return Response.json({ error: "La junta no está dentro de su horario de registro." }, { status: 409 });
  }

  const { error } = await supabase.from("attendances").insert({ meeting_id: meeting.id, student_id: student.id });
  if (error?.code === "23505") return Response.json({ error: "Esta asistencia ya estaba registrada." }, { status: 409 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, student: { name: student.name, control: student.control } });
}
