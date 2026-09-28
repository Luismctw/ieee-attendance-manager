import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const token = (await cookies()).get("student_session")?.value;
  if (!token || !supabase) return Response.json({ error: "Sesión no válida." }, { status: 401 });
  const body = await request.json().catch(() => null) as { pin?: unknown } | null;
  if (typeof body?.pin !== "string") return Response.json({ error: "PIN obligatorio." }, { status: 400 });
  const { error } = await supabase.rpc("student_change_pin", { p_token: token, p_new_pin: body.pin });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
