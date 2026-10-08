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
  status: "active" | "scheduled" | "closed" | "cancelled";
  qrDataUrl?: string;
};

type Student = {
  name: string;
  control: string;
  email: string;
  career: string;
  semester?: string;
  whatsapp?: string;
  group: string;
  subject?: string;
  professor?: string;
  start?: string;
  end?: string;
  pin?: string;
};

const MEETINGS_KEY = "ieee-attendance-meetings";
const STUDENTS_KEY = "ieee-attendance-students";
const ORGANIZATION_NAME = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || "Rama Estudiantil IEEE TecNM Campus Iztapalapa III";
const ORGANIZATION_SUBTITLE = process.env.NEXT_PUBLIC_ORGANIZATION_SUBTITLE || "Control de asistencia y justificantes";
const ORGANIZATION_LOGOS = [process.env.NEXT_PUBLIC_ORGANIZATION_LOGO_URL || "/logos/ieee.png", "/logos/ieee-iztapalapa-iii.png", "/logos/tecnm.png"];

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

export function StudentLogin() {
  const [control, setControl] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/student/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ control, pin }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "No se pudo iniciar sesión.");
      return;
    }
    window.location.reload();
  }

  return <main className="min-h-screen bg-slate-950 text-slate-100"><div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12"><form onSubmit={submit} className="w-full rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"><Link href="/" className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">IEEE Attendance Manager</Link><h1 className="mt-6 text-3xl font-semibold text-white">Acceso de alumno</h1><p className="mt-3 text-sm leading-6 text-slate-400">Usa tu número de control y el PIN personal asignado.</p><label className="mt-8 block text-sm text-slate-300">Número de control<input required value={control} onChange={(event) => setControl(event.target.value.trim())} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" /></label><label className="mt-4 block text-sm text-slate-300">PIN personal<input required inputMode="numeric" type="password" maxLength={12} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" /></label>{error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}<button disabled={loading} className="mt-6 w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{loading ? "Validando..." : "Iniciar sesión"}</button></form></div></main>;
}

