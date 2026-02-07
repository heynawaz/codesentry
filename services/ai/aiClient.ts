/**
 * LLM provider abstraction. Implementations: OpenAI (default), others later.
 */

import type { AIClientOptions, AIClientResponse, IAIClient } from "./types";

export type { AIClientOptions, AIClientResponse, IAIClient } from "./types";

/**
 * OpenAI-backed client. Requires OPENAI_API_KEY.
 */
export async function createOpenAIClient(): Promise<IAIClient> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  return {
    async complete(
      systemPrompt: string,
      userPrompt: string,
      options?: AIClientOptions
    ): Promise<AIClientResponse> {
      const model = options?.model ?? "gpt-4o-mini";
      const maxTokens = options?.maxTokens ?? 4096;
      const temperature = options?.temperature ?? 0.2;

      const completion = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const choice = completion.choices?.[0];
      const content = choice?.message?.content?.trim() ?? "";
      const usage = completion.usage
        ? {
            prompt: completion.usage.prompt_tokens ?? undefined,
            completion: completion.usage.completion_tokens ?? undefined,
            total: completion.usage.total_tokens ?? undefined,
          }
        : undefined;

      return { content, usage };
    },
  };
}

/**
 * Resolve the AI client from env. Default: OpenAI.
 * TODO: Support OPENAI_API_KEY vs ANTHROPIC_API_KEY etc. for multi-provider.
 */
let cachedClient: IAIClient | null = null;

export async function getAIClient(): Promise<IAIClient> {
  if (cachedClient) return cachedClient;
  cachedClient = await createOpenAIClient();
  return cachedClient;
}
