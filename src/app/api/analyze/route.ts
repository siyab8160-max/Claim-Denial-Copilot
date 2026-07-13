import { NextResponse } from "next/server";
import { fileToBase64 } from "@/lib/pdf";
import { analyzeDocuments, GeminiAPIError } from "@/lib/gemini";
import { logger } from "@/lib/logger";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  logger.info(`Request received. Request ID: ${requestId}`);

  try {
    // 1. Verify content-type header
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, title: "Invalid Request", message: "Missing files" },
        { status: 400 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const denialDocument = formData.get("denialDocument");
    const policyDocument = formData.get("policyDocument");

    // 3. Validate existence
    if (!denialDocument || !policyDocument) {
      return NextResponse.json(
        { success: false, title: "Missing Files", message: "Both denial letter and policy document must be uploaded." },
        { status: 400 }
      );
    }

    if (
      !(denialDocument instanceof File) ||
      !(policyDocument instanceof File)
    ) {
      return NextResponse.json(
        { success: false, title: "Invalid Files", message: "Uploaded payloads must be valid files." },
        { status: 400 }
      );
    }

    // 4. Validate size (413 Payload Too Large)
    if (denialDocument.size > MAX_FILE_SIZE || policyDocument.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, title: "File Too Large", message: "Each document must be under 20 MB." },
        { status: 413 }
      );
    }

    // 5. Validate MIME type (415 Unsupported Media Type)
    if (
      !ALLOWED_TYPES.includes(denialDocument.type) ||
      !ALLOWED_TYPES.includes(policyDocument.type)
    ) {
      return NextResponse.json(
        { success: false, title: "Unsupported Type", message: "Only PDF, PNG, JPG, or JPEG files are accepted." },
        { status: 415 }
      );
    }

    logger.info(`[${requestId}] Request validation complete.`);

    // 6. Convert both files directly to base64 in parallel
    const [denialBase64, policyBase64] = await Promise.all([
      fileToBase64(denialDocument),
      fileToBase64(policyDocument),
    ]);

    logger.info(`[${requestId}] Base64 conversion complete.`);

    // 7. Invoke multimodal Gemini analysis and time the call
    const startTime = performance.now();
    logger.info(`[${requestId}] Invoking Gemini API...`);
    
    const result = await analyzeDocuments(
      {
        base64: denialBase64,
        mimeType: denialDocument.type,
        name: denialDocument.name,
      },
      {
        base64: policyBase64,
        mimeType: policyDocument.type,
        name: policyDocument.name,
      }
    );

    const endTime = performance.now();
    const processingTimeMs = Math.round(endTime - startTime);
    logger.info(`[${requestId}] Gemini analysis finished in ${processingTimeMs} ms.`);

    // 8. Return response containing results and metadata
    return NextResponse.json({
      success: true,
      requestId,
      processingTimeMs,
      result,
    });
  } catch (error: unknown) {
    logger.error(`[${requestId}] Error during claim analysis:`, error);

    let title = "Unexpected Server Error";
    let message = "An unpredicted error occurred. Please try again or contact support.";
    let status = 500;

    if (error instanceof GeminiAPIError) {
      status = error.status;
      message = error.message;

      // Map HTTP status codes to friendly user-facing titles and details
      if (status === 429) {
        title = "Gemini is busy";
      } else if (status === 504) {
        title = "Request timed out";
      } else if (status === 403 || status === 500) {
        title = "Configuration Error";
      } else if (status === 422) {
        title = "Analysis Validation Error";
      } else {
        title = "AI Engine Error";
      }
    }

    return NextResponse.json(
      { success: false, title, message },
      { status }
    );
  }
}
