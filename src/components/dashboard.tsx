"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { DatabaseAttendance, DatabaseJustification, DatabaseMeeting, DatabaseStudent, supabase } from "@/lib/supabase";

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
  const [control, setControl] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState("");

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

  async function registerAttendance(meetingId: string) {
    const student = availableStudents.find((item) => item.control === control.trim()) ?? currentStudent;
    if (!student) {
      setAttendanceMessage("Escribe tu número de control antes de registrar asistencia.");
      return;
    }
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, control: student.control }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setAttendanceMessage(response.ok ? `Asistencia registrada para ${student.name}.` : result.error ?? "No se pudo registrar la asistencia.");
  }

  async function startScanner() {
    setAttendanceMessage("");
    setScannerOpen(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("student-qr-reader");
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        await scanner.stop();
        setScannerOpen(false);
        let meetingId = "";
        try {
          meetingId = new URL(decodedText).searchParams.get("meeting") ?? "";
        } catch {
          setAttendanceMessage("El QR no contiene un enlace válido.");
          return;
        }
        if (!meetingId) {
          setAttendanceMessage("El QR no corresponde a una junta válida.");
          return;
        }
        await registerAttendance(meetingId);
      },
      () => undefined,
    );
  }

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
          {activeMeeting ? <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr]"><div className="flex items-center justify-center rounded-2xl border border-slate-700 bg-white p-5"><Image src={activeMeeting.qrDataUrl ?? ""} alt="Código QR de asistencia" width={192} height={192} unoptimized /></div><div className="space-y-4"><div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Junta disponible</p><p className="mt-2 text-xl font-semibold text-white">{activeMeeting.title}</p><p className="mt-2 text-sm text-slate-300">{activeMeeting.date} · {activeMeeting.start} - {activeMeeting.end} · {activeMeeting.place}</p></div><label className="block text-sm text-slate-300">Número de control<input value={control} onChange={(event) => setControl(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Tu número de control" /></label><div className="flex flex-wrap gap-3"><button onClick={startScanner} className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Abrir cámara y escanear</button><button onClick={() => registerAttendance(activeMeeting.id)} className="rounded-full border border-cyan-500/30 px-5 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/10">Registrar asistencia</button></div>{attendanceMessage && <p role="status" className="rounded-xl bg-slate-950 px-3 py-2 text-sm text-cyan-200">{attendanceMessage}</p>}</div></div> : <EmptyState description="Cuando exista una junta activa, aquí aparecerá su QR para registrar la asistencia." />}</div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Actividad</p><EmptyState description="Tu historial de asistencia aparecerá aquí después del primer registro." /></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><EmptyPanel title="Mi asistencia" eyebrow="Historial" description="No hay registros de asistencia todavía." /><EmptyPanel title="Mis clases" eyebrow="Horario" description={currentStudent ? "Tu horario se tomará de los datos importados." : "El horario de clases se cargará desde el archivo de alumnos."} /></section>
      {scannerOpen && <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-4"><div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">Escanear QR</h2><button onClick={() => setScannerOpen(false)} className="text-2xl text-slate-400">×</button></div><div id="student-qr-reader" className="mt-5 overflow-hidden rounded-2xl bg-white" /><p className="mt-4 text-sm text-slate-400">Permite el acceso a la cámara y apunta al QR de la junta.</p></div></div>}
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
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [justificationCount, setJustificationCount] = useState(0);
  const [attendances, setAttendances] = useState<DatabaseAttendance[]>([]);
  const [justifications, setJustifications] = useState<DatabaseJustification[]>([]);
  const [detailsOpen, setDetailsOpen] = useState<"attendance" | "justifications" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.from("meetings").select("*").order("meeting_date", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setMeetings((data as DatabaseMeeting[]).map(fromDatabaseMeeting));
    });
    void supabase.from("students").select("*").order("name", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setStudents((data as DatabaseStudent[]).map(fromDatabaseStudent));
    });
    void supabase.from("attendances").select("id", { count: "exact", head: true }).then(({ count }) => setAttendanceCount(count ?? 0));
    void supabase.from("justifications").select("id", { count: "exact", head: true }).then(({ count }) => setJustificationCount(count ?? 0));
    void loadOverview();
  }, []);

  async function loadOverview() {
    const response = await fetch("/api/admin/overview");
    if (!response.ok) return;
    const data = await response.json() as { attendances?: DatabaseAttendance[]; justifications?: DatabaseJustification[] };
    setAttendances(data.attendances ?? []);
    setJustifications(data.justifications ?? []);
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  }

  async function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const date = String(data.get("date") ?? "");
    const start = String(data.get("start") ?? "");
    const end = String(data.get("end") ?? "");
    const place = String(data.get("place") ?? "").trim();
    if (!title || !date || !start || !end || !place || end <= start) {
      notify("Completa todos los datos y verifica que la hora final sea posterior a la inicial.");
      return;
    }
    const meeting: Meeting = { id: crypto.randomUUID(), title, date, start, end, place, status: "active" };
    meeting.qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/alumno?meeting=${meeting.id}`, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
    const next = [meeting, ...meetings.map((item) => ({ ...item, status: "scheduled" as const }))];
    setMeetings(next);
    writeStorage(MEETINGS_KEY, next);
    if (supabase) {
      const { error } = await supabase.from("meetings").upsert(toDatabaseMeeting(meeting), { onConflict: "id" });
      if (error) notify(`Junta creada localmente; Supabase respondió: ${error.message}`);
    }
    await loadOverview();
    setMeetingOpen(false);
    notify("Junta creada y QR generado correctamente.");
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const rows = await readSheet(file);
    const [headerRow = [], ...dataRows] = rows;
    const headers = headerRow.map((header) => String(header ?? ""));
    const parsed = dataRows
      .map((row) => normalizeStudent(Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))))
      .filter((row) => row.name || row.control);
      if (!parsed.length) {
        notify("No se encontraron filas válidas. Revisa que el archivo tenga Nombre o Control.");
        return;
      }
      setPreview(parsed);
      setImportOpen(true);
    } catch {
      notify("No se pudo leer el archivo. Usa un Excel .xlsx, .xls o un CSV válido.");
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  async function confirmImport() {
    const merged = new Map(students.map((student) => [student.control, student]));
    for (const student of preview) if (student.control) merged.set(student.control, student);
    const next = [...merged.values()];
    setStudents(next);
    writeStorage(STUDENTS_KEY, next);
    if (supabase) {
      const { error } = await supabase.from("students").upsert(preview.map(toDatabaseStudent), { onConflict: "control" });
      if (error) notify(`Importación local completada; Supabase respondió: ${error.message}`);
    }
    await loadOverview();
    setPreview([]);
    setImportOpen(false);
    notify(`${next.length} alumnos disponibles en el padrón local.`);
  }

  async function generateJustifications() {
    const meeting = meetings.find((item) => item.status === "active") ?? meetings[0];
    if (!meeting) {
      notify("Primero crea una junta.");
      return;
    }
    const response = await fetch("/api/justifications/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: meeting.id }),
    });
    const result = await response.json().catch(() => ({})) as { created?: number; message?: string; error?: string };
    if (!response.ok) {
      notify(result.error ?? "No se pudieron generar los justificantes.");
      return;
    }
    if (supabase) {
      const { count } = await supabase.from("justifications").select("id", { count: "exact", head: true });
      setJustificationCount(count ?? 0);
    } else {
      setJustificationCount((current) => current + (result.created ?? 0));
    }
    notify(result.message ?? `${result.created ?? 0} justificantes generados.`);
  }

  return (
    <div className="space-y-8">
      {notice && <div role="status" className="fixed right-5 top-5 z-30 max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-900 px-5 py-4 text-sm text-cyan-100 shadow-2xl">{notice}</div>}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[["Juntas", meetings.length], ["Alumnos", students.length], ["Asistencias", attendanceCount], ["Justificantes", justificationCount]].map(([label, value]) => <div key={String(label)} className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-500">{Number(value) ? "Información disponible" : "Sin datos cargados"}</p></div>)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Operación</p><h2 className="mt-2 text-2xl font-semibold text-white">Juntas</h2></div><button onClick={() => setMeetingOpen(true)} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Nueva junta</button></div>{meetings.length ? <div className="space-y-3">{meetings.map((meeting) => <div key={meeting.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{meeting.title}</p><p className="text-sm text-slate-400">{meeting.date} · {meeting.start} - {meeting.end} · {meeting.place}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${meeting.status === "active" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-300"}`}>{meeting.status === "active" ? "Activa" : "Programada"}</span></div>)}</div> : <EmptyState description="Crea una junta para generar un QR, activar el registro y comenzar a crecer tu historial." action="Nueva junta" onAction={() => setMeetingOpen(true)} />}</div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Datos</p><h2 className="mt-2 text-2xl font-semibold text-white">Padrón de alumnos</h2><p className="mt-3 text-sm leading-6 text-slate-400">Importa el Excel una vez y conserva el padrón en este dispositivo mientras conectamos la base de datos.</p><input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" /><button onClick={() => fileInput.current?.click()} className="mt-5 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">Importar Excel</button>{students.length > 0 && <p className="mt-3 text-xs text-emerald-300">{students.length} registros cargados</p>}</div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Asistencia</p><h3 className="mt-2 text-2xl font-semibold text-white">Lista de registrados</h3><EmptyState description={students.length ? `${attendanceCount} asistencias registradas de ${students.length} alumnos.` : "El padrón está vacío. Importa el Excel de alumnos para comenzar."} action={students.length ? "Ver detalle" : "Importar Excel"} onAction={() => students.length ? setDetailsOpen("attendance") : fileInput.current?.click()} /></div><div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Generación</p><h3 className="mt-2 text-2xl font-semibold text-white">Justificantes</h3><EmptyState description={justificationCount ? `${justificationCount} justificantes guardados.` : "Cruza las asistencias con las materias y horarios importados."} action={justificationCount ? "Ver e imprimir" : "Generar justificantes"} onAction={() => justificationCount ? setDetailsOpen("justifications") : generateJustifications()} /></div></section>
      {detailsOpen && <DetailsModal type={detailsOpen} attendances={attendances} justifications={justifications} onClose={() => setDetailsOpen(null)} onSaved={loadOverview} />}
      {meetingOpen && <MeetingModal onClose={() => setMeetingOpen(false)} onSubmit={createMeeting} />}
      {importOpen && <ImportModal rows={preview} onCancel={() => setImportOpen(false)} onConfirm={confirmImport} />}
    </div>
  );
}

function MeetingModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Nueva junta</p><h2 className="mt-2 text-2xl font-semibold text-white">Configurar reunión</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300 sm:col-span-2">Título<input required name="title" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Reunión General IEEE" /></label><label className="text-sm text-slate-300">Fecha<input required name="date" type="date" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Lugar<input required name="place" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Auditorio B" /></label><label className="text-sm text-slate-300">Inicio<input required name="start" type="time" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Fin<input required name="end" type="time" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Crear junta</button></div></form></div>;
}

function DetailsModal({ type, attendances, justifications, onClose, onSaved }: { type: "attendance" | "justifications"; attendances: DatabaseAttendance[]; justifications: DatabaseJustification[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState("");

  async function saveNote(id: string, note: string) {
    setSaving(id);
    const response = await fetch("/api/admin/overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, note }),
    });
    if (response.ok) await onSaved();
    setSaving("");
  }

  return <div className="fixed inset-0 z-20 overflow-y-auto bg-slate-950/90 p-4 sm:p-8"><div className="mx-auto max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl print:max-w-none print:border-0 print:bg-white print:text-black"><div className="flex items-center justify-between gap-4 print:hidden"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Detalle administrativo</p><h2 className="mt-2 text-2xl font-semibold text-white">{type === "attendance" ? "Asistencias registradas" : "Justificantes generados"}</h2></div><div className="flex gap-2"><button onClick={() => window.print()} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Imprimir / PDF</button><button onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cerrar</button></div></div>{type === "attendance" ? <div className="mt-6 overflow-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-700 text-slate-400"><tr><th className="px-3 py-3">Alumno</th><th className="px-3 py-3">Control</th><th className="px-3 py-3">Junta</th><th className="px-3 py-3">Fecha y hora</th></tr></thead><tbody className="divide-y divide-slate-800">{attendances.map((row) => <tr key={row.id}><td className="px-3 py-3 text-white">{row.students?.name ?? "—"}</td><td className="px-3 py-3 text-slate-300">{row.students?.control ?? "—"}</td><td className="px-3 py-3 text-slate-300">{row.meetings?.title ?? "—"}</td><td className="px-3 py-3 text-slate-300">{new Date(row.attended_at).toLocaleString("es-MX")}</td></tr>)}</tbody></table>{!attendances.length && <p className="py-10 text-center text-slate-400">No hay asistencias registradas.</p>}</div> : <div className="mt-6 overflow-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-700 text-slate-400"><tr><th className="px-3 py-3">Alumno</th><th className="px-3 py-3">Materia</th><th className="px-3 py-3">Grupo / profesor</th><th className="px-3 py-3">Solape</th><th className="px-3 py-3">Nota</th></tr></thead><tbody className="divide-y divide-slate-800">{justifications.map((row) => <tr key={row.id}><td className="px-3 py-3 text-white">{row.students?.name ?? "—"}<span className="block text-xs text-slate-500">{row.students?.control ?? "—"}</span></td><td className="px-3 py-3 text-slate-300">{row.subject}</td><td className="px-3 py-3 text-slate-300">{row.group_name || "—"}<span className="block text-xs text-slate-500">{row.professor || "—"}</span></td><td className="px-3 py-3 text-slate-300">{row.overlap_start.slice(0, 5)} - {row.overlap_end.slice(0, 5)}<span className="block text-xs text-slate-500">{row.overlap_minutes} min</span></td><td className="px-3 py-3"><textarea defaultValue={row.note ?? ""} onBlur={(event) => void saveNote(row.id, event.target.value)} disabled={saving === row.id} className="min-w-48 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200" placeholder="Nota..." /></td></tr>)}</tbody></table>{!justifications.length && <p className="py-10 text-center text-slate-400">No hay justificantes generados.</p>}</div>}</div></div>;
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
