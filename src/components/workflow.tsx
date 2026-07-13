"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Loader2, 
  FileText, 
  FileCheck2, 
  Search, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMotionVariants } from "@/lib/animations";

interface WorkflowProps {
  loading: boolean;
  loadingStep: string;
  denialFile: File | null;
  policyFile: File | null;
  hasResult: boolean;
}

export function Workflow({ 
  loading, 
  loadingStep, 
  denialFile, 
  policyFile, 
  hasResult 
}: WorkflowProps) {
  const { fadeIn, slideUp, scaleIn } = useMotionVariants();
  
  const steps = [
    {
      id: "reading",
      label: "Reading documents...",
      desc: "Parsing upload payload and scanning OCR data streams.",
      icon: FileText,
    },
    {
      id: "understanding",
      label: "Understanding denial...",
      desc: "Analyzing claim denial codes, logic, and health insurance jargon.",
      icon: Search,
    },
    {
      id: "finding",
      label: "Finding policy clauses...",
      desc: "Cross-referencing insurance policy terms with the denial arguments.",
      icon: ShieldCheck,
    },
    {
      id: "generating",
      label: "Generating appeal...",
      desc: "Drafting the medical appeal letter backed by policy clauses.",
      icon: Sparkles,
    },
  ];

  const getStepStatus = (index: number) => {
    if (!loading) {
      return hasResult ? "completed" : "pending";
    }

    let activeIndex = 0;
    if (loadingStep.includes("Reading") || loadingStep.includes("Extracting")) {
      activeIndex = 0;
    } else if (loadingStep.includes("Consulting")) {
      activeIndex = 1;
    } else if (loadingStep.includes("Comparing")) {
      activeIndex = 2;
    } else if (loadingStep.includes("Drafting") || loadingStep.includes("Finalizing")) {
      activeIndex = 3;
    }

    if (index < activeIndex) return "completed";
    if (index === activeIndex) return "active";
    return "pending";
  };

  const isDocUploaded = !!denialFile && !!policyFile;

  return (
    <section className="py-8 select-none">
      <Card className="border border-slate-200/60 dark:border-slate-800/40 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Analysis Pipeline
              </CardTitle>
              <CardDescription className="text-xs">
                Track the AI diagnosis and appeal drafting progression
              </CardDescription>
            </div>
            {/* Visual Header Pipeline Badges */}
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full border transition-all duration-300",
                isDocUploaded 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "bg-slate-50 text-slate-400 border-slate-200/60 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/50"
              )}>
                1. Uploads
              </span>
              <ArrowRight className="size-3 text-slate-300 dark:text-slate-700" />
              <span className={cn(
                "px-2.5 py-0.5 rounded-full border transition-all duration-300",
                loading 
                  ? "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30 animate-pulse"
                  : hasResult 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-slate-50 text-slate-400 border-slate-200/60 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/50"
              )}>
                2. AI Diagnosis
              </span>
              <ArrowRight className="size-3 text-slate-300 dark:text-slate-700" />
              <span className={cn(
                "px-2.5 py-0.5 rounded-full border transition-all duration-300",
                hasResult 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "bg-slate-50 text-slate-400 border-slate-200/60 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700/50"
              )}>
                3. Letter Ready
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <AnimatePresence mode="wait">
            {/* STATE 1: Documents Awaiting */}
            {!isDocUploaded && !loading && !hasResult && (
              <motion.div
                key="awaiting-files"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={slideUp}
                className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-dashed border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-3 border border-slate-200/30 dark:border-slate-700/30">
                  <FileCheck2 className="size-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Awaiting Documents
                </h4>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Upload both the Insurance Claim Denial Letter and your Policy document to unlock deep analysis and drafting.
                </p>
                {/* File checklist badges */}
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                    denialFile 
                      ? "bg-emerald-50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400"
                      : "bg-amber-50/60 border-amber-200/50 text-amber-700 dark:bg-amber-950/10 dark:text-amber-400"
                  )}>
                    {denialFile ? <Check className="size-2.5" /> : <AlertCircle className="size-2.5" />}
                    Denial Letter {denialFile ? "Ready" : "Needed"}
                  </span>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border",
                    policyFile 
                      ? "bg-emerald-50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/10 dark:text-emerald-400"
                      : "bg-amber-50/60 border-amber-200/50 text-amber-700 dark:bg-amber-950/10 dark:text-amber-400"
                  )}>
                    {policyFile ? <Check className="size-2.5" /> : <AlertCircle className="size-2.5" />}
                    Insurance Policy {policyFile ? "Ready" : "Needed"}
                  </span>
                </div>
              </motion.div>
            )}

            {/* STATE 2: Processing Diagnostics (Simulation Stepper) */}
            {loading && (
              <motion.div
                key="processing"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeIn}
                className="space-y-6"
              >
                {/* Steps Checklist */}
                <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 dark:before:bg-slate-800">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(idx);
                    const StepIcon = step.icon;

                    return (
                      <div key={step.id} className="relative flex gap-4">
                        {/* Step Marker Indicator */}
                        <div className="absolute -left-8 flex size-7 items-center justify-center rounded-full bg-white dark:bg-slate-900 z-10">
                          {status === "completed" ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              className="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                            >
                              <Check className="size-3.5 stroke-[3px]" />
                            </motion.div>
                          ) : status === "active" ? (
                            <div className="flex size-7 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-500 text-primary relative shadow-xs">
                              <Loader2 className="size-3.5 animate-spin text-primary" />
                              <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 opacity-75"></span>
                            </div>
                          ) : (
                            <div className="flex size-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-muted-foreground bg-slate-50 dark:bg-slate-950 text-xs font-semibold">
                              {idx + 1}
                            </div>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 space-y-0.5 pb-2 flex items-start gap-2.5">
                          <StepIcon className={cn("size-4 mt-0.5 shrink-0", 
                            status === "active" ? "text-primary animate-pulse" : "text-muted-foreground"
                          )} />
                          <div>
                            <h5 className={cn(
                              "text-xs font-bold transition-colors duration-300",
                              status === "completed" && "text-slate-400 dark:text-slate-500",
                              status === "active" && "text-primary dark:text-blue-400",
                              status === "pending" && "text-slate-400 dark:text-slate-600"
                            )}>
                              {step.label}
                            </h5>
                            <p className={cn(
                              "text-[11px] leading-relaxed transition-colors duration-300 mt-0.5",
                              status === "active" ? "text-slate-600 dark:text-slate-300" : "text-muted-foreground/60 dark:text-muted-foreground/45"
                            )}>
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STATE 3: Success Completion */}
            {hasResult && !loading && (
              <motion.div
                key="completed"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={scaleIn}
                className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-emerald-500/5 dark:bg-emerald-500/2 border border-emerald-500/20 shadow-xs"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3 border border-emerald-500/20 animate-bounce">
                  <Sparkles className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Analysis Complete
                </h4>
                <p className="mt-1 max-w-sm text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The AI Copilot has compiled your policy clauses and matched them against the denial arguments. An appeal draft has been finalized!
                </p>
                <div className="mt-4 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Check className="size-3.5" /> Ready to review in the Results editor below
                </div>
              </motion.div>
            )}

            {/* STATE 4: Ready to Run */}
            {isDocUploaded && !loading && !hasResult && (
              <motion.div
                key="ready-to-run"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={slideUp}
                className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-primary/5 dark:bg-primary/2 border border-primary/20"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3 border border-primary/20">
                  <FileCheck2 className="size-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Documents Verified
                </h4>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Both files are successfully uploaded. Click the <strong>Analyze Claim Denial</strong> button above to launch the copilot.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </section>
  );
}
