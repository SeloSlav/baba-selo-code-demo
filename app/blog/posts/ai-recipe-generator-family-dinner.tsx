import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Family dinners need to please everyone—including picky eaters. AI recipe generators can suggest kid-friendly, batch-friendly, and weeknight-ready ideas. Here&apos;s how.
      </p>

      <h2>How to Prompt for Family Dinners</h2>
      <p>
        Say &quot;family-friendly,&quot; &quot;kid-friendly,&quot; or &quot;pickier eaters&quot; upfront. Specify servings: &quot;feeds 4&quot; or &quot;dinner for 2 adults and 2 kids.&quot; For scaling, see our{" "}
        <Link href="/blog/ai-recipe-scaling-portions" className="text-amber-600 hover:text-amber-700 underline">
          guide to scaling AI recipe portions
        </Link>.
      </p>

      <h2>Ingredients Families Love</h2>
      <p>
        <Link href="/blog/ai-recipe-generator-chicken" className="text-amber-600 hover:text-amber-700 underline">
          Chicken
        </Link>
        , pasta, and mild flavors tend to work. Ask for &quot;not too spicy&quot; or &quot;simple flavors.&quot; For variety, try{" "}
        <Link href="/blog/ai-recipe-generator-meal-planning" className="text-amber-600 hover:text-amber-700 underline">
          meal planning
        </Link>{" "}
        with AI—get a week of ideas at once.
      </p>

      <h2>Batch Cooking and Leftovers</h2>
      <p>
        Double the recipe and save half. AI can scale—&quot;double this for 8 servings&quot;—but verify the math. Tools like{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        let you{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          save recipes
        </Link>{" "}
        so family favorites are easy to revisit.
      </p>

      <h2>Quick Weeknight Wins</h2>
      <p>
        Time pressure? Combine &quot;family-friendly&quot; with &quot;30 minutes&quot; in your prompt. Our{" "}
        <Link href="/blog/ai-recipe-generator-quick-meals" className="text-amber-600 hover:text-amber-700 underline">
          quick meals guide
        </Link>{" "}
        has more on fast dinners.
      </p>
    </ArticleWrapper>
  );
}
