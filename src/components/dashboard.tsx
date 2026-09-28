"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

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
  return <div className="space-y-8"><section className="grid gap-5 md:grid-cols-3"><StatCard title="Próxima junta" value="Sin juntas" subtitle="El administrador aún no ha creado una junta" tone="cyan" /><StatCard title="Asistencias" value="0" subtitle="Los datos aparecerán al cargar alumnos" tone="emerald" /><StatCard title="Justificantes" value="0" subtitle="Todavía no hay registros" tone="violet" /></section><section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><EmptyPanel title="Escanear asistencia" eyebrow="Registro" description="Cuando exista una junta activa, aquí aparecerá su QR para registrar la asistencia." action="Esperando una junta activa" /><EmptyPanel title="Actividad" eyebrow="Historial" description="Tu actividad aparecerá después de cargar el padrón y registrar una asistencia." /></section><section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><EmptyPanel title="Mi asistencia" eyebrow="Historial" description="No hay registros de asistencia todavía." /><EmptyPanel title="Mis clases" eyebrow="Horario" description="El horario de clases se cargará desde el archivo de alumnos." /></section></div>;
}

export function AdminDashboard() {
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meeting, setMeeting] = useState<{ title: string; date: string; start: string; end: string; place: string } | null>(null);
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function createMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setMeeting({
      title: String(data.get("title")),
      date: String(data.get("date")),
      start: String(data.get("start")),
      end: String(data.get("end")),
      place: String(data.get("place")),
    });
    setMeetingOpen(false);
    notify("Junta creada. El QR ya está disponible para mostrarlo.");
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) notify(`Archivo "${file.name}" seleccionado. La importación quedará lista al conectar la base de datos.`);
  }

  function scrollTo(id: string, message: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    notify(message);
  }

  return (
    <div className="space-y-8">
      {notice && <div role="status" className="fixed right-5 top-5 z-20 max-w-sm rounded-2xl border border-cyan-400/30 bg-slate-900 px-5 py-4 text-sm text-cyan-100 shadow-2xl">{notice}</div>}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{["Juntas activas", "Asistencias", "Pendientes", "Justificantes"].map((label, index) => <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-bold text-white">{index === 0 && meeting ? "1" : "0"}</p><p className="mt-2 text-sm text-slate-500">{meeting && index === 0 ? "Lista para recibir alumnos" : "Sin datos cargados"}</p></div>)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div id="meetings" className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Control</p><h2 className="mt-2 text-2xl font-semibold text-white">Juntas activas</h2></div><button onClick={() => setMeetingOpen(true)} className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Nueva junta</button></div>{meeting ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-white">{meeting.title}</p><p className="mt-1 text-sm text-slate-300">{meeting.date} · {meeting.start} - {meeting.end} · {meeting.place}</p></div><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">Activa</span></div><button onClick={() => notify("QR generado para la junta activa.")} className="mt-4 rounded-full border border-cyan-400/30 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/10">Generar QR</button></div> : <EmptyState description="Crea la primera junta para generar su QR y comenzar a registrar asistencias." action="Nueva junta" onAction={() => setMeetingOpen(true)} />}</div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Acciones rápidas</p><div className="mt-5 space-y-3">{[["Generar QR", () => meeting ? notify("QR generado para la junta activa.") : notify("Primero crea una junta.")], ["Exportar reporte", () => notify("No hay asistencias para exportar.")], ["Ver lista completa", () => scrollTo("attendance", "La lista de registrados está más abajo.")], ["Revisar justificantes", () => scrollTo("justifications", "La sección de justificantes está más abajo.")]].map(([action, callback]) => <button key={String(action)} onClick={callback as () => void} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800"><span>{String(action)}</span><span className="text-cyan-300">→</span></button>)}</div></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div id="attendance" className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Asistencia</p><h3 className="mt-2 text-2xl font-semibold text-white">Lista de registrados</h3><EmptyState description="El padrón está vacío. Carga el Excel de alumnos para comenzar." action="Importar Excel" onAction={() => fileInput.current?.click()} /><input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" /></div>
        <div id="justifications" className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Generación</p><h3 className="mt-2 text-2xl font-semibold text-white">Justificantes</h3><EmptyState description="Se generarán después de registrar asistencias y cargar los horarios." action="Ver requisitos" onAction={() => notify("Cada alumno deberá incluir materia, grupo, profesor y horario.")} /></div>
      </section>
      {meetingOpen && <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-4"><form onSubmit={createMeeting} className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Nueva junta</p><h2 className="mt-2 text-2xl font-semibold text-white">Configurar reunión</h2></div><button type="button" onClick={() => setMeetingOpen(false)} className="text-2xl text-slate-400 hover:text-white">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-300 sm:col-span-2">Título<input required name="title" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Reunión General IEEE" /></label><label className="text-sm text-slate-300">Fecha<input required name="date" type="date" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Lugar<input required name="place" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" placeholder="Auditorio B" /></label><label className="text-sm text-slate-300">Inicio<input required name="start" type="time" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label><label className="text-sm text-slate-300">Fin<input required name="end" type="time" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white" /></label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setMeetingOpen(false)} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">Cancelar</button><button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Crear junta</button></div></form></div>}
    </div>
  );
}

function EmptyState({ description, action, onAction }: { description: string; action?: string; onAction?: () => void }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center"><p className="text-sm leading-6 text-slate-400">{description}</p>{action && <button onClick={onAction} className="mt-5 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">{action}</button>}</div>;
}

function EmptyPanel({ title, eyebrow, description, action }: { title: string; eyebrow: string; description: string; action?: string }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2><EmptyState description={description} action={action} /></div>;
}

function StatCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: "cyan" | "emerald" | "violet" }) {
  const tones = { cyan: "border-cyan-500/30 bg-cyan-500/10", emerald: "border-emerald-500/30 bg-emerald-500/10", violet: "border-violet-500/30 bg-violet-500/10" };
  return <div className={`rounded-3xl border p-5 ${tones[tone]}`}><p className="text-sm text-slate-300">{title}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-300">{subtitle}</p></div>;
}
