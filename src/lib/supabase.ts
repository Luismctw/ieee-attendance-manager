import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
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
};
