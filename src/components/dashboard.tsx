"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { DatabaseMeeting, DatabaseStudent, supabase } from "@/lib/supabase";

type Meeting = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  place: string;
  status: "active" | "scheduled";
  qrDataUrl?: string;
};

type Student = {
  name: string;
  control: string;
  email: string;
  career: string;
  group: string;
  subject?: string;
  professor?: string;
  start?: string;
  end?: string;
};

const MEETINGS_KEY = "ieee-attendance-meetings";
const STUDENTS_KEY = "ieee-attendance-students";

export function AdminLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!response.ok) {
      setError(response.status === 503 ? "El acceso no está configurado en el servidor." : "PIN incorrecto. Inténtalo nuevamente.");
      setPin("");
      return;
    }
    window.location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
        <form onSubmit={submit} className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-violet-950/20">
          <Link href="/" className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">IEEE Attendance Manager</Link>
          <h1 className="mt-6 text-3xl font-semibold text-white">Acceso administrador</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Introduce el PIN de administración para continuar.</p>
          <label className="mt-8 block text-sm text-slate-300">PIN
            <input autoFocus inputMode="numeric" maxLength={12} type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-violet-400" placeholder="••••" />
          </label>
          {error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
          <button disabled={loading || pin.length < 4} className="mt-6 w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Validando..." : "Entrar al panel"}</button>
        </form>
      </div>
    </main>
  );
}

export function Shell({ role, children }: { role: "student" | "admin"; children: React.ReactNode }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><Link href="/" className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">IEEE Attendance Manager</Link><h1 className="mt-3 text-3xl font-semibold text-white">{role === "student" ? "Mi asistencia" : "Panel de administración"}</h1></div>
            <nav className="flex flex-wrap items-center gap-2 rounded-full border border-slate-700 bg-slate-950 p-1">
              <Link href="/alumno" className={`rounded-full px-4 py-2 text-sm font-medium ${role === "student" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>Alumno</Link>
              <Link href="/admin" className={`rounded-full px-4 py-2 text-sm font-medium ${role === "admin" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>Administrador</Link>
              {role === "admin" ? <button onClick={logout} disabled={loggingOut} className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800">{loggingOut ? "Saliendo..." : "Salir"}</button> : <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800">Salir</Link>}
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function StudentDashboard() {
  const [meetings] = useState<Meeting[]>(() => readStorage<Meeting[]>(MEETINGS_KEY, []));
  const [students] = useState<Student[]>(() => readStorage<Student[]>(STUDENTS_KEY, []));
  const [cloudMeetings, setCloudMeetings] = useState<Meeting[]>([]);
  const [cloudStudents, setCloudStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!supabase) return;
    void Promise.all([
      supabase.from("meetings").select("*").order("meeting_date", { ascending: true }),
      supabase.from("students").select("*").order("name", { ascending: true }),
    ]).then(([meetingResult, studentResult]) => {
      if (!meetingResult.error) setCloudMeetings((meetingResult.data as DatabaseMeeting[]).map(fromDatabaseMeeting));
      if (!studentResult.error) setCloudStudents((studentResult.data as DatabaseStudent[]).map(fromDatabaseStudent));
    });
  }, []);

  const availableMeetings = cloudMeetings.length ? cloudMeetings : meetings;
  const availableStudents = cloudStudents.length ? cloudStudents : students;
  const activeMeeting = availableMeetings.find((meeting) => meeting.status === "active") ?? availableMeetings[0];
  const currentStudent = availableStudents[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Próxima junta" value={activeMeeting?.title ?? "Sin juntas"} subtitle={activeMeeting ? `${activeMeeting.date} · ${activeMeeting.start} - ${activeMeeting.end}` : "El administrador aún no ha creado una junta"} tone="cyan" />
        <StatCard title="Alumnos registrados" value={String(availableStudents.length)} subtitle={availableStudents.length ? "Padrón disponible" : "Carga el Excel para comenzar"} tone="emerald" />
        <StatCard title="Justificantes" value="0" subtitle="Se calcularán al registrar asistencia" tone="violet" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Registro</p><h2 className="mt-2 text-2xl font-semibold text-white">Escanear asistencia</h2></div><span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">{activeMeeting ? "QR disponible" : "Sin junta activa"}</span></div>
          {activeMeeting ? <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr]"><div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-white p-5"><Image src={activeMeeting.qrDataUrl ?? ""} alt="Código QR de asistencia" width={192} height={192} unoptimized /></div><div className="space-y-4"><div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Junta disponible</p><p className="mt-2 text-xl font-semibold text-white">{activeMeeting.title}</p><p className="mt-2 text-sm text-slate-300">{activeMeeting.date} · {activeMeeting.start} - {activeMeeting.end} · {activeMeeting.place}</p></div><div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Alumno identificado</p><p className="mt-2 font-semibold text-white">{currentStudent?.name ?? "Pendiente de importar padrón"}</p><p className="mt-1 text-sm text-slate-400">{currentStudent?.email ?? "Los alumnos aparecerán al cargar el Excel."}</p></div><button className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Registrar asistencia</button></div></div> : <EmptyState description="Cuando exista una junta activa, aquí aparecerá su QR para registrar la asistencia." />}</div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Actividad</p><EmptyState description="Tu historial de asistencia aparecerá aquí después del primer registro." /></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><EmptyPanel title="Mi asistencia" eyebrow="Historial" description="No hay registros de asistencia todavía." /><EmptyPanel title="Mis clases" eyebrow="Horario" description={currentStudent ? "Tu horario se tomará de los datos importados." : "El horario de clases se cargará desde el archivo de alumnos."} /></section>
    </div>
  );
}

