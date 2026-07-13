import { GoogleGenAI, Type } from "@google/genai";
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
 * Interface representing base64 document attachments passed to the Gemini SDK.
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
  delayMs = 1000
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

    logger.warn(`[Gemini API Transient Warning] API call failed. Retrying in ${delayMs}ms. Attempts remaining: ${retries - 1}. Error was:`, error);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return retryWithBackoff(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Dispatches denial and policy documents as a multimodal base64 payload to Gemini 2.5 Pro,
 * parses the structured output, and validates it against the shared Zod schema.
 */
export async function analyzeDocuments(
  denial: DocumentInput,
  policy: DocumentInput
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiAPIError("Gemini API key is missing.", 500);
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Build user contents containing base64 attachments and direct task instruction
  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [
    "Task Instruction: Review the attached claim denial letter and policy contract document. Analyze why the claim was denied, locate matching clauses in the policy document, and generate the structured JSON appeal mapping.",
    {
      inlineData: {
        data: denial.base64,
        mimeType: denial.mimeType,
      },
    },
    {
      inlineData: {
        data: policy.base64,
        mimeType: policy.mimeType,
      },
    },
  ];

  // 2. Query Gemini Pro, passing grounding rules as system instructions
  const generateContentCall = async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents,
        config: {
          systemInstruction: CLAIM_ANALYSIS_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              denialSummary: { type: Type.STRING },
              denialReason: { type: Type.STRING },
              policyClause: { type: Type.STRING },
              pageReference: { type: Type.STRING },
              plainEnglishExplanation: { type: Type.STRING },
              appealStrength: { 
                type: Type.STRING,
                enum: ["High", "Medium", "Low"],
              },
              appealLetter: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
              disclaimer: { type: Type.STRING },
              nextSteps: { 
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "denialSummary",
              "denialReason",
              "policyClause",
              "pageReference",
              "plainEnglishExplanation",
              "appealStrength",
              "appealLetter",
              "confidence",
              "disclaimer",
              "nextSteps",
            ],
          },
        },
      });

      return response.text || "";
    } catch (apiError: unknown) {
      const message = apiError instanceof Error ? apiError.message : String(apiError);

      if (message.includes("API key not valid") || message.includes("400") || message.includes("403")) {
        throw new GeminiAPIError("Invalid Gemini API Key provided.", 403);
      }
      if (message.includes("429") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota")) {
        throw new GeminiAPIError("Gemini is busy. Please try again in a few seconds.", 429);
      }
      if (message.includes("408") || message.includes("504") || message.toLowerCase().includes("timeout") || message.toLowerCase().includes("deadline")) {
        throw new GeminiAPIError("The AI model took too long to respond.", 504);
      }

      throw new GeminiAPIError(`Gemini API request failed: ${message}`, 502);
    }
  };

  logger.info("Sending request to Gemini 2.5 Pro...");
  const responseText = await retryWithBackoff(generateContentCall);
  logger.info("Response received from Gemini API.");

  if (!responseText) {
    throw new GeminiAPIError("Empty response received from Gemini API.", 502);
  }

  // 3. Clean and parse JSON response
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
    logger.error("Gemini JSON Parse Error:", parseError, "Response text was:", responseText);
    throw new GeminiAPIError("Failed to parse Gemini response as JSON.", 500);
  }

  // 4. Validate output shape using Zod schema
  const validated = AnalysisSchema.safeParse(parsedData);
  if (!validated.success) {
    logger.error("Gemini Schema Validation Failed. Zod error details:", validated.error.format());
    logger.error("Gemini Schema Validation Failed. Raw response text was:", responseText);
    
    const firstError = validated.error.issues[0]?.message || "Schema validation mismatch";
    throw new GeminiAPIError(`Invalid AI response shape: ${firstError}`, 422);
  }

  return validated.data;
}
