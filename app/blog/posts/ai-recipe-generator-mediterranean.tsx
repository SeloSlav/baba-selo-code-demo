import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Mediterranean diet meets AI. Get olive oil, herbs, and veggie-forward recipes from AI recipe generators in seconds.
      </p>

      <h2>What Makes It Mediterranean</h2>
      <p>
        Olive oil, tomatoes, herbs (oregano, basil), legumes, fish, and vegetables. Tell the AI &quot;Mediterranean style&quot; or &quot;Greek-inspired&quot; and it will lean into these flavors. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Mediterranean + Protein + Time</h2>
      <p>
        &quot;Mediterranean chicken, 30 minutes&quot; or &quot;Greek salad with grilled fish&quot; works. For{" "}
        <Link href="/blog/ai-recipe-generator-vegan" className="text-amber-600 hover:text-amber-700 underline">
          vegan
        </Link>
        , try &quot;vegan Mediterranean bowl.&quot; For speed, add &quot;under 30 minutes&quot;—see our{" "}
        <Link href="/blog/ai-recipe-generator-quick-meals" className="text-amber-600 hover:text-amber-700 underline">
          quick meals guide
        </Link>.
      </p>

      <h2>One-Pot Mediterranean</h2>
      <p>
        Sheet pan bakes, skillet dinners, and grain bowls fit the style.{" "}
        <Link href="/blog/ai-recipe-generator-one-pot" className="text-amber-600 hover:text-amber-700 underline">
          One-pot
        </Link>{" "}
        + Mediterranean = easy cleanup.
      </p>

      <h2>Save Your Favorites</h2>
      <p>
        Mediterranean recipes often become staples.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you chat—&quot;Mediterranean chicken with olives and lemon&quot;—and save recipes. Compare{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          AI recipe tools
        </Link>{" "}
        for your needs.
      </p>
    </ArticleWrapper>
  );
}