export function Shell({ role, children }: { role: "student" | "admin"; children: React.ReactNode }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoggingOut(true);
    await fetch(role === "student" ? "/api/auth/student/logout" : "/api/admin/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="print-shell min-h-screen bg-slate-950 text-slate-100">
      <div className="print-shell-content mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
  const [newPin, setNewPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    void Promise.all([
      supabase.from("meetings").select("*").order("meeting_date", { ascending: true }),
      supabase.from("students").select("id,name,control,email,career,semester,whatsapp,group_name,subject,professor,start_time,end_time").order("name", { ascending: true }),
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

  async function changeOwnPin() {
    const response = await fetch("/api/auth/student/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: newPin }) });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setPinMessage(response.ok ? "PIN actualizado correctamente." : result.error ?? "No se pudo actualizar el PIN.");
    if (response.ok) setNewPin("");
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
    <div className="admin-dashboard space-y-8">
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
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><EmptyPanel title="Mi asistencia" eyebrow="Historial" description="No hay registros de asistencia todavía." /><div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Seguridad</p><h2 className="mt-2 text-2xl font-semibold text-white">Cambiar mi PIN</h2><input value={newPin} onChange={(event) => setNewPin(event.target.value.replace(/\D/g, ""))} maxLength={12} placeholder="Nuevo PIN de 4 a 12 dígitos" className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /><button onClick={() => void changeOwnPin()} className="mt-3 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white">Guardar PIN</button>{pinMessage && <p className="mt-3 text-sm text-cyan-200">{pinMessage}</p>}</div></section>
      {scannerOpen && <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 p-4"><div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">Escanear QR</h2><button onClick={() => setScannerOpen(false)} className="text-2xl text-slate-400">×</button></div><div id="student-qr-reader" className="mt-5 overflow-hidden rounded-2xl bg-white" /><p className="mt-4 text-sm text-slate-400">Permite el acceso a la cámara y apunta al QR de la junta.</p></div></div>}
    </div>
  );
}

export function AdminDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>(() => readStorage<Meeting[]>(MEETINGS_KEY, []));
  const [students, setStudents] = useState<Student[]>(() => readStorage<Student[]>(STUDENTS_KEY, []));
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<Student[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [justificationCount, setJustificationCount] = useState(0);
  const [attendances, setAttendances] = useState<DatabaseAttendance[]>([]);
  const [justifications, setJustifications] = useState<DatabaseJustification[]>([]);
  const [testReportOpen, setTestReportOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState<"attendance" | "justifications" | null>(null);
  const [pinStudent, setPinStudent] = useState<Student | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [studentFilter, setStudentFilter] = useState("");
  const [meetingFilter, setMeetingFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.from("meetings").select("*").order("meeting_date", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setMeetings((data as DatabaseMeeting[]).map(fromDatabaseMeeting));
    });
    void supabase.from("students").select("id,name,control,email,career,semester,whatsapp,group_name,subject,professor,start_time,end_time").order("name", { ascending: true }).then(({ data, error }) => {
      if (!error && data) setStudents((data as DatabaseStudent[]).map(fromDatabaseStudent));
    });
    void supabase.from("attendances").select("id", { count: "exact", head: true }).then(({ count }) => setAttendanceCount(count ?? 0));
    void supabase.from("justifications").select("id", { count: "exact", head: true }).then(({ count }) => setJustificationCount(count ?? 0));
    void loadOverview();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const active = meetings.find((meeting) => meeting.status === "active");
    if (!active || !supabase) return;
    const mexicoNow = getMexicoDateTime();
    if (active.date > mexicoNow.date || (active.date === mexicoNow.date && mexicoNow.time < active.end)) return;
    void fetch("/api/admin/meetings/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: active.id }),
    }).then(async (response) => {
      if (!response.ok) return;
      setMeetings((current) => current.map((item) => item.id === active.id ? { ...item, status: "closed" } : item));
      await loadOverview();
      notify("La junta terminó y fue cerrada automáticamente.");
    });
  }, [meetings, now]);

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
      let rows;
      try {
        rows = await readSheet(file, "IMPORTAR_ALUMNOS");
      } catch {
        rows = await readSheet(file);
      }
    const [headerRow = [], ...dataRows] = rows;
    const headers = headerRow.map((header) => String(header ?? ""));
    const parsed = dataRows
      .map((row) => normalizeStudent(Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))))
      .filter((row) => row.name && row.control);
      if (!parsed.length) {
        notify("No se encontraron filas válidas. Revisa que cada fila tenga Nombre completo y Número de control.");
        return;
      }
        const duplicateControls = parsed.map((row) => row.control).filter((control, index, all) => control && all.indexOf(control) !== index);
        if (duplicateControls.length) {
          notify(`Hay controles duplicados en el archivo: ${[...new Set(duplicateControls)].join(", ")}.`);
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
    if (supabase) {
      const response = await fetch("/api/admin/students/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ students: preview }) });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        notify(result.error ?? "No se pudo sincronizar el padrón con Supabase.");
        return;
      }
    }
    const merged = new Map(students.map((student) => [student.control, student]));
    for (const student of preview) if (student.control) merged.set(student.control, student);
    const next = [...merged.values()];
    setStudents(next);
    writeStorage(STUDENTS_KEY, next);
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

  async function closeMeeting(meeting: Meeting) {
    const response = await fetch("/api/admin/meetings/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: meeting.id }),
    });
    if (!response.ok) {
      notify("No se pudo cerrar la junta.");
      return;
    }

    setMeetings((current) => current.map((item) => item.id === meeting.id ? { ...item, status: "closed" } : item));
    notify("Junta cerrada. Ya no acepta registros.");
  }

  async function shareMeeting(meeting: Meeting) {
    const url = `${window.location.origin}/alumno?meeting=${meeting.id}`;
    const text = `Registro de asistencia: ${meeting.title}\n${meeting.date} · ${meeting.start} - ${meeting.end}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Asistencia · ${meeting.title}`, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify("Enlace de asistencia copiado. Compártelo con los alumnos.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      notify("No se pudo compartir el QR. Copia este enlace: " + url);
    }
  }

  async function setMeetingStatus(meeting: Meeting, status: "cancelled" | "scheduled" | "active") {
    const response = await fetch("/api/admin/meetings/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meetingId: meeting.id, status }) });
    if (!response.ok) { notify("No se pudo actualizar la junta."); return; }
    setMeetings((current) => current.map((item) => item.id === meeting.id ? { ...item, status } : item));
    notify(status === "cancelled" ? "Junta cancelada." : status === "active" ? "Junta reabierta y activa." : "Junta reprogramada.");
  }

  async function deleteMeeting(meeting: Meeting) {
    if (!window.confirm(`¿Eliminar la junta "${meeting.title}"? Esta acción no se puede deshacer.`)) return;
    const response = await fetch("/api/admin/meetings/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId: meeting.id }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      notify(result.error ?? "No se pudo eliminar la junta.");
      return;
    }
    const next = meetings.filter((item) => item.id !== meeting.id);
    setMeetings(next);
    writeStorage(MEETINGS_KEY, next);
    notify("Junta eliminada.");
  }

  async function updateMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editMeeting) return;
    const data = new FormData(event.currentTarget);
    const updated = { ...editMeeting, title: String(data.get("title") ?? "").trim(), date: String(data.get("date") ?? ""), start: String(data.get("start") ?? ""), end: String(data.get("end") ?? ""), place: String(data.get("place") ?? "").trim() };
    if (!updated.title || !updated.date || !updated.start || !updated.end || !updated.place || updated.end <= updated.start) {
      notify("Completa todos los datos y verifica que la hora final sea posterior a la inicial.");
      return;
    }
    const response = await fetch("/api/admin/meetings/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ meetingId: updated.id, title: updated.title, date: updated.date, start: updated.start, end: updated.end, place: updated.place }) });
    if (!response.ok) {
      const result = await response.json().catch(() => ({})) as { error?: string };
      notify(result.error ?? "No se pudo editar la junta.");
      return;
    }
    updated.qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/alumno?meeting=${updated.id}`, { width: 280, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
    const next = meetings.map((item) => item.id === updated.id ? updated : item);
    setMeetings(next);
    writeStorage(MEETINGS_KEY, next);
    setEditMeeting(null);
    notify("Junta actualizada correctamente.");
  }

  async function deleteStudent(student: Student) {
    if (!window.confirm(`¿Eliminar a ${student.name}? Esta acción también elimina sus asistencias.`)) return;
    const response = await fetch(`/api/admin/students?control=${encodeURIComponent(student.control)}`, { method: "DELETE" });
    if (!response.ok) { notify("No se pudo eliminar el alumno."); return; }
    const next = students.filter((item) => item.control !== student.control);
    setStudents(next);
    writeStorage(STUDENTS_KEY, next);
    notify("Alumno eliminado.");
  }

  function exportCsv() {
    const rows = attendances.filter((row) => (!meetingFilter || row.meetings?.title === meetingFilter) && (!dateFilter || row.meetings?.meeting_date === dateFilter) && (!groupFilter || row.students?.group_name === groupFilter));
    const csv = [["Alumno", "Control", "Grupo", "Junta", "Fecha", "Registrado"], ...rows.map((row) => [row.students?.name ?? "", row.students?.control ?? "", row.students?.group_name ?? "", row.meetings?.title ?? "", row.meetings?.meeting_date ?? "", new Date(row.attended_at).toLocaleString("es-MX")])].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "asistencias-ieee.csv"; link.click(); URL.revokeObjectURL(url);
  }

  const filteredStudents = students.filter((student) => `${student.name} ${student.control} ${student.group} ${student.subject}`.toLowerCase().includes(studentFilter.toLowerCase()));
  const filteredJustifications = justifications.filter((row) => (!subjectFilter || row.subject === subjectFilter) && (!groupFilter || row.group_name === groupFilter));
  const testJustification: DatabaseJustification = {
    id: "test-justification",
    meeting_id: "test-meeting",
    student_id: "test-student",
    subject: "Materia de prueba",
    group_name: "I1A",
    professor: "Docente de prueba",
    overlap_start: "11:00:00",
    overlap_end: "12:00:00",
    overlap_minutes: 60,
    note: "Documento de prueba. No tiene validez oficial.",
    students: { name: "Alumno de prueba", control: "000000000" },
  };

  return (
    <div className="space-y-8">
      {notice && <div role="status" className="fixed right-5 top-5 z-30 max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-900 px-5 py-4 text-sm text-cyan-100 shadow-2xl">{notice}</div>}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{[["Juntas", meetings.length], ["Alumnos", students.length], ["Asistencias", attendanceCount], ["Justificantes", justificationCount]].map(([label, value]) => <div key={String(label)} className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-500">{Number(value) ? "Información disponible" : "Sin datos cargados"}</p></div>)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Operación</p><h2 className="mt-2 text-2xl font-semibold text-white">Juntas</h2></div><button onClick={() => setMeetingOpen(true)} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Nueva junta</button></div>{meetings.length ? <div className="space-y-3">{meetings.map((meeting) => <div key={meeting.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{meeting.title}</p><p className="text-sm text-slate-400">{meeting.date} · {meeting.start} - {meeting.end} · {meeting.place}</p><p className="mt-1 text-xs text-cyan-300">{meeting.status === "active" ? `Duración: ${formatDuration(elapsedSeconds(meeting, now))}` : meeting.status === "closed" ? `Duración total: ${formatDuration(elapsedSeconds(meeting, new Date(`${meeting.date}T${meeting.end}:00`).getTime()))}` : "Aún no iniciada"}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs ${meeting.status === "active" ? "bg-emerald-500/15 text-emerald-300" : meeting.status === "closed" ? "bg-rose-500/15 text-rose-300" : meeting.status === "cancelled" ? "bg-amber-500/15 text-amber-300" : "bg-slate-700 text-slate-300"}`}>{meeting.status === "active" ? "Activa" : meeting.status === "closed" ? "Cerrada" : meeting.status === "cancelled" ? "Cancelada" : "Programada"}</span>{meeting.status === "active" && <><button onClick={() => void shareMeeting(meeting)} className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-200">Compartir QR</button><button onClick={() => void closeMeeting(meeting)} className="rounded-full border border-rose-400/30 px-3 py-1 text-xs text-rose-200">Cerrar</button><button onClick={() => void setMeetingStatus(meeting, "cancelled")} className="rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-200">Cancelar</button></>}{(meeting.status === "closed" || meeting.status === "cancelled") && <button onClick={() => void setMeetingStatus(meeting, "active")} className="rounded-full border border-emerald-400/30 px-3 py-1 text-xs text-emerald-200">Reabrir</button>        }<button onClick={() => setEditMeeting(meeting)} className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-200">Editar</button><button onClick={() => void deleteMeeting(meeting)} className="rounded-full border border-rose-400/30 px-3 py-1 text-xs text-rose-200">Eliminar</button></div></div>)}</div> : <EmptyState description="Crea una junta para generar un QR, activar el registro y comenzar a crecer tu historial." action="Nueva junta" onAction={() => setMeetingOpen(true)} />}</div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Datos</p><h2 className="mt-2 text-2xl font-semibold text-white">Padrón de alumnos</h2><p className="mt-3 text-sm leading-6 text-slate-400">Importa el Excel una vez y conserva el padrón en este dispositivo mientras conectamos la base de datos.</p><input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" /><button onClick={() => fileInput.current?.click()} className="mt-5 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20">Importar Excel</button>{students.length > 0 && <><p className="mt-3 text-xs text-emerald-300">{students.length} registros cargados</p><button onClick={() => setPinStudent(students[0])} className="mt-3 w-full rounded-xl border border-violet-500/30 px-4 py-3 text-sm font-semibold text-violet-200">Administrar PIN de alumno</button></>}</div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Asistencia</p><h3 className="mt-2 text-2xl font-semibold text-white">Lista de registrados</h3><EmptyState description={students.length ? `${attendanceCount} asistencias registradas de ${students.length} alumnos.` : "El padrón está vacío. Importa el Excel de alumnos para comenzar."} action={students.length ? "Ver detalle" : "Importar Excel"} onAction={() => students.length ? setDetailsOpen("attendance") : fileInput.current?.click()} /></div><div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Generación</p><h3 className="mt-2 text-2xl font-semibold text-white">Justificantes</h3><EmptyState description={justificationCount ? `${justificationCount} justificantes guardados.` : "Cruza las asistencias con las materias y horarios importados."} action={justificationCount ? "Ver e imprimir" : "Generar justificantes"} onAction={() => justificationCount ? setDetailsOpen("justifications") : generateJustifications()} /><button onClick={() => setTestReportOpen(true)} className="mt-3 w-full rounded-xl border border-violet-400/30 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/10">Vista previa de justificante</button></div></section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Directorio</p><h3 className="mt-2 text-2xl font-semibold text-white">Alumnos y PIN</h3></div><input value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)} placeholder="Buscar alumno, control o grupo" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></div><div className="mt-5 overflow-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-700 text-slate-400"><tr><th className="px-3 py-3">Alumno</th><th className="px-3 py-3">Control</th><th className="px-3 py-3">Grupo</th><th className="px-3 py-3">Materia</th><th className="px-3 py-3">Acciones</th></tr></thead><tbody className="divide-y divide-slate-800">{filteredStudents.slice(0, 100).map((student) => <tr key={student.control}><td className="px-3 py-3 text-white">{student.name}</td><td className="px-3 py-3 text-slate-300">{student.control}</td><td className="px-3 py-3 text-slate-300">{student.group || "—"}</td><td className="px-3 py-3 text-slate-300">{student.subject || "—"}</td><td className="flex gap-2 px-3 py-3"><button onClick={() => setEditStudent(student)} className="text-cyan-300">Editar</button><button onClick={() => setPinStudent(student)} className="text-violet-300">PIN</button><button onClick={() => void deleteStudent(student)} className="text-rose-300">Eliminar</button></td></tr>)}</tbody></table></div></section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="flex flex-wrap gap-3"><select value={meetingFilter} onChange={(event) => setMeetingFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Todas las juntas</option>{meetings.map((meeting) => <option key={meeting.id} value={meeting.title}>{meeting.title}</option>)}</select><input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><input value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)} placeholder="Grupo" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><input value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} placeholder="Materia" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><button onClick={exportCsv} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950">Exportar CSV</button></div></section>
      {detailsOpen && <DetailsModal type={detailsOpen} attendances={attendances.filter((row) => (!meetingFilter || row.meetings?.title === meetingFilter) && (!dateFilter || row.meetings?.meeting_date === dateFilter) && (!groupFilter || row.students?.group_name === groupFilter))} justifications={filteredJustifications} onClose={() => setDetailsOpen(null)} onSaved={loadOverview} onExport={exportCsv} />}
      {testReportOpen && <DetailsModal type="justifications" attendances={[]} justifications={[testJustification]} onClose={() => setTestReportOpen(false)} onSaved={async () => undefined} onExport={() => undefined} />}
      {pinStudent && <StudentPinModal students={students} selected={pinStudent} onClose={() => setPinStudent(null)} onSaved={(student) => { setPinStudent(student); notify("PIN actualizado correctamente."); }} />}
      {editStudent && <StudentEditModal student={editStudent} onClose={() => setEditStudent(null)} onSaved={(updated) => { const next = students.map((item) => item.control === updated.control ? updated : item); setStudents(next); writeStorage(STUDENTS_KEY, next); setEditStudent(null); notify("Alumno actualizado."); }} />}
      {meetingOpen && <MeetingModal title="Nueva junta" submitLabel="Crear junta" onClose={() => setMeetingOpen(false)} onSubmit={createMeeting} />}
      {editMeeting && <MeetingModal title="Editar junta" submitLabel="Guardar cambios" meeting={editMeeting} onClose={() => setEditMeeting(null)} onSubmit={updateMeeting} />}
      {importOpen && <ImportModal rows={preview} onCancel={() => setImportOpen(false)} onConfirm={confirmImport} />}
    </div>
  );
}

