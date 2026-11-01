import type { Metadata } from "next";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";

export const metadata: Metadata = { title: "Serviços" };

export default function ServicosPage() {
  return <ServicesAdmin />;
}
