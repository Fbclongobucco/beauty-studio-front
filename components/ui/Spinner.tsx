export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-8 text-coffee">
      <span className="h-6 w-6 animate-spin rounded-full border-4 border-blush-2 border-t-cocoa" />
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-blush ${className}`} />;
}
