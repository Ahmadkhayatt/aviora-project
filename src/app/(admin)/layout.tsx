import { requireAdmin } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check - redirects if not admin
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
