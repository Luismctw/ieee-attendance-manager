import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const store = await cookies();
  const token = store.get("student_session")?.value;
  if (token && supabase) await supabase.rpc("student_logout", { p_token: token });
  store.delete("student_session");
  return Response.json({ ok: true });
}
