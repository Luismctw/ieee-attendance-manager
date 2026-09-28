import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if ((await cookies()).get("admin_session")?.value !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { control?: unknown; pin?: unknown } | null;
  if (typeof body?.control !== "string" || typeof body.pin !== "string") return Response.json({ error: "Control y PIN son obligatorios." }, { status: 400 });
  const { error } = await supabase.rpc("admin_set_student_pin", { p_pin: process.env.ADMIN_PIN ?? "", p_control: body.control, p_student_pin: body.pin });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ ok: true });
}
