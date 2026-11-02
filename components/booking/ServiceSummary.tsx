import type { PublicService } from "@/lib/domain/types";
import { formatDuration, formatPrice } from "@/lib/domain/format";

export function ServiceSummary({ service }: { service: PublicService }) {
  return (
    <p className="mb-5 rounded-2xl bg-blush px-4 py-3 text-base lg:hidden">
      <span className="font-bold">{service.name}</span> · {formatDuration(service.durationMin)} ·{" "}
      <span className="whitespace-nowrap">{formatPrice(service.priceCents)}</span>
      <br />
      com {service.professional.name}
    </p>
  );
}
