import { Shell, StudentDashboard } from "@/components/dashboard";
import { StudentLogin } from "@/components/dashboard";
import { cookies } from "next/headers";

export default async function AlumnoPage() {
  if (!(await cookies()).get("student_session")?.value) return <StudentLogin />;
  return <Shell role="student"><StudentDashboard /></Shell>;
}
