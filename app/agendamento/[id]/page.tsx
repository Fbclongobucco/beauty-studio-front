import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/public/PageShell";
import { AppointmentStatus } from "@/components/booking/AppointmentStatus";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Seu agendamento" };

export default function AgendamentoPage() {
  return (
    <PageShell>
      <Suspense fallback={<Spinner />}>
        <AppointmentStatus />
      </Suspense>
    </PageShell>
  );
}
