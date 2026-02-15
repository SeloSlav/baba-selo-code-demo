import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Eating well on a budget is easier with AI recipe generators. Focus on affordable ingredients, pantry staples, and smart substitutions—here&apos;s how.
      </p>

      <h2>Budget-Friendly Prompts</h2>
      <p>
        Tell the AI your constraints: &quot;cheap ingredients only&quot; or &quot;under $5 per serving.&quot; Mention staples you already have—rice, beans, eggs, canned tomatoes—so it builds around them. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more tips.
      </p>

      <h2>Ingredients That Stretch Your Dollar</h2>
      <p>
        <Link href="/blog/ai-recipe-generator-rice" className="text-amber-600 hover:text-amber-700 underline">
          Rice
        </Link>
        ,{" "}
        <Link href="/blog/ai-recipe-generator-eggs" className="text-amber-600 hover:text-amber-700 underline">
          eggs
        </Link>
        , beans, pasta, and frozen vegetables are budget heroes. Use{" "}
        <Link href="/blog/recipes-from-leftovers-ai" className="text-amber-600 hover:text-amber-700 underline">
          leftovers
        </Link>{" "}
        before they go bad—AI excels at &quot;what can I make with this?&quot;
      </p>

      <h2>Free Tools for Budget Cooking</h2>
      <p>
        Many AI recipe generators have free tiers.{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          FoodsGPT and Let&apos;s Foodie
        </Link>{" "}
        offer unlimited free use.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        has a free tier and lets you save recipes so you can reuse budget favorites.
      </p>

      <h2>Substitutions Save Money</h2>
      <p>
        Out of an ingredient? AI can suggest swaps. See our{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          guide to AI recipe substitutions
        </Link>{" "}
        for when to trust the AI and when to double-check.
      </p>
    </ArticleWrapper>
  );
}
