"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
} as const;

const SUPPORTED_FORMATS_LABEL = "PDF, PNG, JPG, JPEG";

export interface UploaderProps {
  denialFile: File | null;
  policyFile: File | null;
  onDenialFileChange: (file: File | null) => void;
  onPolicyFileChange: (file: File | null) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRejectionMessage(rejections: FileRejection[]): string {
  const error = rejections[0]?.errors[0];

  if (!error) {
    return "Invalid file. Please try again.";
  }

  switch (error.code) {
    case "file-too-large":
      return "File is too large. Maximum size is 20 MB.";
    case "file-invalid-type":
      return "Invalid file type. Accepted formats: PDF, PNG, JPG, JPEG.";
    case "too-many-files":
      return "Please upload only one file at a time.";
    default:
      return error.message || "Invalid file. Please try again.";
  }
}

interface UploadCardProps {
  id: string;
  title: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

function UploadCard({
  id,
  title,
  description,
  file,
  onFileChange,
  disabled = false,
}: UploadCardProps) {
  const [error, setError] = useState<string | null>(null);

  const onDropAccepted = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setError(null);
        onFileChange(selectedFile);
      }
    },
    [onFileChange],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    setError(getRejectionMessage(rejections));
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } =
    useDropzone({
      accept: ACCEPTED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      multiple: false,
      onDropAccepted,
      onDropRejected,
      noClick: !!file || disabled,
      noKeyboard: !!file || disabled,
      disabled: disabled,
    });

  const handleRemove = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setError(null);
      onFileChange(null);
    },
    [onFileChange],
  );

  const hasError = Boolean(error) || isDragReject;
  const hasSuccess = Boolean(file);

  return (
    <Card className="flex h-full flex-col border border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div
          {...getRootProps()}
          aria-describedby={`${id}-hint ${error ? `${id}-error` : ""}`}
          aria-invalid={hasError}
          aria-label={`${title} upload area`}
          className={cn(
            "flex min-h-56 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            disabled ? "cursor-not-allowed border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20" : "cursor-pointer",
            hasSuccess && !disabled &&
              "border-primary/40 bg-primary/5 hover:border-primary/50",
            hasSuccess && disabled &&
              "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/10",
            !hasSuccess &&
              isDragActive &&
              !isDragReject &&
              "border-primary bg-primary/5",
            !hasSuccess &&
              isDragActive &&
              isDragReject &&
              "border-destructive bg-destructive/5",
            !hasSuccess &&
              !isDragActive &&
              hasError &&
              "border-destructive/60 bg-destructive/5",
            !hasSuccess &&
              !isDragActive &&
              !hasError &&
              !disabled &&
              "border-border hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <input {...getInputProps()} id={`${id}-input`} />

          {file ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-7 text-primary"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  File uploaded successfully
                </p>
                <p className="break-all text-sm text-muted-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                aria-label={`Remove ${file.name}`}
                onClick={handleRemove}
                disabled={disabled}
                size="sm"
                type="button"
                variant="outline"
              >
                <X aria-hidden="true" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-4">
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-full",
                  isDragActive && !isDragReject
                    ? "bg-primary/10"
                    : "bg-muted",
                )}
              >
                {isDragActive && !isDragReject ? (
                  <FileText
                    aria-hidden="true"
                    className="size-7 text-primary"
                  />
                ) : (
                  <Upload
                    aria-hidden="true"
                    className="size-7 text-muted-foreground"
                  />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {isDragActive && !isDragReject
                    ? "Drop your file here"
                    : "Drag & drop your file here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or{" "}
                  <button
                    className={cn(
                      "font-medium text-primary underline-offset-4",
                      disabled ? "cursor-not-allowed opacity-50" : "hover:underline"
                    )}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!disabled) {
                        open();
                      }
                    }}
                    disabled={disabled}
                    type="button"
                  >
                    click to browse
                  </button>
                </p>
              </div>
              <p
                className="text-xs text-muted-foreground"
                id={`${id}-hint`}
              >
                Supported formats: {SUPPORTED_FORMATS_LABEL} · Max 20 MB
              </p>
            </div>
          )}
        </div>

        {error ? (
          <div
            aria-live="polite"
            className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            id={`${id}-error`}
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function Uploader({
  denialFile,
  policyFile,
  onDenialFileChange,
  onPolicyFileChange,
  disabled = false,
}: UploaderProps) {
  return (
    <section className="py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UploadCard
          description="Upload a denial letter (PDF or Image)"
          file={denialFile}
          id="denial-upload"
          onFileChange={onDenialFileChange}
          disabled={disabled}
          title="Insurance Claim Denial Letter"
        />
        <UploadCard
          description="Upload your insurance policy document (PDF or Image)"
          file={policyFile}
          id="policy-upload"
          onFileChange={onPolicyFileChange}
          disabled={disabled}
          title="Insurance Policy"
        />
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed select-none">
        Documents are analyzed for demonstration purposes. Always review generated appeals before submission.
      </p>
    </section>
  );
}