function MeetingModal({ title, submitLabel, meeting, onClose, onSubmit }: { title: string; submitLabel: string; meeting?: Meeting; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={onSubmit} className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{title}</p><h2 className="mt-2 text-2xl font-semibold text-white">Configurar reunión</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300 sm:col-span-2">Título<input required name="title" defaultValue={meeting?.title} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Reunión General IEEE" /></label><label className="text-sm text-slate-300">Fecha<input required name="date" type="date" defaultValue={meeting?.date} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Lugar<input required name="place" defaultValue={meeting?.place} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Auditorio B" /></label><label className="text-sm text-slate-300">Inicio<input required name="start" type="time" defaultValue={meeting?.start.slice(0, 5)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Fin<input required name="end" type="time" defaultValue={meeting?.end.slice(0, 5)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">{submitLabel}</button></div></form></div>;
}

function DetailsModal({ type, attendances, justifications, onClose, onSaved, onExport }: { type: "attendance" | "justifications"; attendances: DatabaseAttendance[]; justifications: DatabaseJustification[]; onClose: () => void; onSaved: () => Promise<void>; onExport: () => void }) {
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

  return <div className="print-report fixed inset-0 z-20 overflow-y-auto bg-slate-950/90 p-4 sm:p-8 print:static print:overflow-visible print:bg-white print:p-0"><div className="mx-auto max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl print:max-w-none print:border-0 print:bg-white print:p-0 print:text-black"><div className="hidden border-b border-slate-300 pb-4 print:flex print:items-center print:justify-between print:gap-4">{<div className="flex items-center gap-3">{ORGANIZATION_LOGOS.map((logo) => <img key={logo} src={logo} alt="" className="h-14 max-w-28 object-contain" />)}</div>}<div className="text-right"><p className="text-lg font-bold">{ORGANIZATION_NAME}</p><p className="text-sm">{ORGANIZATION_SUBTITLE}</p><p className="text-base font-bold">{type === "attendance" ? "Reporte consolidado de asistencias" : "Reporte consolidado de justificantes"}</p><p className="text-xs">Documento generado el {new Date().toLocaleDateString("es-MX")}</p></div></div><div className="flex items-center justify-between gap-4 print:hidden"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{ORGANIZATION_NAME}</p><h2 className="mt-2 text-2xl font-semibold text-white">{type === "attendance" ? "Reporte formal de asistencias" : "Reporte formal de justificantes"}</h2><p className="text-sm text-slate-400">{ORGANIZATION_SUBTITLE}</p></div><div className="flex gap-2"><button onClick={onExport} className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm text-emerald-200">Exportar CSV</button><button onClick={() => window.print()} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Imprimir / PDF</button><button onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cerrar</button></div></div>{type === "attendance" ? <div className="mt-6 overflow-auto print:mt-4 print:overflow-visible"><table className="min-w-full text-left text-sm print:text-xs"><thead className="border-b border-slate-700 text-slate-400"><tr><th className="px-3 py-3 print:px-1 print:py-1">Alumno</th><th className="px-3 py-3 print:px-1 print:py-1">Control</th><th className="px-3 py-3 print:px-1 print:py-1">Junta</th><th className="px-3 py-3 print:px-1 print:py-1">Fecha y hora</th></tr></thead><tbody className="divide-y divide-slate-800">{attendances.map((row) => <tr key={row.id}><td className="px-3 py-3 text-white print:px-1 print:py-1">{row.students?.name ?? "—"}</td><td className="px-3 py-3 text-slate-300 print:px-1 print:py-1">{row.students?.control ?? "—"}</td><td className="px-3 py-3 text-slate-300 print:px-1 print:py-1">{row.meetings?.title ?? "—"}</td><td className="px-3 py-3 text-slate-300 print:px-1 print:py-1">{new Date(row.attended_at).toLocaleString("es-MX")}</td></tr>)}</tbody></table>{!attendances.length && <p className="py-10 text-center text-slate-400">No hay asistencias registradas.</p>}</div> : <div className="mt-6 overflow-auto print:mt-4 print:overflow-visible"><table className="min-w-full text-left text-sm print:text-xs"><thead className="border-b border-slate-700 text-slate-400"><tr><th className="px-3 py-3 print:px-1 print:py-1">Alumno</th><th className="px-3 py-3 print:px-1 print:py-1">Materia</th><th className="px-3 py-3 print:px-1 print:py-1">Grupo / profesor</th><th className="px-3 py-3 print:px-1 print:py-1">Solape</th><th className="px-3 py-3 print:px-1 print:py-1">Nota</th></tr></thead><tbody className="divide-y divide-slate-800">{justifications.map((row) => <tr key={row.id}><td className="px-3 py-3 text-white print:px-1 print:py-1">{row.students?.name ?? "—"}<span className="block text-xs text-slate-500">{row.students?.control ?? "—"}</span></td><td className="px-3 py-3 text-slate-300 print:px-1 print:py-1">{row.subject}</td><td className="px-3 py-3 text-slate-300 print:px-1 print:py-1">{row.group_name || "—"}<span className="block text-xs text-slate-500">{row.professor || "—"}</span></td><td className="px-3 py-3 text-slate-300 print:px-1 print:py-1">{row.overlap_start.slice(0, 5)} - {row.overlap_end.slice(0, 5)}<span className="block text-xs text-slate-500">{row.overlap_minutes} min</span></td><td className="px-3 py-3 print:px-1 print:py-1"><textarea defaultValue={row.note ?? ""} onBlur={(event) => void saveNote(row.id, event.target.value)} disabled={saving === row.id} className="min-w-48 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200 print:min-w-0" placeholder="Nota..." /></td></tr>)}</tbody></table>{!justifications.length && <p className="py-10 text-center text-slate-400">No hay justificantes generados.</p>}</div>}</div></div>;
}

function StudentEditModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: (student: Student) => void }) {
  const [value, setValue] = useState(student);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/students", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    if (response.ok) onSaved(value);
  }
  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={submit} className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-semibold text-white">Editar alumno</h2><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{(["name","email","career","semester","whatsapp","group","subject","professor","start","end"] as const).map((field) => <label key={field} className="text-sm text-slate-300">{field}<input value={value[field] ?? ""} onChange={(event) => setValue({ ...value, [field]: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>)}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-slate-300">Cancelar</button><button className="rounded-full bg-cyan-500 px-4 py-2 font-semibold text-slate-950">Guardar</button></div></form></div>;
}

