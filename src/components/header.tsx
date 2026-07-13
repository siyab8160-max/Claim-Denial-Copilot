import { Stethoscope } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/30 text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Claim Denial Copilot
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20">
            Beta Engine
          </span>
        </div>
      </div>
    </header>
  );
}
