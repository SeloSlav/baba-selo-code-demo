import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        AI recipe generators can be surprisingly good—or surprisingly off. Here&apos;s what to expect, what to double-check, and how to get more reliable results.
      </p>

      <h2>What AI Gets Right</h2>
      <p>
        AI understands ingredient combinations, cooking techniques, and flavor pairings. It can suggest creative ideas you wouldn&apos;t find with a normal search. For{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          better prompts
        </Link>
        , specificity helps—the more you give, the more accurate the output.
      </p>

      <h2>What to Double-Check</h2>
      <p>
        Cooking times, temperatures, and scaling can be wrong. Always verify protein temps (165°F for chicken, etc.). Our{" "}
        <Link href="/blog/ai-generated-recipes-safe" className="text-amber-600 hover:text-amber-700 underline">
          safety guide
        </Link>{" "}
        has more. For{" "}
        <Link href="/blog/ai-recipe-scaling-portions" className="text-amber-600 hover:text-amber-700 underline">
          scaling portions
        </Link>
        , double-check the math.
      </p>

      <h2>Substitutions and Accuracy</h2>
      <p>
        AI can suggest substitutions—but verify baking ratios and critical ingredients. See our{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          substitutions guide
        </Link>{" "}
        for when to trust the AI. Avoid these{" "}
        <Link href="/blog/mistakes-using-ai-recipes" className="text-amber-600 hover:text-amber-700 underline">
          common mistakes
        </Link>{" "}
        when using AI recipes.
      </p>

      <h2>Improving Accuracy Over Time</h2>
      <p>
        Tools like{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        let you refine in chat—&quot;that was too salty, suggest less salt&quot;—and save the improved version. Building a collection of tested recipes improves your results.
      </p>
    </ArticleWrapper>
  );
}
