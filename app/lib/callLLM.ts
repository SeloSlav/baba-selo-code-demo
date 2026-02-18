/**
 * Shared LLM call utility.
 * All enrichment routes (classify, summary, macro, pairing) use this
 * instead of raw fetch / OpenAI SDK calls.
 */
import { ChatOpenAI } from "@langchain/openai";
import { MODELS } from "./models";

const enrichmentModel = new ChatOpenAI({
  model: MODELS.enrichment,
  temperature: 0,
  maxTokens: 500,
});

export interface CallLLMOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call the enrichment LLM with a system prompt and user content.
 * Returns the raw string response.
 */
export async function callLLM(
  systemPrompt: string,
  userContent: string,
  options?: CallLLMOptions
): Promise<string> {
  const model =
    options?.temperature !== undefined || options?.maxTokens !== undefined
      ? new ChatOpenAI({
          model: MODELS.enrichment,
          temperature: options.temperature ?? 0,
          maxTokens: options.maxTokens ?? 500,
        })
      : enrichmentModel;

  const response = await model.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ]);

  return typeof response.content === "string" ? response.content : "";
}

/**
 * Call the LLM and parse the response as JSON.
 * Strips markdown fences and extracts the first JSON object.
 */
export async function callLLMJSON<T = unknown>(
  systemPrompt: string,
  userContent: string,
  options?: CallLLMOptions
): Promise<T> {
  const raw = await callLLM(systemPrompt, userContent, options);
  const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No valid JSON found in LLM response");
  return JSON.parse(match[0]) as T;
}
