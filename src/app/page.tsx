import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/20 sm:p-12">
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">IEEE Attendance Manager</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">Asistencia simple. Justificantes listos.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Elige tu espacio para consultar juntas, registrar asistencia y administrar justificantes grupales.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link href="/alumno" className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 transition hover:border-cyan-300 hover:bg-cyan-500/20"><p className="text-sm text-cyan-200">Acceso personal</p><p className="mt-2 text-xl font-semibold text-white">Soy alumno →</p><p className="mt-2 text-sm text-slate-300">Escanea tu QR y consulta tu historial.</p></Link>
            <Link href="/admin" className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5 transition hover:border-violet-300 hover:bg-violet-500/20"><p className="text-sm text-violet-200">Acceso administrativo</p><p className="mt-2 text-xl font-semibold text-white">Soy administrador →</p><p className="mt-2 text-sm text-slate-300">Crea juntas y genera justificantes.</p></Link>
          </div>
          <p className="mt-8 text-sm text-slate-500">Prototipo visual · Autenticación institucional y backend pendientes de conexión.</p>
        </section>
      </div>
    </main>
  );
}
