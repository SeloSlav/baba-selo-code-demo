import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Get better results from AI recipe generators by avoiding these common pitfalls—from vague prompts to skipping the taste test.
      </p>

      <h2>1. Being Too Vague</h2>
      <p>
        &quot;Chicken recipe&quot; gives generic results. Try &quot;boneless chicken thighs, 30 minutes, Mediterranean style.&quot; See our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          guide to prompting
        </Link>{" "}
        for more.
      </p>

      <h2>2. Not Mentioning Constraints</h2>
      <p>
        Diet, time, equipment—say it upfront. The AI can&apos;t read your mind. For dietary needs,{" "}
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          we have a dedicated guide
        </Link>.
      </p>

      <h2>3. Trusting Cooking Times Blindly</h2>
      <p>
        AI estimates can be off. Check protein temps and use your judgment. Read{" "}
        <Link href="/blog/ai-generated-recipes-safe" className="text-amber-600 hover:text-amber-700 underline">
          are AI recipes safe?
        </Link>{" "}
        for safety tips.
      </p>

      <h2>4. Forgetting to Save Good Recipes</h2>
      <p>
        You&apos;ll forget that great recipe if you don&apos;t save it. Tools like Baba Selo let you build a collection—see{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          why and how to save AI recipes
        </Link>.
      </p>

      <h2>5. Giving Up After One Try</h2>
      <p>
        Refine your prompt or ask for variations. &quot;Make it spicier&quot; or &quot;swap cream for coconut milk&quot; often works. AI is conversational—use it.
      </p>
    </ArticleWrapper>
  );
}