export function AdminDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>(() => readStorage<Meeting[]>(MEETINGS_KEY, []));
  const [students, setStudents] = useState<Student[]>(() => readStorage<Student[]>(STUDENTS_KEY, []));
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<Student[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.from("meetings").select("*").order("meeting_date", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setMeetings((data as DatabaseMeeting[]).map(fromDatabaseMeeting));
    });
    void supabase.from("students").select("*").order("name", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setStudents((data as DatabaseStudent[]).map(fromDatabaseStudent));
    });
  }, []);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  async function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const meeting: Meeting = { id: crypto.randomUUID(), title: String(data.get("title")), date: String(data.get("date")), start: String(data.get("start")), end: String(data.get("end")), place: String(data.get("place")), status: "active" };
    meeting.qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/alumno?meeting=${meeting.id}`, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
    const next = [meeting, ...meetings.map((item) => ({ ...item, status: "scheduled" as const }))];
    setMeetings(next);
    writeStorage(MEETINGS_KEY, next);
    if (supabase) {
      const { error } = await supabase.from("meetings").upsert(toDatabaseMeeting(meeting), { onConflict: "id" });
      if (error) notify(`Junta creada localmente; Supabase respondió: ${error.message}`);
    }
    setMeetingOpen(false);
    notify("Junta creada y QR generado correctamente.");
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const { readSheet } = await import("read-excel-file/browser");
    const rows = await readSheet(file);
    const [headerRow = [], ...dataRows] = rows;
    const headers = headerRow.map((header) => String(header ?? ""));
    const parsed = dataRows
      .map((row) => normalizeStudent(Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))))
      .filter((row) => row.name || row.control);
    setPreview(parsed);
    setImportOpen(true);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function confirmImport() {
    const next = [...students, ...preview];
    setStudents(next);
    writeStorage(STUDENTS_KEY, next);
    if (supabase) {
      const { error } = await supabase.from("students").upsert(preview.map(toDatabaseStudent), { onConflict: "control" });
      if (error) notify(`Importación local completada; Supabase respondió: ${error.message}`);
    }
    setPreview([]);
    setImportOpen(false);
    notify(`${next.length} alumnos disponibles en el padrón local.`);
  }

  return (
    <div className="space-y-8">
      {notice && <div role="status" className="fixed right-5 top-5 z-30 max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-900 px-5 py-4 text-sm text-cyan-100 shadow-2xl">{notice}</div>}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[["Juntas", meetings.length], ["Alumnos", students.length], ["Pendientes", "0"], ["Justificantes", "0"]].map(([label, value]) => <div key={String(label)} className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-500">{Number(value) ? "Información disponible" : "Sin datos cargados"}</p></div>)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Operación</p><h2 className="mt-2 text-2xl font-semibold text-white">Juntas</h2></div><button onClick={() => setMeetingOpen(true)} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Nueva junta</button></div>{meetings.length ? <div className="space-y-3">{meetings.map((meeting) => <div key={meeting.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{meeting.title}</p><p className="text-sm text-slate-400">{meeting.date} · {meeting.start} - {meeting.end} · {meeting.place}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${meeting.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>{meeting.status === "active" ? "Activa" : "Programada"}</span></div>)}</div> : <EmptyState description="Crea una junta para generar un QR, activar el registro y comenzar a crecer tu historial." action="Nueva junta" onAction={() => setMeetingOpen(true)} />}</div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Datos</p><h2 className="mt-2 text-2xl font-semibold text-white">Padrón de alumnos</h2><p className="mt-3 text-sm leading-6 text-slate-400">Importa el Excel una vez y conserva el padrón en este dispositivo mientras conectamos la base de datos.</p><input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" /><button onClick={() => fileInput.current?.click()} className="mt-5 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">Importar Excel</button>{students.length > 0 && <p className="mt-3 text-xs text-emerald-300">{students.length} registros cargados</p>}</div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Asistencia</p><h3 className="mt-2 text-2xl font-semibold text-white">Lista de registrados</h3><EmptyState description={students.length ? `${students.length} alumnos listos para registrar asistencia.` : "El padrón está vacío. Importa el Excel de alumnos para comenzar."} action={students.length ? "Ver alumnos" : "Importar Excel"} onAction={() => students.length ? notify("La tabla completa estará disponible en la siguiente vista.") : fileInput.current?.click()} /></div><EmptyPanel title="Justificantes" eyebrow="Generación" description="Se generarán automáticamente al cruzar asistencia con horarios y agrupar por materia." /></section>
      {meetingOpen && <MeetingModal onClose={() => setMeetingOpen(false)} onSubmit={createMeeting} />}
      {importOpen && <ImportModal rows={preview} onCancel={() => setImportOpen(false)} onConfirm={confirmImport} />}
    </div>
  );
}

function MeetingModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Nueva junta</p><h2 className="mt-2 text-2xl font-semibold text-white">Configurar reunión</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300 sm:col-span-2">Título<input required name="title" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Reunión General IEEE" /></label><label className="text-sm text-slate-300">Fecha<input required name="date" type="date" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Lugar<input required name="place" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Auditorio B" /></label><label className="text-sm text-slate-300">Inicio<input required name="start" type="time" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Fin<input required name="end" type="time" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Crear junta</button></div></form></div>;
}

function ImportModal({ rows, onCancel, onConfirm }: { rows: Student[]; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Importación</p><h2 className="mt-2 text-2xl font-semibold text-white">Vista previa del padrón</h2><p className="mt-1 text-sm text-slate-400">{rows.length} filas detectadas</p></div><button onClick={onCancel} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 max-h-80 overflow-auto rounded-2xl border border-slate-800"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-950 text-slate-300"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Control</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Grupo</th></tr></thead><tbody className="divide-y divide-slate-800">{rows.slice(0, 20).map((row, index) => <tr key={`${row.control}-${index}`}><td className="px-4 py-3 text-slate-200">{row.name || "Sin nombre"}</td><td className="px-4 py-3 text-slate-300">{row.control || "—"}</td><td className="px-4 py-3 text-slate-300">{row.email || "—"}</td><td className="px-4 py-3 text-slate-300">{row.group || "—"}</td></tr>)}</tbody></table></div><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button onClick={onConfirm} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Confirmar importación</button></div></div></div>;
}

function normalizeStudent(row: Record<string, unknown>): Student {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""), String(value ?? "").trim()]));
  return { name: pick(normalized, ["nombre", "nombrecompleto", "alumno", "name"]), control: pick(normalized, ["control", "numerodecontrol", "nocontrol", "matricula"]), email: pick(normalized, ["correo", "email", "correoinstitucional"]), career: pick(normalized, ["carrera", "career"]), group: pick(normalized, ["grupo", "group"]), subject: pick(normalized, ["materia", "subject"]), professor: pick(normalized, ["profesor", "docente", "professor"]), start: pick(normalized, ["horainicio", "inicio", "start"]), end: pick(normalized, ["horafin", "fin", "end"]) };
}

function pick(row: Record<string, string>, keys: string[]) {
  return keys.map((key) => row[key]).find(Boolean) ?? "";
}

function readStorage<T>(key: string, fallback: T): T {
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function fromDatabaseMeeting(row: DatabaseMeeting): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: row.meeting_date,
    start: row.start_time,
    end: row.end_time,
    place: row.place,
    status: row.status,
    qrDataUrl: row.qr_data_url ?? undefined,
  };
}

function fromDatabaseStudent(row: DatabaseStudent): Student {
  return {
    name: row.name,
    control: row.control,
    email: row.email ?? "",
    career: row.career ?? "",
    group: row.group_name ?? "",
    subject: row.subject ?? "",
    professor: row.professor ?? "",
    start: row.start_time ?? "",
    end: row.end_time ?? "",
  };
}

function toDatabaseMeeting(meeting: Meeting): DatabaseMeeting {
  return {
    id: meeting.id,
    title: meeting.title,
    meeting_date: meeting.date,
    start_time: meeting.start,
    end_time: meeting.end,
    place: meeting.place,
    status: meeting.status,
    qr_data_url: meeting.qrDataUrl ?? null,
  };
}

function toDatabaseStudent(student: Student): DatabaseStudent {
  return {
    name: student.name || "Sin nombre",
    control: student.control || `sin-control-${crypto.randomUUID()}`,
    email: student.email,
    career: student.career,
    group_name: student.group,
    subject: student.subject ?? "",
    professor: student.professor ?? "",
    start_time: student.start ?? "",
    end_time: student.end ?? "",
  };
}

function EmptyPanel({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2><EmptyState description={description} /></div>;
}

function EmptyState({ description, action, onAction }: { description: string; action?: string; onAction?: () => void }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center"><p className="text-sm leading-6 text-slate-400">{description}</p>{action && <button onClick={onAction} className="mt-5 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">{action}</button>}</div>;
}

function StatCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: "cyan" | "emerald" | "violet" }) {
  const tones = { cyan: "border-cyan-500/30 bg-cyan-500/10", emerald: "border-emerald-500/30 bg-emerald-500/10", violet: "border-violet-500/30 bg-violet-500/10" };
  return <div className={`rounded-3xl border p-5 ${tones[tone]}`}><p className="text-sm text-slate-300">{title}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-300">{subtitle}</p></div>;
}
