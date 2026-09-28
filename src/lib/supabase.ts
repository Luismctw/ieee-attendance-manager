import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

export type DatabaseMeeting = {
  id: string;
  title: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  place: string;
  status: "active" | "scheduled";
  qr_data_url: string | null;
};

export type DatabaseStudent = {
  id?: string;
  name: string;
  control: string;
  email: string;
  career: string;
  group_name: string;
  subject: string;
  professor: string;
  start_time: string;
  end_time: string;
  pin_hash?: string | null;
};

export type DatabaseAttendance = {
  id: string;
  meeting_id: string;
  student_id: string;
  attended_at: string;
  meetings?: { title: string; meeting_date: string } | null;
  students?: { name: string; control: string; group_name: string | null } | null;
};

export type DatabaseJustification = {
  id: string;
  meeting_id: string;
  student_id: string;
  subject: string;
  group_name: string | null;
  professor: string | null;
  overlap_start: string;
  overlap_end: string;
  overlap_minutes: number;
  note: string | null;
  students?: { name: string; control: string } | null;
};
