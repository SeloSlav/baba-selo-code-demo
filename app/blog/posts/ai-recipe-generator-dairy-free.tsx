import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Dairy-free doesn&apos;t mean flavor-free. AI recipe generators can suggest lactose-free, vegan, and allergy-friendly meal ideas. Here&apos;s how.
      </p>

      <h2>State Dairy-Free Up Front</h2>
      <p>
        &quot;Dairy-free pasta&quot; or &quot;no milk, no cheese&quot; helps the AI. For vegan (no dairy + no eggs), say &quot;vegan.&quot; Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Common Dairy Swaps</h2>
      <p>
        Plant milk, coconut cream, nutritional yeast, cashew cream—AI knows the swaps. Ask for &quot;dairy-free version&quot; or &quot;swap cream for coconut milk.&quot; See our{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          substitutions guide
        </Link>{" "}
        for when to trust the AI. For full plant-based,{" "}
        <Link href="/blog/ai-recipe-generator-vegan" className="text-amber-600 hover:text-amber-700 underline">
          vegan AI recipes
        </Link>{" "}
        overlap.
      </p>

      <h2>Dairy-Free + Other Diets</h2>
      <p>
        Combine with{" "}
        <Link href="/blog/ai-recipe-generator-gluten-free" className="text-amber-600 hover:text-amber-700 underline">
          gluten-free
        </Link>{" "}
        or{" "}
        <Link href="/blog/ai-recipe-generator-vegan" className="text-amber-600 hover:text-amber-700 underline">
          vegan
        </Link>{" "}
        if needed: &quot;dairy-free and gluten-free chicken dinner.&quot;
      </p>

      <h2>Save Your Swapped Versions</h2>
      <p>
        Found a dairy-free version that works?{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save recipes so you can revisit and share. See{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          why saving AI recipes matters
        </Link>.
      </p>
    </ArticleWrapper>
  );
}
