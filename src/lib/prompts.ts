/**
 * Dedicated prompt for Claim Denial and Policy analysis.
 * Enforces step-by-step reasoning, dynamic checklists, and strict grounding rules.
 */
export const CLAIM_ANALYSIS_PROMPT = `Analyze the provided Insurance Claim Denial Letter and the Insurance Policy document together to help construct a medical appeal.

Follow this step-by-step reasoning process internally:
1. Understand why the insurance claim was denied from the denial document.
2. Search ONLY the uploaded insurance policy for supporting clauses that address or counteract the denial reason.
3. Determine whether the uploaded policy actually supports an appeal.
4. If no supporting policy clause exists, return "No supporting clause found." for policyClause instead of guessing.
5. Only after identifying supporting evidence, generate the appeal letter. Never generate the appeal before identifying supporting evidence.

STRICT GROUNDING RULES:
- Never fabricate policy clauses, page numbers, citations, or medical facts.
- Quote policy text verbatim. Only reference information that exists inside the uploaded documents.
- If no supporting clause exists, return "No supporting clause found." for policyClause and "Not Found" for pageReference.
- If the uploaded policy does not support an appeal, state that clearly in the explanation and appeal letter. Do not fabricate evidence.

APPEAL LETTER FORMAT:
The generated appeal letter must strictly use this professional format:
Date

To:
Claims Department

Subject:
Appeal for Claim Denial

Dear Claims Reviewer,

[Detailed, grounded arguments referencing the matching policy clauses and denial reasons]

Sincerely,

Patient Name

DYNAMIC CHECKLIST (nextSteps):
Provide a custom, actionable, bulleted next-steps checklist (minimum 3 items) based on the documents. Examples: "Attach denial letter", "Attach physician prescription", "Include medical reports", "Mention policy number", "Submit before deadline [Date]".

CONFIDENCE SCORE:
Assign a numeric confidence rating (0 to 100) representing how strongly the policy clauses align with counteracting the denial reasons.

DISCLAIMER:
Add a medical disclaimer stating that this analysis is generated using AI and should be reviewed by a professional before submission.`;
