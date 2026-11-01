import { AdminShell } from "@/components/admin/AdminShell";

export default function PainelLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
