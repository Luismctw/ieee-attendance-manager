import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

async function authorized() {
  return (await cookies()).get("admin_session")?.value === "authenticated";
}

export async function PATCH(request: Request) {
  if (!(await authorized()) || !supabase) return Response.json({ error: "No autorizado." }, { status: 401 });
  const student = await request.json().catch(() => null);
  if (!student?.control) return Response.json({ error: "El control es obligatorio." }, { status: 400 });
  const { error } = await supabase.rpc("admin_upsert_student", { p_pin: process.env.ADMIN_PIN ?? "", p_student: student });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await authorized()) || !supabase) return Response.json({ error: "No autorizado." }, { status: 401 });
  const control = new URL(request.url).searchParams.get("control");
  if (!control) return Response.json({ error: "El control es obligatorio." }, { status: 400 });
  const { error } = await supabase.rpc("admin_delete_student", { p_pin: process.env.ADMIN_PIN ?? "", p_control: control });
  return error ? Response.json({ error: error.message }, { status: 400 }) : Response.json({ ok: true });
}
