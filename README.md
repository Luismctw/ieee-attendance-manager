# IEEE Attendance Manager

Aplicación web para registrar asistencia a juntas IEEE mediante QR y preparar justificantes grupales.

## Estado actual

- `/` — acceso a los espacios de alumno y administrador.
- `/alumno` — consulta la junta activa y escanea el QR.
- `/admin` — protegida por PIN; permite crear juntas, generar QR e importar el padrón.
- El padrón y las juntas se guardan temporalmente en `localStorage` como respaldo; con las variables de Supabase configuradas también se sincronizan con PostgreSQL.
- La importación acepta `.xlsx`, `.xls` y `.csv`, muestra una vista previa y normaliza columnas comunes como `Nombre`, `Control`, `Correo`, `Carrera`, `Grupo`, `Materia`, `Profesor`, `Hora inicio` y `Hora fin`.
- La asistencia se valida en servidor: junta activa, fecha/hora de México, alumno existente y duplicados.
- El panel administrativo consulta contadores reales y puede generar justificantes cruzando la asistencia con los horarios importados.

## Desarrollo local

```bash
npm install
npm run dev
```

El PIN local se configura en `.env.local`:

```env
ADMIN_PIN=7551
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica
```

## Activar la base de datos

Abre el proyecto de Supabase, entra en **SQL Editor**, pega el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y ejecuta el script completo. Después de crear las tablas, la aplicación podrá sincronizar juntas y alumnos entre dispositivos. Las políticas incluidas son adecuadas para esta etapa de prototipo; antes de operar con datos reales se debe añadir autenticación institucional y restringir las políticas por usuario.

## Siguiente etapa de crecimiento

La interfaz ya separa la experiencia de alumno y administración, valida la asistencia en una Route Handler y genera justificantes con solape de horarios. La siguiente etapa es añadir autenticación institucional, restringir RLS por usuario, mostrar el detalle completo de asistentes y generar el PDF oficial.
