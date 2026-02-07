/**
 * Enterprise review runner: strict prompt → LLM → validate → typed result.
 * No persistence; caller persists via lib/reviews.
 */

import { buildSystemPromptStrict, buildUserPromptStrict, REVIEW_VERSION_STRICT } from "./reviewPromptBuilderStrict";
import { getAIClient } from "./aiClient";
import { validateReviewResponse } from "./reviewValidator";
import type { AIReviewOutputStrict } from "./schema";
import type { TokenUsage } from "./types";

export type ReviewRunnerInput = {
  prTitle: string;
  prDescription?: string | null;
  diff: string;
  techStack?: string | null;
};

export type ReviewRunnerResult = {
  output: AIReviewOutputStrict;
  rawResponse: string;
  tokenUsage: TokenUsage | undefined;
  reviewVersion: number;
  model: string;
};

/**
 * Run AI review with strict schema. Throws on config/API/validation failure.
 */
export async function runReviewStrict(input: ReviewRunnerInput): Promise<ReviewRunnerResult> {
  const systemPrompt = buildSystemPromptStrict();
  const userPrompt = buildUserPromptStrict({
    prTitle: input.prTitle,
    prDescription: input.prDescription,
    diff: input.diff,
    techStack: input.techStack,
  });

  const client = await getAIClient();
  const model = process.env.OPENAI_REVIEW_MODEL ?? "gpt-4o-mini";
  const { content, usage } = await client.complete(systemPrompt, userPrompt, {
    model,
    maxTokens: 8192,
    temperature: 0.2,
  });

  const output = validateReviewResponse(content);
  if (!output) {
    throw new Error("AI returned invalid JSON. Validation failed.");
  }

  return {
    output,
    rawResponse: content,
    tokenUsage: usage,
    reviewVersion: REVIEW_VERSION_STRICT,
    model,
  };
}
