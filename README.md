# IEEE Attendance Manager

Aplicación web para registrar asistencia a juntas IEEE mediante QR y preparar justificantes grupales.

## Estado actual

- `/` — acceso a los espacios de alumno y administrador.
- `/alumno` — consulta la junta activa y escanea el QR.
- `/admin` — protegida por PIN; permite crear juntas, generar QR e importar el padrón.
- El padrón y las juntas se guardan temporalmente en `localStorage` para que el prototipo no pierda datos al navegar.
- La importación acepta `.xlsx`, `.xls` y `.csv`, muestra una vista previa y normaliza columnas comunes como `Nombre`, `Control`, `Correo`, `Carrera`, `Grupo`, `Materia`, `Profesor`, `Hora inicio` y `Hora fin`.

## Desarrollo local

```bash
npm install
npm run dev
```

El PIN local se configura en `.env.local`:

```env
ADMIN_PIN=7551
```

## Siguiente etapa de crecimiento

La interfaz ya separa la experiencia de alumno y administración y tiene contratos de datos claros (`Meeting` y `Student`). La siguiente integración recomendada es mover `localStorage` a Supabase/PostgreSQL, conservar el PIN como secreto del servidor, añadir autenticación institucional y persistir asistencias y horarios por usuario.
