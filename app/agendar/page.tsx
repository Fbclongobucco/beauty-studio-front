import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/public/PageShell";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Agendar horário" };

export default function AgendarPage() {
  return (
    <PageShell>
      <Suspense fallback={<Spinner />}>
        <BookingWizard />
      </Suspense>
    </PageShell>
  );
}
