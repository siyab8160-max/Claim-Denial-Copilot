import { Check } from "lucide-react";

export function Hero() {
  const trustBadges = [
    "AI-powered policy analysis",
    "Grounded appeal generation",
    "Secure document processing",
  ];

  return (
    <section className="py-16 text-center sm:py-20 select-none">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-100 leading-tight">
        Resolve Claim Denials Faster
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
        Upload denial letters and get actionable, contract-backed insights to recover medical revenue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {trustBadges.map((badge, idx) => (
          <span 
            key={idx}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full shadow-2xs"
          >
            <Check className="size-3 text-emerald-500 shrink-0" />
            <span>{badge}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
