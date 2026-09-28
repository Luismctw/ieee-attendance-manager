create extension if not exists pgcrypto;

alter table public.meetings drop constraint if exists meetings_status_check;
alter table public.meetings add constraint meetings_status_check check (status in ('active', 'scheduled', 'closed'));

create table if not exists public.admin_settings (
  id boolean primary key default true check (id),
  pin_hash text not null
);

insert into public.admin_settings (id, pin_hash)
values (true, extensions.crypt('7551', extensions.gen_salt('bf')))
on conflict (id) do nothing;

alter table public.admin_settings enable row level security;

create or replace function public.student_login(p_control text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  student_row students%rowtype;
  token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  select * into student_row from students
  where control = trim(p_control) and pin_hash is not null
    and pin_hash = extensions.crypt(p_pin, pin_hash);
  if not found then raise exception 'Credenciales inválidas' using errcode = '28P01'; end if;
  delete from student_sessions where expires_at < now();
  insert into student_sessions (student_id, token_hash, expires_at)
  values (student_row.id, encode(extensions.digest(token, 'sha256'::text), 'hex'), now() + interval '12 hours');
  return jsonb_build_object('token', token, 'name', student_row.name, 'control', student_row.control);
end;
$$;

create or replace function public.student_logout(p_token text)
returns void language sql security definer set search_path = public
as $$ delete from student_sessions where token_hash = encode(extensions.digest(p_token, 'sha256'::text), 'hex'); $$;

create or replace function public.register_student_attendance(p_token text, p_meeting_id uuid)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  session_row student_sessions%rowtype;
  meeting_row meetings%rowtype;
  student_row students%rowtype;
begin
  select * into session_row from student_sessions
  where token_hash = encode(extensions.digest(p_token, 'sha256'::text), 'hex') and expires_at > now();
  if not found then raise exception 'Sesión expirada' using errcode = '28000'; end if;
  select * into meeting_row from meetings where id = p_meeting_id;
  if not found then raise exception 'La junta no existe'; end if;
  if meeting_row.status <> 'active' or meeting_row.meeting_date <> (now() at time zone 'America/Mexico_City')::date
    or (now() at time zone 'America/Mexico_City')::time < meeting_row.start_time
    or (now() at time zone 'America/Mexico_City')::time > meeting_row.end_time then
    raise exception 'La junta no está dentro de su horario';
  end if;
  select * into student_row from students where id = session_row.student_id;
  insert into attendances (meeting_id, student_id) values (p_meeting_id, student_row.id);
  return jsonb_build_object('name', student_row.name, 'control', student_row.control);
end;
$$;

create or replace function public.admin_pin_valid(p_pin text)
returns boolean language sql security definer set search_path = public
as $$ select exists (select 1 from admin_settings where id and pin_hash = extensions.crypt(p_pin, pin_hash)); $$;

create or replace function public.admin_import_students(p_pin text, p_students jsonb)
returns integer language plpgsql security definer set search_path = public
as $$
declare item jsonb; total integer := 0;
begin
  if not admin_pin_valid(p_pin) then raise exception 'No autorizado' using errcode = '42501'; end if;
  for item in select * from jsonb_array_elements(p_students) loop
    insert into students (name, control, email, career, group_name, subject, professor, start_time, end_time, pin_hash)
    values (coalesce(item->>'name', 'Sin nombre'), item->>'control', coalesce(item->>'email',''), coalesce(item->>'career',''),
      coalesce(item->>'group',''), coalesce(item->>'subject',''), coalesce(item->>'professor',''),
      nullif(item->>'start','')::time, nullif(item->>'end',''),
      case when coalesce(item->>'pin','') <> '' then extensions.crypt(item->>'pin', extensions.gen_salt('bf')) else null end)
    on conflict (control) do update set name = excluded.name, email = excluded.email, career = excluded.career,
      group_name = excluded.group_name, subject = excluded.subject, professor = excluded.professor,
      start_time = excluded.start_time, end_time = excluded.end_time,
      pin_hash = coalesce(excluded.pin_hash, students.pin_hash);
    total := total + 1;
  end loop;
  return total;
end;
$$;

create or replace function public.admin_overview(p_pin text)
returns jsonb language plpgsql security definer set search_path = public
as $$
begin
  if not admin_pin_valid(p_pin) then raise exception 'No autorizado' using errcode = '42501'; end if;
  return jsonb_build_object(
    'attendances', coalesce((select jsonb_agg(to_jsonb(a) || jsonb_build_object('meetings', to_jsonb(m), 'students', to_jsonb(s))) from attendances a join meetings m on m.id=a.meeting_id join students s on s.id=a.student_id), '[]'::jsonb),
    'justifications', coalesce((select jsonb_agg(to_jsonb(j) || jsonb_build_object('students', jsonb_build_object('name',s.name,'control',s.control))) from justifications j join students s on s.id=j.student_id), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_update_justification(p_pin text, p_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not admin_pin_valid(p_pin) then raise exception 'No autorizado' using errcode = '42501'; end if;
  update justifications set note = trim(p_note) where id = p_id;
end; $$;

create or replace function public.admin_close_meeting(p_pin text, p_meeting_id uuid)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not admin_pin_valid(p_pin) then raise exception 'No autorizado' using errcode = '42501'; end if;
  update meetings set status = 'closed' where id = p_meeting_id;
end; $$;

create or replace function public.admin_set_student_pin(p_pin text, p_control text, p_student_pin text)
returns void language plpgsql security definer set search_path = public
as $$ begin
  if not admin_pin_valid(p_pin) then raise exception 'No autorizado' using errcode = '42501'; end if;
  if p_student_pin !~ '^[0-9]{4,12}$' then raise exception 'El PIN debe tener de 4 a 12 dígitos'; end if;
  update students set pin_hash = extensions.crypt(p_student_pin, extensions.gen_salt('bf'))
  where control = trim(p_control);
  if not found then raise exception 'Alumno no encontrado'; end if;
end; $$;

create or replace function public.admin_generate_justifications(p_pin text, p_meeting_id uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare total integer;
begin
  if not admin_pin_valid(p_pin) then raise exception 'No autorizado' using errcode = '42501'; end if;
  insert into justifications (meeting_id, student_id, subject, group_name, professor, overlap_start, overlap_end, overlap_minutes)
  select a.meeting_id, s.id, s.subject, s.group_name, s.professor,
    greatest(m.start_time,s.start_time), least(m.end_time,s.end_time),
    extract(epoch from (least(m.end_time,s.end_time)-greatest(m.start_time,s.start_time)))::integer/60
  from attendances a join students s on s.id=a.student_id join meetings m on m.id=a.meeting_id
  where a.meeting_id=p_meeting_id and s.subject is not null and s.subject <> '' and s.start_time is not null and s.end_time is not null
    and least(m.end_time,s.end_time) > greatest(m.start_time,s.start_time)
  on conflict (meeting_id,student_id,subject) do update set overlap_start=excluded.overlap_start, overlap_end=excluded.overlap_end, overlap_minutes=excluded.overlap_minutes;
  get diagnostics total = row_count;
  return total;
end; $$;

grant execute on function public.student_login(text,text) to anon, authenticated;
grant execute on function public.student_logout(text) to anon, authenticated;
grant execute on function public.register_student_attendance(text,uuid) to anon, authenticated;
grant execute on function public.admin_import_students(text,jsonb) to anon, authenticated;
grant execute on function public.admin_overview(text) to anon, authenticated;
grant execute on function public.admin_update_justification(text,uuid,text) to anon, authenticated;
grant execute on function public.admin_generate_justifications(text,uuid) to anon, authenticated;
grant execute on function public.admin_close_meeting(text,uuid) to anon, authenticated;
grant execute on function public.admin_set_student_pin(text,text,text) to anon, authenticated;
