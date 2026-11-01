import type { Metadata } from "next";
import { Suspense } from "react";
import { AgendaView } from "@/components/admin/AgendaView";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AgendaView />
    </Suspense>
  );
}
