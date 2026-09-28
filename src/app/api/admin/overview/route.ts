import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const { data, error } = await supabase.rpc("admin_overview", { p_pin: process.env.ADMIN_PIN ?? "" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(request: Request) {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "authenticated") return Response.json({ error: "No autorizado." }, { status: 401 });
  if (!supabase) return Response.json({ error: "Supabase no está configurado." }, { status: 503 });
  const body = await request.json().catch(() => null) as { id?: unknown; note?: unknown } | null;
  if (typeof body?.id !== "string" || typeof body.note !== "string") return Response.json({ error: "id y note son obligatorios." }, { status: 400 });
  const { error } = await supabase.rpc("admin_update_justification", { p_pin: process.env.ADMIN_PIN ?? "", p_id: body.id, p_note: body.note.trim() });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
