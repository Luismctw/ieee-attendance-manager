import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { control?: unknown; pin?: unknown } | null;
  if (typeof body?.control !== "string" || typeof body.pin !== "string" || !body.control.trim() || !/^\d{4,12}$/.test(body.pin)) {
    return Response.json({ error: "Número de control y PIN válido son obligatorios." }, { status: 400 });
  }
  const { data, error } = await supabase.rpc("student_login", { p_control: body.control.trim(), p_pin: body.pin });
  if (error || !data?.token) return Response.json({ error: "Control o PIN incorrecto." }, { status: 401 });
  const token = data.token as string;
  (await cookies()).set("student_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return Response.json({ ok: true, student: { name: data.name, control: data.control } });
}
