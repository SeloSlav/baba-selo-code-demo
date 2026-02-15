import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Need to feed 2 or 10? AI recipe generators can scale portions—but you should verify. Here&apos;s how to double, halve, or adjust recipes safely.
      </p>

      <h2>How to Ask for Scaled Portions</h2>
      <p>
        &quot;Double this recipe&quot; or &quot;halve for 2 servings&quot; works. Be explicit: &quot;scale to 6 servings&quot; or &quot;make this for 8 people.&quot; Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>What Can Go Wrong</h2>
      <p>
        AI can miscalculate—especially with baking (ratios matter) or odd numbers. Always double-check the math for critical ingredients. See our{" "}
        <Link href="/blog/ai-recipe-generator-accurate" className="text-amber-600 hover:text-amber-700 underline">
          accuracy guide
        </Link>{" "}
        for what to verify.
      </p>

      <h2>Family Dinners and Batch Cooking</h2>
      <p>
        Scaling up for{" "}
        <Link href="/blog/ai-recipe-generator-family-dinner" className="text-amber-600 hover:text-amber-700 underline">
          family dinners
        </Link>{" "}
        or meal prep? Mention it—&quot;double for 6, with leftovers.&quot; For weekly planning, see our{" "}
        <Link href="/blog/ai-recipe-generator-meal-planning" className="text-amber-600 hover:text-amber-700 underline">
          meal planning guide
        </Link>.
      </p>

      <h2>Save Scaled Versions</h2>
      <p>
        Found a portion size that works?{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save recipes so your &quot;family-size&quot; or &quot;solo portion&quot; version is easy to revisit. Compare{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          AI recipe tools
        </Link>{" "}
        that support saving.
      </p>
    </ArticleWrapper>
  );
}
