"use client";

import { useState, useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Results } from "@/components/results";
import { Uploader } from "@/components/Uploader";
import { Workflow } from "@/components/workflow";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/types";

import { Check } from "lucide-react";
import { useMotionVariants } from "@/lib/animations";

const loadingMessages = [
  "Reading uploaded documents...",
  "Extracting policy text...",
  "Consulting Gemini...",
  "Comparing policy clauses...",
  "Drafting appeal letter...",
  "Finalizing analysis...",
];

export default function Home() {
  const [denialFile, setDenialFile] = useState<File | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [metadata, setMetadata] = useState<{ requestId: string; processingTimeMs: number } | null>(null);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const { fadeIn, scaleIn } = useMotionVariants();

  // Rotate loading steps every 1.25 seconds while API request is pending
  useEffect(() => {
    if (!loading) {
      setLoadingStep("");
      return;
    }

    setLoadingStep(loadingMessages[0]);
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingStep(loadingMessages[index]);
    }, 1250);

    return () => {
      clearInterval(interval);
    };
  }, [loading]);

  // Clean up in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAnalyze = async () => {
    if (!denialFile || !policyFile) return;

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);
    setMetadata(null);
    setShowSuccess(false);

    // Optimistic UI: Smoothly scroll to the progress checkpoint
    setTimeout(() => {
      const workflowSection = document.getElementById("workflow-section");
      if (workflowSection) {
        workflowSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    const formData = new FormData();
    formData.append("denialDocument", denialFile);
    formData.append("policyDocument", policyFile);

    let success = false;
    let apiResult: AnalysisResult | null = null;
    let apiMetadata: { requestId: string; processingTimeMs: number } | null = null;

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        let title = "Analysis Failed";
        let message = "An error occurred while communicating with the server.";
        try {
          const errJson = await response.json();
          title = errJson.title || title;
          message = errJson.message || message;
        } catch {
          // Fallback to HTTP status text
        }
        throw new Error(JSON.stringify({ title, message }));
      }

      const data = await response.json();
      if (!data.success || !data.result) {
        throw new Error(
          JSON.stringify({
            title: data.title || "AI Response Error",
            message: data.message || "Invalid AI response structure.",
          })
        );
      }

      success = true;
      apiResult = data.result;
      apiMetadata = {
        requestId: data.requestId,
        processingTimeMs: data.processingTimeMs,
      };
    } catch (err: unknown) {
      // Avoid setting error state for user-triggered cancellations
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Analysis aborted by user.");
        return;
      }
      
      try {
        const parsedError = JSON.parse(err instanceof Error ? err.message : "");
        setError({
          title: parsedError.title || "Analysis Failed",
          message: parsedError.message || "An unexpected error occurred.",
        });
      } catch {
        setError({
          title: "Connection Failed",
          message: err instanceof Error ? err.message : "A network error occurred. Please verify your internet connection.",
        });
      }
    } finally {
      setLoading(false);
      setLoadingStep("");
      abortControllerRef.current = null;

      if (success && apiResult && apiMetadata) {
        setShowSuccess(true);
        
        // Wait 1.5 seconds for the success visual confirmation check mark
        setTimeout(() => {
          setShowSuccess(false);
          setResult(apiResult);
          setMetadata(apiMetadata);
          
          // Smoothly scroll to the results section once ready
          setTimeout(() => {
            const resultsSection = document.getElementById("results-section");
            if (resultsSection) {
              resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 100);
        }, 1500);
      }
    }
  };

  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setDenialFile(null);
    setPolicyFile(null);
    setLoading(false);
    setLoadingStep("");
    setResult(null);
    setMetadata(null);
    setError(null);
    setShowSuccess(false);
  };

  const isAnalyzeDisabled = !denialFile || !policyFile || loading;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 pb-20">
      <Header />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Hero />
        
        {/* Upload & Analyze Workspace */}
        {result === null && !loading && !showSuccess && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <Uploader
              denialFile={denialFile}
              onDenialFileChange={setDenialFile}
              onPolicyFileChange={setPolicyFile}
              policyFile={policyFile}
              disabled={loading}
            />

            {/* Analyze Control Center */}
            <div className="flex flex-col items-center justify-center py-8 border border-slate-200/60 dark:border-slate-800/40 my-6 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm">
              <Button
                size="lg"
                className="relative overflow-hidden px-10 py-6 text-base font-semibold shadow-xs hover:shadow-md transition-all duration-300 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl disabled:cursor-not-allowed disabled:shadow-none"
                disabled={isAnalyzeDisabled}
                onClick={handleAnalyze}
              >
                Analyze Claim Denial
              </Button>
              
              {error && (
                <div className="mt-4 p-5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl mx-auto shadow-xs select-none animate-shake">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="size-5 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-sm text-left">{error.title}</h5>
                      <p className="text-xs text-destructive/80 mt-1 text-left">{error.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-auto shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="h-8 border-destructive/20 hover:bg-destructive/10 text-destructive-foreground text-xs"
                    >
                      Start Over
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAnalyze}
                      className="h-8 bg-destructive text-white hover:bg-destructive/90 text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {!denialFile || !policyFile ? (
                <p className="mt-3 text-xs text-muted-foreground text-center select-none">
                  {!denialFile && !policyFile && "Upload your Denial Letter and Policy to begin."}
                  {denialFile && !policyFile && "Great! Now upload your Insurance Policy."}
                  {!denialFile && policyFile && "Now upload your Claim Denial Letter."}
                </p>
              ) : (
                !loading && !error && (
                  <p className="mt-3 text-xs text-primary font-medium text-center animate-pulse select-none">
                    Ready! Click the button above to start your AI copilot.
                  </p>
                )
              )}
            </div>
          </motion.div>
        )}

        {/* Stepper progress pipeline */}
        {loading && (
          <div id="workflow-section">
            <Workflow 
              loading={loading} 
              loadingStep={loadingStep} 
              denialFile={denialFile}
              policyFile={policyFile}
              hasResult={result !== null}
            />
          </div>
        )}

        {/* Success Confirmation Animation card */}
        {showSuccess && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={scaleIn}
            className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-8 my-6 shadow-sm max-w-md mx-auto select-none"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 mb-4 animate-bounce">
              <Check className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Analysis Complete!
            </h3>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              We mapped the denial reasons and policy clauses successfully. Loading results dashboard...
            </p>
          </motion.div>
        )}

        {/* Dashboard Results */}
        {result !== null && !loading && !showSuccess && (
          <div id="results-section">
            <Results 
              result={result} 
              metadata={metadata}
              loading={loading}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
