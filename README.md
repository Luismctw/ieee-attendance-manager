# IEEE Attendance Manager

Aplicación web para registrar asistencia a juntas IEEE mediante QR y preparar justificantes grupales.

## Estado actual

- `/` — acceso a los espacios de alumno y administrador.
- `/alumno` — consulta la junta activa y escanea el QR.
- `/admin` — protegida por PIN; permite crear juntas, generar QR e importar el padrón.
- El padrón y las juntas se guardan temporalmente en `localStorage` como respaldo; con las variables de Supabase configuradas también se sincronizan con PostgreSQL.
- La importación acepta `.xlsx`, `.xls` y `.csv`, muestra una vista previa y normaliza columnas comunes como `Nombre`, `Control`, `Correo`, `Carrera`, `Grupo`, `Materia`, `Profesor`, `Hora inicio` y `Hora fin`.
- Los alumnos inician sesión con número de control y PIN personal; el Excel puede incluir una columna `PIN`, que se almacena únicamente como hash.
- La asistencia se valida en servidor: junta activa, fecha/hora de México, alumno existente y duplicados.
- El panel administrativo consulta contadores reales y puede generar justificantes cruzando la asistencia con los horarios importados.
- El detalle administrativo muestra asistentes y justificantes reales; estos últimos permiten editar notas e imprimir/guardar como PDF desde el navegador.

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
SUPABASE_SERVICE_ROLE_KEY=tu-clave-privada-solo-en-servidor
```

## Activar la base de datos

Abre el proyecto de Supabase, entra en **SQL Editor**, pega el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y ejecuta el script completo. Después de crear las tablas, la aplicación podrá sincronizar juntas y alumnos entre dispositivos. Las políticas incluidas son adecuadas para esta etapa de prototipo; antes de operar con datos reales se debe añadir autenticación institucional y restringir las políticas por usuario.

## Siguiente etapa de crecimiento

La interfaz ya separa la experiencia de alumno y administración, valida la asistencia en una Route Handler, genera justificantes con solape de horarios y permite imprimirlos. La autenticación de alumnos usa sesiones propias con control + PIN y las operaciones sensibles del servidor requieren `SUPABASE_SERVICE_ROLE_KEY`, que nunca debe exponerse al navegador.
