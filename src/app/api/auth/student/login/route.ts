import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { hashSessionToken, verifyStudentPin } from "@/lib/student-auth";

export async function POST(request: Request) {
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { control?: unknown; pin?: unknown } | null;
  if (typeof body?.control !== "string" || typeof body.pin !== "string" || !body.control.trim() || !/^\d{4,12}$/.test(body.pin)) {
    return Response.json({ error: "Número de control y PIN válido son obligatorios." }, { status: 400 });
  }
  const { data: student } = await supabase.from("students").select("id,name,control,pin_hash").eq("control", body.control.trim()).single();
  if (!student?.pin_hash || !verifyStudentPin(body.pin, student.pin_hash)) return Response.json({ error: "Control o PIN incorrecto." }, { status: 401 });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString();
  const { error } = await supabase.from("student_sessions").insert({ student_id: student.id, token_hash: hashSessionToken(token), expires_at: expiresAt });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  (await cookies()).set("student_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return Response.json({ ok: true, student: { name: student.name, control: student.control } });
}
