create extension if not exists "pgcrypto";

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  start_time time not null,
  end_time time not null,
  place text not null,
  status text not null default 'scheduled' check (status in ('active', 'scheduled', 'closed', 'cancelled')),
  qr_data_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  control text not null unique,
  email text,
  career text,
  group_name text,
  subject text,
  professor text,
  start_time time,
  end_time time,
  pin_hash text,
  created_at timestamptz not null default now()
);

alter table public.students add column if not exists pin_hash text;

create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attended_at timestamptz not null default now(),
  unique (meeting_id, student_id)
);

create table if not exists public.justifications (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject text not null,
  group_name text,
  professor text,
  overlap_start time not null,
  overlap_end time not null,
  overlap_minutes integer not null,
  note text,
  created_at timestamptz not null default now(),
  unique (meeting_id, student_id, subject)
);

alter table public.meetings enable row level security;
alter table public.students enable row level security;
alter table public.attendances enable row level security;
alter table public.justifications enable row level security;
alter table public.student_sessions enable row level security;

create policy "public can read meetings" on public.meetings for select to anon, authenticated using (true);
create policy "public can create meetings" on public.meetings for insert to anon, authenticated with check (true);
create policy "public can update meetings" on public.meetings for update to anon, authenticated using (true) with check (true);

create policy "public can read students" on public.students for select to anon, authenticated using (true);
create policy "public can create students" on public.students for insert to anon, authenticated with check (true);
create policy "public can update students" on public.students for update to anon, authenticated using (true) with check (true);

create policy "public can read attendances" on public.attendances for select to anon, authenticated using (true);
create policy "public can create attendances" on public.attendances for insert to anon, authenticated with check (true);
create policy "public can read justifications" on public.justifications for select to anon, authenticated using (true);
create policy "public can create justifications" on public.justifications for insert to anon, authenticated with check (true);
create policy "public can update justifications" on public.justifications for update to anon, authenticated using (true) with check (true);

create index if not exists meetings_date_idx on public.meetings (meeting_date);
create index if not exists students_control_idx on public.students (control);
create index if not exists justifications_meeting_idx on public.justifications (meeting_id);
create index if not exists student_sessions_token_idx on public.student_sessions (token_hash);
create index if not exists student_sessions_expiry_idx on public.student_sessions (expires_at);
