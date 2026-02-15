import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        AI recipes are easy to forget. Saving your favorites builds a personal collection you can revisit, share, and improve over time.
      </p>

      <h2>Why Save AI Recipes?</h2>
      <p>
        Chat history scrolls away. A saved recipe lives in your profile—you can find it next week, share the link, or tweak it. Tools like{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        let you save recipes with one click and access them anytime.
      </p>

      <h2>Building a Personal Collection</h2>
      <p>
        Over time, your saved recipes become a custom cookbook. Great for{" "}
        <Link href="/blog/recipes-from-leftovers-ai" className="text-amber-600 hover:text-amber-700 underline">
          leftover nights
        </Link>{" "}
        or when you want to repeat a hit. For weekly planning, see our{" "}
        <Link href="/blog/ai-recipe-generator-meal-planning" className="text-amber-600 hover:text-amber-700 underline">
          meal planning guide
        </Link>.
      </p>

      <h2>Sharing and Remixing</h2>
      <p>
        Saved recipes can be shared via link. You can also ask the AI to remix a saved recipe—&quot;make it vegan&quot; or &quot;half the portions&quot;—and save the new version. Compare{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          which tools support saving
        </Link>.
      </p>
    </ArticleWrapper>
  );
}