function StudentPinModal({ students, selected, onClose, onSaved }: { students: Student[]; selected: Student; onClose: () => void; onSaved: (student: Student) => void }) {
  const [student, setStudent] = useState(selected);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/students/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ control: student.control, pin }),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "No se pudo actualizar el PIN.");
      return;
    }
    onSaved(student);
  }

  return <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-violet-300">Seguridad</p><h2 className="mt-2 text-2xl font-semibold text-white">Administrar PIN</h2></div><button type="button" onClick={onClose} className="text-2xl text-slate-400">×</button></div><label className="mt-6 block text-sm text-slate-300">Alumno<select value={student.control} onChange={(event) => setStudent(students.find((item) => item.control === event.target.value) ?? selected)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white">{students.filter((item) => item.control).map((item) => <option key={item.control} value={item.control}>{item.name} · {item.control}</option>)}</select></label><label className="mt-4 block text-sm text-slate-300">Nuevo PIN<input required minLength={4} maxLength={12} inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white" placeholder="4 a 12 dígitos" /></label>{error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white">Guardar PIN</button></div></form></div>;
}

function elapsedSeconds(meeting: Meeting, now: number) {
  const start = new Date(`${meeting.date}T${meeting.start}:00`).getTime();
  const end = new Date(`${meeting.date}T${meeting.end}:00`).getTime();
  return Math.max(0, Math.min(now, end) - start) / 1000;
}

