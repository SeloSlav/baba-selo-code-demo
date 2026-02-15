import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Pasta and AI recipe generators are a perfect match. Get quick weeknight ideas, fancy date-night dishes, and pantry-staple combos in seconds.
      </p>

      <h2>Specify Pasta Shape and Style</h2>
      <p>
        &quot;Spaghetti with garlic and olive oil&quot; or &quot;penne, creamy sauce, 20 minutes&quot; helps the AI. Mention what you have—canned tomatoes, cream, pesto—so it builds around it. See our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>.
      </p>

      <h2>Pasta + Protein + Time</h2>
      <p>
        Combine pasta with{" "}
        <Link href="/blog/ai-recipe-generator-chicken" className="text-amber-600 hover:text-amber-700 underline">
          chicken
        </Link>
        ,{" "}
        <Link href="/blog/ai-recipe-generator-ground-beef" className="text-amber-600 hover:text-amber-700 underline">
          ground beef
        </Link>
        , or keep it veggie. For speed, add &quot;under 30 minutes&quot;—our{" "}
        <Link href="/blog/ai-recipe-generator-quick-meals" className="text-amber-600 hover:text-amber-700 underline">
          quick meals guide
        </Link>{" "}
        has more. For one pan, try{" "}
        <Link href="/blog/ai-recipe-generator-one-pot" className="text-amber-600 hover:text-amber-700 underline">
          one-pot pasta
        </Link>.
      </p>

      <h2>Cuisine and Dietary Tweaks</h2>
      <p>
        &quot;Asian noodle stir-fry&quot; or &quot;Mediterranean pasta&quot; works. For dietary needs,{" "}
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          vegan, keto, gluten-free
        </Link>{" "}
        prompts help. Gluten-free pasta? Say so—the AI will adapt.
      </p>

      <h2>Save and Remix</h2>
      <p>
        Found a winner?{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save recipes and ask for variations—&quot;make it spicier&quot; or &quot;swap cream for tomato.&quot; See{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          why saving AI recipes matters
        </Link>.
      </p>
    </ArticleWrapper>
  );
}
