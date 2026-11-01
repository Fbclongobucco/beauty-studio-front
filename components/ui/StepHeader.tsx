export function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <header className="mb-6">
      <p className="text-base font-bold text-cocoa">
        Passo {step} de {total}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${i < step ? "bg-cocoa" : "bg-blush-2"}`}
          />
        ))}
      </div>
      <h1 className="mt-4 font-brand text-2xl font-semibold leading-tight text-coffee">{title}</h1>
    </header>
  );
}
