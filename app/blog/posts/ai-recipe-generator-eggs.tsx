import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Eggs aren&apos;t just for breakfast. AI recipe generators can suggest frittatas, shakshuka, fried rice, and more—any time of day.
      </p>

      <h2>Eggs for Dinner</h2>
      <p>
        Frittatas, shakshuka, egg fried rice, and carbonara are all dinner-worthy. Tell the AI &quot;egg dinner&quot; or &quot;eggs for dinner, 20 minutes&quot; and what else you have. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Eggs + Leftovers</h2>
      <p>
        Eggs stretch leftovers—wilted spinach, leftover rice, random veggies.{" "}
        <Link href="/blog/recipes-from-leftovers-ai" className="text-amber-600 hover:text-amber-700 underline">
          Leftover ingredients
        </Link>{" "}
        + eggs = frittata or fried rice. For{" "}
        <Link href="/blog/ai-recipe-generator-budget" className="text-amber-600 hover:text-amber-700 underline">
          budget cooking
        </Link>
        , eggs are a cheap protein.
      </p>

      <h2>Quick and Simple</h2>
      <p>
        Eggs cook fast. Pair with our{" "}
        <Link href="/blog/ai-recipe-generator-quick-meals" className="text-amber-600 hover:text-amber-700 underline">
          quick meals
        </Link>{" "}
        prompts—&quot;egg dish, 15 minutes&quot;—for weeknight wins. For something sweet, see{" "}
        <Link href="/blog/ai-recipe-generator-dessert" className="text-amber-600 hover:text-amber-700 underline">
          AI dessert recipes
        </Link>{" "}
        (many use eggs).
      </p>

      <h2>Save Your Favorites</h2>
      <p>
        Egg recipes are easy to repeat.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save recipes so that shakshuka or frittata is one click away next time.
      </p>
    </ArticleWrapper>
  );
}
