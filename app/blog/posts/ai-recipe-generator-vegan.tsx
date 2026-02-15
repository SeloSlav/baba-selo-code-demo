import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Going plant-based? AI recipe generators can suggest vegan dinner ideas, protein swaps, and creative combos. Here&apos;s how to get better vegan AI recipes.
      </p>

      <h2>Say Vegan in Your First Message</h2>
      <p>
        &quot;Vegan recipe with chickpeas and spinach&quot; or &quot;plant-based dinner, 30 minutes&quot; sets the tone. The AI will avoid meat, dairy, and eggs. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Protein Swaps and Substitutions</h2>
      <p>
        Tofu, tempeh, lentils, chickpeas—AI knows the swaps. Ask for &quot;vegan version of this&quot; or &quot;replace chicken with tofu.&quot; See our{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          substitutions guide
        </Link>{" "}
        for when to trust the AI. For more diet options,{" "}
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          vegan, keto, gluten-free
        </Link>{" "}
        covers the full range.
      </p>

      <h2>Vegan + Cuisine + Time</h2>
      <p>
        Combine: &quot;vegan Mediterranean bowl&quot; or &quot;vegan Asian stir-fry, 20 minutes.&quot; For{" "}
        <Link href="/blog/ai-recipe-generator-mediterranean" className="text-amber-600 hover:text-amber-700 underline">
          Mediterranean
        </Link>{" "}
        or{" "}
        <Link href="/blog/ai-recipe-generator-asian" className="text-amber-600 hover:text-amber-700 underline">
          Asian
        </Link>{" "}
        flavors, the same principles apply.
      </p>

      <h2>Save Your Favorites</h2>
      <p>
        Vegan recipes often become staples.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save recipes and ask for variations—&quot;make it spicier&quot; or &quot;add more protein.&quot; See{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          why saving AI recipes matters
        </Link>.
      </p>
    </ArticleWrapper>
  );
}
