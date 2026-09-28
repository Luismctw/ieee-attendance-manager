import { cookies } from "next/headers";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { hashSessionToken } from "@/lib/student-auth";

export async function POST() {
  const store = await cookies();
  const token = store.get("student_session")?.value;
  if (token && supabase) await supabase.from("student_sessions").delete().eq("token_hash", hashSessionToken(token));
  store.delete("student_session");
  return Response.json({ ok: true });
}
