import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Out of an ingredient? AI recipe generators can suggest substitutions. Here&apos;s how to ask, when to trust the AI, and when to double-check.
      </p>

      <h2>How to Ask for Substitutions</h2>
      <p>
        Be specific: &quot;I don&apos;t have cream—what can I use instead?&quot; or &quot;swap the butter for olive oil.&quot; The AI will suggest alternatives. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more on getting better results.
      </p>

      <h2>When to Trust the AI</h2>
      <p>
        Simple swaps—cream for coconut milk, lemon for vinegar—usually work. For baking, ratios matter more; verify critical ingredients. See our{" "}
        <Link href="/blog/ai-recipe-generator-accurate" className="text-amber-600 hover:text-amber-700 underline">
          accuracy guide
        </Link>{" "}
        for what AI gets right and wrong.
      </p>

      <h2>Dietary Substitutions</h2>
      <p>
        &quot;Make it vegan&quot; or &quot;dairy-free version&quot; works well. AI understands common swaps—plant milk for dairy, flax for egg. For dedicated diet support, see{" "}
        <Link href="/blog/ai-recipe-generator-vegan" className="text-amber-600 hover:text-amber-700 underline">
          vegan
        </Link>{" "}
        and{" "}
        <Link href="/blog/ai-recipe-generator-dairy-free" className="text-amber-600 hover:text-amber-700 underline">
          dairy-free
        </Link>{" "}
        guides.
      </p>

      <h2>Save Your Swapped Versions</h2>
      <p>
        Found a substitution that works?{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save recipes so your &quot;vegan version&quot; or &quot;dairy-free swap&quot; is easy to revisit. See{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          why saving AI recipes matters
        </Link>.
      </p>
    </ArticleWrapper>
  );
}
