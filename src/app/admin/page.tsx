import { AdminDashboard, AdminLogin, Shell } from "@/components/dashboard";
import { cookies } from "next/headers";

export default async function AdminPage() {
  const session = (await cookies()).get("admin_session")?.value;
  if (session !== "authenticated") {
    return <AdminLogin />;
  }
  return <Shell role="admin"><AdminDashboard /></Shell>;
}
