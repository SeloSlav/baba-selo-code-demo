import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Chicken is one of the most versatile proteins—and AI recipe generators know it. Get breast, thigh, whole bird, and leftover chicken ideas in seconds.
      </p>

      <h2>Be Specific About the Cut</h2>
      <p>
        &quot;Chicken breast&quot; vs &quot;chicken thighs&quot; changes everything. Thighs handle longer cooking; breasts dry out if overcooked. Tell the AI your cut and any constraints—&quot;boneless chicken thighs, 30 minutes.&quot; See our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>.
      </p>

      <h2>Chicken + Cuisine + Time</h2>
      <p>
        Combine chicken with a style: &quot;Mediterranean chicken and rice,&quot; &quot;Asian stir-fry with chicken,&quot; or &quot;chicken pasta, Italian style.&quot; Add time limits for{" "}
        <Link href="/blog/ai-recipe-generator-quick-meals" className="text-amber-600 hover:text-amber-700 underline">
          quick meals
        </Link>{" "}
        or dietary needs for{" "}
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          keto, vegan, or gluten-free
        </Link>.
      </p>

      <h2>Leftover Chicken Ideas</h2>
      <p>
        Rotisserie or leftover roast chicken? AI excels at repurposing. &quot;Leftover chicken, rice, and broccoli—something quick&quot; works. Our{" "}
        <Link href="/blog/recipes-from-leftovers-ai" className="text-amber-600 hover:text-amber-700 underline">
          leftovers guide
        </Link>{" "}
        has more.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you chat naturally and save the recipe.
      </p>

      <h2>Verify Cooking Temperatures</h2>
      <p>
        AI can suggest wrong temps. Always check chicken reaches 165°F internally. Our{" "}
        <Link href="/blog/ai-generated-recipes-safe" className="text-amber-600 hover:text-amber-700 underline">
          safety guide
        </Link>{" "}
        has more on using AI recipes safely.
      </p>
    </ArticleWrapper>
  );
}
