"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
      setError("PIN incorrecto. Inténtalo nuevamente.");
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
          <label className="mt-8 block text-sm text-slate-300">
            PIN
            <input
              autoFocus
              inputMode="numeric"
              maxLength={12}
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-violet-400"
              placeholder="••••"
            />
          </label>
          {error && <p className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}
          <button disabled={loading || pin.length < 4} className="mt-6 w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Validando..." : "Entrar al panel"}
          </button>
        </form>
      </div>
    </main>
  );
}

export function Shell({ role, children }: { role: "student" | "admin"; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">IEEE Attendance Manager</Link>
              <h1 className="mt-3 text-3xl font-semibold text-white">{role === "student" ? "Mi asistencia" : "Panel de administración"}</h1>
            </div>
            <nav className="flex flex-wrap items-center gap-2 rounded-full border border-slate-700 bg-slate-950 p-1">
              <Link href="/alumno" className={`rounded-full px-4 py-2 text-sm font-medium ${role === "student" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>Alumno</Link>
              <Link href="/admin" className={`rounded-full px-4 py-2 text-sm font-medium ${role === "admin" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>Administrador</Link>
              <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800">Salir</Link>
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function StudentDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Próxima junta" value="Sin juntas" subtitle="El administrador aún no ha creado una junta" tone="cyan" />
        <StatCard title="Asistencias" value="0" subtitle="Los datos aparecerán al cargar alumnos" tone="emerald" />
        <StatCard title="Justificantes" value="0" subtitle="Todavía no hay registros" tone="violet" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <EmptyPanel title="Escanear asistencia" eyebrow="Registro" description="Cuando exista una junta activa, aquí aparecerá su QR para registrar la asistencia." action="Esperando una junta activa" />
        <EmptyPanel title="Actividad" eyebrow="Historial" description="Tu actividad aparecerá después de cargar el padrón y registrar una asistencia." />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <EmptyPanel title="Mi asistencia" eyebrow="Historial" description="No hay registros de asistencia todavía." />
        <EmptyPanel title="Mis clases" eyebrow="Horario" description="El horario de clases se cargará desde el archivo de alumnos." />
      </section>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {["Juntas activas", "Asistencias", "Pendientes", "Justificantes"].map((label) => <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-4 text-3xl font-bold text-white">0</p><p className="mt-2 text-sm text-slate-500">Sin datos cargados</p></div>)}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <EmptyPanel title="Juntas activas" eyebrow="Control" description="Crea la primera junta para generar su QR y comenzar a registrar asistencias." action="Nueva junta" />
        <EmptyPanel title="Acciones rápidas" eyebrow="Administración" description="Las acciones estarán disponibles cuando existan juntas y alumnos cargados." />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <EmptyPanel title="Lista de registrados" eyebrow="Asistencia" description="El padrón está vacío. Carga el Excel de alumnos para comenzar." action="Importar Excel" />
        <EmptyPanel title="Justificantes" eyebrow="Generación" description="Los justificantes se generarán automáticamente después de registrar asistencias." />
      </section>
    </div>
  );
}

function EmptyPanel({ title, eyebrow, description, action }: { title: string; eyebrow: string; description: string; action?: string }) {
  return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2><div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center"><p className="text-sm leading-6 text-slate-400">{description}</p>{action && <button className="mt-5 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">{action}</button>}</div></div>;
}

function StatCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: "cyan" | "emerald" | "violet" }) {
  const tones = { cyan: "border-cyan-500/30 bg-cyan-500/10", emerald: "border-emerald-500/30 bg-emerald-500/10", violet: "border-violet-500/30 bg-violet-500/10" };
  return <div className={`rounded-3xl border p-5 ${tones[tone]}`}><p className="text-sm text-slate-300">{title}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-300">{subtitle}</p></div>;
}
