import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { students?: Array<Record<string, unknown>> } | null;
  if (!Array.isArray(body?.students) || !body.students.length) return Response.json({ error: "No hay alumnos para importar." }, { status: 400 });
  const { data, error } = await supabase.rpc("admin_import_students", { p_pin: process.env.ADMIN_PIN ?? "", p_students: body.students });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ imported: data ?? 0 });
}
