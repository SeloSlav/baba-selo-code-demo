import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Gluten-free cooking doesn&apos;t mean boring. AI recipe generators can suggest celiac-safe ideas—if you know how to ask and what to double-check.
      </p>

      <h2>State Gluten-Free Up Front</h2>
      <p>
        &quot;Gluten-free chicken dinner&quot; or &quot;celiac-safe, no wheat&quot; helps the AI avoid flour, soy sauce (unless tamari), and hidden gluten. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Tools With Gluten-Free Support</h2>
      <p>
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          Supercook and FoodsGPT
        </Link>{" "}
        have diet filters.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you chat—&quot;gluten-free pasta dish&quot; or &quot;something with rice, no gluten&quot;—and save recipes. For{" "}
        <Link href="/blog/ai-recipe-generator-dairy-free" className="text-amber-600 hover:text-amber-700 underline">
          dairy-free
        </Link>{" "}
        too, combine both in your prompt.
      </p>

      <h2>Double-Check Hidden Gluten</h2>
      <p>
        AI can slip—soy sauce, malt, some broths. Verify ingredients if you have celiac. Our{" "}
        <Link href="/blog/ai-generated-recipes-safe" className="text-amber-600 hover:text-amber-700 underline">
          safety guide
        </Link>{" "}
        and{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          substitutions guide
        </Link>{" "}
        have more on verifying AI suggestions.
      </p>

      <h2>Gluten-Free Swaps</h2>
      <p>
        Need a substitute? Ask: &quot;gluten-free flour for this recipe&quot; or &quot;tamari instead of soy sauce.&quot; AI can suggest swaps—but verify for critical ingredients.
      </p>
    </ArticleWrapper>
  );
}
