import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        AI recipe generators aren&apos;t just for dinner. Get dessert ideas, baking substitutions, and quick sweet treats in seconds.
      </p>

      <h2>Dessert Prompts That Work</h2>
      <p>
        &quot;Chocolate chip cookies&quot; or &quot;simple fruit dessert, 15 minutes&quot; works. For baking, be specific about ingredients—ratios matter. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Baking Substitutions</h2>
      <p>
        Out of an ingredient? AI can suggest swaps—but verify for baking. Butter, flour, and sugar ratios affect the result. See our{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          substitutions guide
        </Link>{" "}
        and{" "}
        <Link href="/blog/ai-recipe-generator-accurate" className="text-amber-600 hover:text-amber-700 underline">
          accuracy guide
        </Link>{" "}
        for when to trust the AI.
      </p>

      <h2>Quick Desserts</h2>
      <p>
        Mug cakes, no-bake treats, and fruit-based desserts are fast.{" "}
        <Link href="/blog/ai-recipe-generator-eggs" className="text-amber-600 hover:text-amber-700 underline">
          Eggs
        </Link>{" "}
        appear in many desserts—AI can suggest egg-free versions if needed.
      </p>

      <h2>Save Your Sweet Favorites</h2>
      <p>
        Found a dessert that hits?{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          save recipes
        </Link>{" "}
        so that cookie or cake is easy to revisit. Compare{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          AI recipe tools
        </Link>{" "}
        for your needs.
      </p>
    </ArticleWrapper>
  );
}
