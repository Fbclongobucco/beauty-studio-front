import type { Metadata } from "next";
import { Suspense } from "react";
import { MyWhatsApp } from "@/components/admin/MyWhatsApp";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Serviços" };

export default function ServicosPage() {
  return (
    <Suspense fallback={<Spinner />}>
      {/* Só para a profissional: fica no topo, com a âncora #meu-whatsapp do aviso do painel */}
      <MyWhatsApp />
      <ServicesAdmin />
    </Suspense>
  );
}
