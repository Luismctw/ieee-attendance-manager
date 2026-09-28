import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

function minutes(time: string) {
  const [hours, mins] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + mins;
}

function asTime(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00`;
}

export async function POST(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "active") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { meetingId?: unknown } | null;
  if (typeof body?.meetingId !== "string") return Response.json({ error: "meetingId es obligatorio." }, { status: 400 });

  const [{ data: meeting, error: meetingError }, { data: attendanceRows, error: attendanceError }] = await Promise.all([
    supabase.from("meetings").select("id,start_time,end_time").eq("id", body.meetingId).single(),
    supabase.from("attendances").select("student_id").eq("meeting_id", body.meetingId),
  ]);
  if (meetingError || !meeting) return Response.json({ error: "La junta no existe." }, { status: 404 });
  if (attendanceError) return Response.json({ error: attendanceError.message }, { status: 500 });

  const ids = (attendanceRows ?? []).map((row) => row.student_id);
  if (!ids.length) return Response.json({ created: 0, message: "No hay asistencias registradas." });
  const { data: students, error: studentsError } = await supabase.from("students").select("*").in("id", ids);
  if (studentsError) return Response.json({ error: studentsError.message }, { status: 500 });

  const meetingStart = minutes(meeting.start_time);
  const meetingEnd = minutes(meeting.end_time);
  const justifications = (students ?? []).flatMap((student) => {
    if (!student.subject || !student.start_time || !student.end_time) return [];
    const start = Math.max(meetingStart, minutes(student.start_time));
    const end = Math.min(meetingEnd, minutes(student.end_time));
    if (end <= start) return [];
    return [{
      meeting_id: body.meetingId,
      student_id: student.id,
      subject: student.subject,
      group_name: student.group_name,
      professor: student.professor,
      overlap_start: asTime(start),
      overlap_end: asTime(end),
      overlap_minutes: end - start,
    }];
  });
  if (!justifications.length) return Response.json({ created: 0, message: "No se detectaron solapes de horario." });
  const { data, error } = await supabase.from("justifications").upsert(justifications, { onConflict: "meeting_id,student_id,subject" }).select();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ created: data?.length ?? justifications.length });
}
