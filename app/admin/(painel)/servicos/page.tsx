import type { Metadata } from "next";
import { Suspense } from "react";
import { ServicesAdmin } from "@/components/admin/ServicesAdmin";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Serviços" };

export default function ServicosPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ServicesAdmin />
    </Suspense>
  );
}
