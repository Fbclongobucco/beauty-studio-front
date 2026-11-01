import type { Metadata } from "next";
import { Suspense } from "react";
import { EarningsView } from "@/components/admin/EarningsView";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Ganhos" };

export default function GanhosPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <EarningsView />
    </Suspense>
  );
}
