import { cookies } from "next/headers";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { hashStudentPin } from "@/lib/student-auth";

export async function POST(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { students?: Array<Record<string, unknown>> } | null;
  if (!Array.isArray(body?.students) || !body.students.length) return Response.json({ error: "No hay alumnos para importar." }, { status: 400 });
  const rows = body.students.map((student) => {
    const pin = typeof student.pin === "string" ? student.pin : "";
    return {
      name: String(student.name ?? "Sin nombre"),
      control: String(student.control ?? ""),
      email: String(student.email ?? ""),
      career: String(student.career ?? ""),
      group_name: String(student.group ?? ""),
      subject: String(student.subject ?? ""),
      professor: String(student.professor ?? ""),
      start_time: String(student.start ?? "") || null,
      end_time: String(student.end ?? "") || null,
      ...(pin ? { pin_hash: hashStudentPin(pin) } : {}),
    };
  }).filter((student) => student.control);
  const { error } = await supabase.from("students").upsert(rows, { onConflict: "control" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ imported: rows.length });
}
