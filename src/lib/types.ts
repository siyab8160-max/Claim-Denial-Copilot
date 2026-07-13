import { z } from "zod";

/**
 * Shared validation schema for the medical appeal analysis response.
 */
export const AnalysisSchema = z.object({
  denialSummary: z.string().min(1, "Denial summary cannot be empty"),
  denialReason: z.string().min(1, "Denial reason cannot be empty"),
  policyClause: z.string().min(1, "Policy clause wording cannot be empty"),
  pageReference: z.string().min(1, "Page reference citation cannot be empty"),
  plainEnglishExplanation: z.string().min(1, "Explanation cannot be empty"),
  appealStrength: z.enum(["High", "Medium", "Low"]),
  appealLetter: z.string().min(1, "Appeal letter content cannot be empty"),
  confidence: z.number().min(0).max(100),
  disclaimer: z.string().min(1, "Disclaimer cannot be empty"),
  nextSteps: z.array(z.string()).min(1, "At least one next step item is required"),
});

/**
 * TypeScript type inferred from the shared Zod schema.
 */
export type AnalysisResult = z.infer<typeof AnalysisSchema>;
