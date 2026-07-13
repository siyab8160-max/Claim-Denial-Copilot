import Groq from "groq-sdk";
import { CLAIM_ANALYSIS_PROMPT } from "./prompts";
import { AnalysisSchema, type AnalysisResult } from "./types";
import { logger } from "./logger";

/**
 * Custom error class representing backend API exceptions with semantic HTTP statuses.
 */
export class GeminiAPIError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "GeminiAPIError";
    this.status = status;
  }
}

/**
 * Interface representing document attachments passed to the AI model.
 */
export interface DocumentInput {
  base64: string;
  mimeType: string;
  name: string;
}

/**
 * Helper to retry asynchronous function calls under transient conditions (rate limits or timeouts).
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    // Fail immediately for validation errors or invalid API key configuration
    if (error instanceof GeminiAPIError) {
      if (error.status === 422 || error.status === 403 || error.status === 500) {
        throw error;
      }
    }

    if (retries <= 1) {
      throw error;
    }

    logger.warn(`[AI API Transient Warning] API call failed. Retrying in ${delayMs}ms. Attempts remaining: ${retries - 1}. Error was:`, error);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Extracts text from a PDF file buffer using pdfjs-dist (no worker needed).
 */
async function extractPdfText(base64Data: string): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buffer = Buffer.from(base64Data, "base64");
  const data = new Uint8Array(buffer);

  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: { str?: string }) => item.str || "")
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

/**
 * Dispatches denial and policy documents to Groq's Llama 4 Scout model,
 * parses the structured output, and validates it against the shared Zod schema.
 */
export async function analyzeDocuments(
  denial: DocumentInput,
  policy: DocumentInput
): Promise<AnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GeminiAPIError("Groq API key is missing. Please set GROQ_API_KEY in .env.local", 500);
  }

  const groq = new Groq({ apiKey });

  // Build message content parts
  // Groq supports images natively via base64, but PDFs must be converted to text
  type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

  const contentParts: ContentPart[] = [
    {
      type: "text",
      text: "Task Instruction: Review the attached claim denial letter and policy contract document. Analyze why the claim was denied, locate matching clauses in the policy document, and generate the structured JSON appeal mapping.",
    },
  ];

  // Process denial document
  if (denial.mimeType === "application/pdf") {
    const denialText = await extractPdfText(denial.base64);
    contentParts.push({
      type: "text",
      text: `--- DENIAL LETTER (${denial.name}) ---\n${denialText}\n--- END DENIAL LETTER ---`,
    });
  } else {
    // Image — send directly as base64
    contentParts.push({
      type: "image_url",
      image_url: { url: `data:${denial.mimeType};base64,${denial.base64}` },
    });
  }

  // Process policy document
  if (policy.mimeType === "application/pdf") {
    const policyText = await extractPdfText(policy.base64);
    contentParts.push({
      type: "text",
      text: `--- POLICY DOCUMENT (${policy.name}) ---\n${policyText}\n--- END POLICY DOCUMENT ---`,
    });
  } else {
    // Image — send directly as base64
    contentParts.push({
      type: "image_url",
      image_url: { url: `data:${policy.mimeType};base64,${policy.base64}` },
    });
  }

  const generateCall = async () => {
    try {
      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content: CLAIM_ANALYSIS_PROMPT,
          },
          {
            role: "user",
            content: contentParts,
          },
        ],
        response_format: {
          type: "json_object",
        },
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      return response.choices[0]?.message?.content || "";
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : String(apiError);

      if (message.includes("API key") || message.includes("401") || message.includes("403")) {
        throw new GeminiAPIError("Invalid Groq API Key provided.", 403);
      }
      if (message.includes("429") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota")) {
        throw new GeminiAPIError("Groq is busy. Please try again in a few seconds.", 429);
      }
      if (message.includes("408") || message.includes("504") || message.toLowerCase().includes("timeout") || message.toLowerCase().includes("deadline")) {
        throw new GeminiAPIError("The AI model took too long to respond.", 504);
      }

      throw new GeminiAPIError(`Groq API request failed: ${message}`, 502);
    }
  };

  logger.info("Sending request to Groq Llama 4 Scout...");
  const responseText = await retryWithBackoff(generateCall);
  logger.info("Response received from Groq API.");

  if (!responseText) {
    throw new GeminiAPIError("Empty response received from Groq API.", 502);
  }

  // Clean and parse JSON response
  let parsedData: unknown;
  try {
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, "");
      cleanText = cleanText.replace(/\n```$/, "");
      cleanText = cleanText.trim();
    }
    parsedData = JSON.parse(cleanText);
  } catch (parseError: unknown) {
    logger.error("Groq JSON Parse Error:", parseError, "Response text was:", responseText);
    throw new GeminiAPIError("Failed to parse Groq response as JSON.", 500);
  }

  // Validate output shape using Zod schema
  const validated = AnalysisSchema.safeParse(parsedData);
  if (!validated.success) {
    logger.error("Groq Schema Validation Failed. Zod error details:", validated.error.format());
    logger.error("Groq Schema Validation Failed. Raw response text was:", responseText);

    const firstError = validated.error.issues[0]?.message || "Schema validation mismatch";
    throw new GeminiAPIError(`Invalid AI response shape: ${firstError}`, 422);
  }

  return validated.data;
}
