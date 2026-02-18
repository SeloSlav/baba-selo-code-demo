/**
 * LangGraph chat agent for Baba Selo.
 * Replaces the raw OpenAI tool-calling loop with a proper LangGraph agent.
 */
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import { createBabaChatTools } from "./chatToolsLangchain";

export interface ChatGraphInput {
  messages: { role: string; content: string }[];
  systemPrompt: string;
  userId: string;
}

export interface ChatGraphOutput {
  assistantMessage: string;
  timerSeconds?: number;
  lastMealPlanId?: string | null;
}

/**
 * Run the Baba chat agent using LangGraph.
 */
export async function runChatGraph(input: ChatGraphInput): Promise<ChatGraphOutput> {
  const { messages, systemPrompt, userId } = input;

  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 1.0,
    maxTokens: 1500,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const tools = createBabaChatTools(userId);

  const agent = createReactAgent({ llm: model, tools, prompt: systemPrompt } as unknown as Parameters<typeof createReactAgent>[0]);

  const lcMessages: BaseMessage[] = messages.map((m) => {
    if (m.role === "user") return new HumanMessage(m.content);
    if (m.role === "assistant") return new AIMessage(m.content);
    return new SystemMessage(m.content);
  });

  const result = await agent.invoke({
    messages: lcMessages,
  });

  const finalMessages = result?.messages ?? [];
  const lastAIMessage = [...finalMessages].reverse().find((m) => m._getType() === "ai") as AIMessage | undefined;
  let assistantMessage = lastAIMessage?.content
    ? typeof lastAIMessage.content === "string"
      ? lastAIMessage.content
      : Array.isArray(lastAIMessage.content)
        ? (lastAIMessage.content as { type?: string; text?: string }[])
            .filter((c) => c?.type === "text")
            .map((c) => (c as { text?: string }).text)
            .join("")
        : ""
    : "I'm sorry, I couldn't respond.";

  let timerSeconds: number | undefined;
  let lastMealPlanId: string | null = null;

  for (const msg of finalMessages) {
    if (msg._getType() === "tool") {
      try {
        const content = typeof msg.content === "string" ? msg.content : "";
        const parsed = JSON.parse(content);
        if (parsed.seconds) timerSeconds = parsed.seconds;
        if (parsed.planId) lastMealPlanId = parsed.planId;
      } catch {
        // ignore
      }
    }
  }

  return {
    assistantMessage,
    ...(timerSeconds != null && { timerSeconds }),
    ...(lastMealPlanId && { lastMealPlanId }),
  };
}