function formatDuration(totalSeconds: number) {
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ImportModal({ rows, onCancel, onConfirm }: { rows: Student[]; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4"><div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Importación</p><h2 className="mt-2 text-2xl font-semibold text-white">Vista previa del padrón</h2><p className="mt-1 text-sm text-slate-400">{rows.length} filas detectadas</p></div><button onClick={onCancel} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 max-h-80 overflow-auto rounded-2xl border border-slate-800"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-950 text-slate-300"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Control</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Grupo</th></tr></thead><tbody className="divide-y divide-slate-800">{rows.slice(0, 20).map((row, index) => <tr key={`${row.control}-${index}`}><td className="px-4 py-3 text-slate-200">{row.name || "Sin nombre"}</td><td className="px-4 py-3 text-slate-300">{row.control || "—"}</td><td className="px-4 py-3 text-slate-300">{row.email || "—"}</td><td className="px-4 py-3 text-slate-300">{row.group || "—"}</td></tr>)}</tbody></table></div><div className="mt-6 flex justify-end gap-3"><button onClick={onCancel} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button onClick={onConfirm} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Confirmar importación</button></div></div></div>;
}

function normalizeStudent(row: Record<string, unknown>): Student {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""), String(value ?? "").trim()]));
  return {
    name: pick(normalized, ["nombre", "nombrecompleto", "alumno", "name"]),
    control: pick(normalized, ["control", "numerodecontrol", "nocontrol", "matricula"]),
    email: pick(normalized, ["correo", "email", "correoinstitucional"]),
    career: pick(normalized, ["carrera", "career"]),
    semester: pick(normalized, ["semestre", "semestreactual", "semester"]),
    whatsapp: pick(normalized, ["whatsapp", "telefonocontacto", "telefon", "telefono"]),
    group: pick(normalized, ["grupo", "group"]),
    subject: pick(normalized, ["materia", "subject"]),
    professor: pick(normalized, ["profesor", "docente", "professor"]),
    start: normalizeTime(pick(normalized, ["horainicio", "inicio", "start"])),
    end: normalizeTime(pick(normalized, ["horafin", "fin", "end"])),
    pin: pick(normalized, ["pin", "pintemporal", "pinpersonal", "contrasena"]),
  };
}

function normalizeTime(value: string) {
  if (!value) return "";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric < 1) {
    const total = Math.round(numeric * 24 * 60);
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  const match = value.match(/^(\d{1,2})[:.](\d{2})(?:\s*([ap])\.?m\.?)?$/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (minute > 59) return "";
  if (match[3]) hour = (hour % 12) + (match[3].toLowerCase() === "p" ? 12 : 0);
  if (hour > 23) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getMexicoDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
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
    semester: row.semester ?? "",
    whatsapp: row.whatsapp ?? "",
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
