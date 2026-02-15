import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        AI recipes aren&apos;t tested in a lab. Use common sense: check temps, trust your instincts, and cook with care.
      </p>

      <h2>What AI Gets Right (and Wrong)</h2>
      <p>
        AI understands ingredient combinations and cooking logic. But it can miscalculate times, forget critical steps, or suggest unsafe temps. Always verify protein temperatures and use your judgment.
      </p>

      <h2>5 Safety Habits</h2>
      <ul>
        <li>Check internal temps for meat, poultry, and fish.</li>
        <li>Verify cooking times—AI estimates can be off.</li>
        <li>Watch for allergens if you have restrictions.</li>
        <li>Taste as you go and adjust.</li>
        <li>When in doubt, don&apos;t serve it.</li>
      </ul>

      <h2>Reduce Risk With Better Prompts</h2>
      <p>
        Being specific helps. See our{" "}
        <Link href="/blog/mistakes-using-ai-recipes" className="text-amber-600 hover:text-amber-700 underline">
          mistakes to avoid
        </Link>{" "}
        and{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          how to use AI recipe generators
        </Link>{" "}
        for better results. Tools like{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        work best when you give clear constraints.
      </p>
    </ArticleWrapper>
  );
}
