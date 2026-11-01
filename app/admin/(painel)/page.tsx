import type { Metadata } from "next";
import { PendingList } from "@/components/admin/PendingList";

export const metadata: Metadata = { title: "Pedidos" };

export default function PedidosPage() {
  return <PendingList />;
}
