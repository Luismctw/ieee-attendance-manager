"use client";

import Link from "next/link";

export function Shell({
  role,
  children,
}: {
  role: "student" | "admin";
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">
                IEEE Attendance Manager
              </Link>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                {role === "student" ? "Mi asistencia" : "Panel de administración"}
              </h1>
            </div>
            <nav className="flex flex-wrap items-center gap-2 rounded-full border border-slate-700 bg-slate-950 p-1">
              <Link href="/alumno" className={`rounded-full px-4 py-2 text-sm font-medium ${role === "student" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>
                Alumno
              </Link>
              <Link href="/admin" className={`rounded-full px-4 py-2 text-sm font-medium ${role === "admin" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>
                Administrador
              </Link>
              <Link href="/" className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800">
                Cerrar sesión
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

const studentSessions = [
  ["Reunión General IEEE", "21 sep 2026", "10:00 - 11:00", "Asistió"],
  ["Taller de Networking", "25 sep 2026", "18:00 - 19:30", "Pendiente"],
  ["Capacitación GitHub", "02 oct 2026", "16:00 - 17:30", "Justificante"],
];

const studentClasses = [
  ["Cálculo Diferencial", "09:00 - 12:00", "A-204", "3°A"],
  ["Física", "10:00 - 11:00", "B-101", "2°B"],
  ["Programación", "16:00 - 17:30", "Lab 3", "5°B"],
];

export function StudentDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <StatCard title="Próxima junta" value="Reunión General IEEE" subtitle="21 sep • 10:00 - 11:00 • Auditorio B" tone="cyan" />
        <StatCard title="Asistencias" value="6 / 8" subtitle="96% de cumplimiento" tone="emerald" />
        <StatCard title="Justificantes" value="3" subtitle="2 aprobados y 1 en revisión" tone="violet" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Registro</p><h2 className="mt-2 text-2xl font-semibold text-white">Escanear asistencia</h2></div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">QR activo</span>
          </div>
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-6">
              <div className="grid grid-cols-7 gap-1.5 rounded-xl bg-slate-900 p-3">
                {Array.from({ length: 49 }).map((_, index) => <span key={index} className={`h-2.5 w-2.5 rounded-[2px] ${index % 3 === 0 || index % 5 === 0 ? "bg-slate-100" : index % 2 === 0 ? "bg-slate-600" : "bg-cyan-400"}`} />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Alumno</p><p className="mt-2 text-lg font-semibold text-white">Luis Martínez Cárdenas</p><p className="mt-1 text-sm text-slate-400">A017XXXXXX@alumno.xxx.edu.mx</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm text-slate-400">Junta disponible</p><ul className="mt-2 space-y-2 text-sm text-slate-300"><li>• 21 sep 2026</li><li>• 10:00 - 11:00 • Auditorio B</li><li>• Un registro por alumno</li></ul></div>
              <button className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Escanear QR</button>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Actividad</p><div className="mt-5 space-y-4">{studentSessions.map(([title, date, time, status]) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{title}</p><p className="mt-1 text-sm text-slate-400">{date} • {time}</p></div><Status value={status} /></div></div>)}</div></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Historial</p><h3 className="mt-2 text-2xl font-semibold text-white">Mi asistencia</h3><div className="mt-6 overflow-hidden rounded-2xl border border-slate-800"><table className="min-w-full text-left text-sm"><thead className="bg-slate-950 text-slate-300"><tr><th className="px-4 py-3 font-medium">Junta</th><th className="px-4 py-3 font-medium">Fecha</th><th className="px-4 py-3 font-medium">Estado</th></tr></thead><tbody className="divide-y divide-slate-800 bg-slate-900">{studentSessions.map(([title, date, , status]) => <tr key={title}><td className="px-4 py-3 text-slate-200">{title}</td><td className="px-4 py-3 text-slate-300">{date}</td><td className="px-4 py-3"><Status value={status} /></td></tr>)}</tbody></table></div></div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Horario</p><h3 className="mt-2 text-2xl font-semibold text-white">Mis clases</h3><div className="mt-6 space-y-3">{studentClasses.map(([name, time, room, group]) => <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><p className="font-semibold text-white">{name}</p><p className="mt-1 text-sm text-slate-300">{time} • {room}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{group}</p></div>)}</div></div>
      </section>
    </div>
  );
}

const adminStats = [["Juntas activas", "4", "+2"], ["Asistencias", "186", "+18"], ["Pendientes", "24", "-5"], ["Justificantes", "31", "+9"]];
const attendanceList = [["Ana López Ramírez", "20310456", "Cálculo", "Asistió", "10:02"], ["Carlos Méndez Ruiz", "20310478", "Física", "Pendiente", "-"], ["Diana Torres Vega", "20310501", "Química", "Asistió", "10:15"], ["Emilio Rojas Castro", "20310492", "Álgebra", "Justificante", "10:30"]];
const justificantes = [["Cálculo Diferencial", "3°A", "Ing. Juan Pérez", "12"], ["Física", "2°B", "Dr. Elena García", "8"], ["Química", "4°A", "Dr. Omar Vega", "10"]];

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{adminStats.map(([label, value, delta]) => <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><div className="mt-4 flex items-end justify-between"><span className="text-3xl font-bold text-white">{value}</span><span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-300">{delta}</span></div></div>)}</section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Control</p><h2 className="mt-2 text-2xl font-semibold text-white">Juntas activas</h2></div><button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Nueva junta</button></div><div className="space-y-4">{[["Reunión General IEEE", "21 sep 2026", "10:00 - 11:00", "Abierta"], ["Taller de Networking", "25 sep 2026", "18:00 - 19:30", "Programada"], ["Capacitación GitHub", "02 oct 2026", "16:00 - 17:30", "En revisión"]].map(([name, date, time, status]) => <div key={name} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{name}</p><p className="text-sm text-slate-400">{date} • {time}</p></div><Status value={status} /></div>)}</div></div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Acciones rápidas</p><div className="mt-5 space-y-3">{["Generar QR", "Exportar reporte", "Ver lista completa", "Revisar justificantes"].map((action) => <button key={action} className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-800"><span>{action}</span><span className="text-cyan-300">→</span></button>)}</div></div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Asistencia</p><h3 className="mt-2 text-2xl font-semibold text-white">Lista de registrados</h3><div className="mt-6 overflow-hidden rounded-2xl border border-slate-800"><table className="min-w-full text-left text-sm"><thead className="bg-slate-950 text-slate-300"><tr><th className="px-4 py-3 font-medium">Alumno</th><th className="px-4 py-3 font-medium">Clase</th><th className="px-4 py-3 font-medium">Estado</th><th className="px-4 py-3 font-medium">Hora</th></tr></thead><tbody className="divide-y divide-slate-800 bg-slate-900">{attendanceList.map(([name, control, className, status, time]) => <tr key={control}><td className="px-4 py-3"><p className="font-medium text-slate-100">{name}</p><p className="text-xs text-slate-400">{control}</p></td><td className="px-4 py-3 text-slate-300">{className}</td><td className="px-4 py-3"><Status value={status} /></td><td className="px-4 py-3 text-slate-300">{time}</td></tr>)}</tbody></table></div></div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Generación</p><h3 className="mt-2 text-2xl font-semibold text-white">Justificantes</h3><div className="mt-6 space-y-4">{justificantes.map(([course, section, professor, students]) => <div key={course} className="rounded-2xl border border-slate-800 bg-slate-950 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-white">{course}</p><p className="text-sm text-slate-400">{section} • {professor}</p></div><span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-medium text-cyan-300">{students} alumnos</span></div></div>)}</div></div>
      </section>
    </div>
  );
}

function Status({ value }: { value: string }) {
  const classes = value === "Asistió" || value === "Abierta" ? "bg-emerald-500/15 text-emerald-300" : value === "Pendiente" || value === "En revisión" ? "bg-amber-500/15 text-amber-300" : "bg-cyan-500/15 text-cyan-300";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>{value}</span>;
}

function StatCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: "cyan" | "emerald" | "violet" }) {
  const tones = { cyan: "border-cyan-500/30 bg-cyan-500/10", emerald: "border-emerald-500/30 bg-emerald-500/10", violet: "border-violet-500/30 bg-violet-500/10" };
  return <div className={`rounded-3xl border p-5 ${tones[tone]}`}><p className="text-sm text-slate-300">{title}</p><p className="mt-4 text-3xl font-bold text-white">{value}</p><p className="mt-2 text-sm text-slate-300">{subtitle}</p></div>;
}
