/**
 * Module declaration for @langchain/openai.
 * Fixes IDE "Cannot find module" when package exports aren't resolved correctly.
 */
declare module "@langchain/openai" {
  import type { EmbeddingsParams } from "@langchain/core/embeddings";

  export interface OpenAIEmbeddingsParams extends EmbeddingsParams {
    model?: string;
    modelName?: string;
    dimensions?: number;
    timeout?: number;
    batchSize?: number;
    stripNewLines?: boolean;
    encodingFormat?: "float" | "base64";
  }

  export class OpenAIEmbeddings {
    constructor(params?: Partial<OpenAIEmbeddingsParams> & { openAIApiKey?: string });
    embedDocuments(texts: string[]): Promise<number[][]>;
    embedQuery(text: string): Promise<number[]>;
  }

  export class ChatOpenAI {
    constructor(params?: Record<string, unknown>);
    invoke(input: unknown): Promise<{ content: string | unknown }>;
  }
}
