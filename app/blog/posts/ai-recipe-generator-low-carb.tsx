import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Cutting carbs without cutting taste? AI recipe generators can suggest low-carb dinners, swaps, and meal ideas for your goals.
      </p>

      <h2>Specify Low-Carb in Your Prompt</h2>
      <p>
        &quot;Low-carb chicken dinner&quot; or &quot;under 20g carbs per serving&quot; helps the AI avoid pasta, rice, and bread. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Low-Carb vs Keto</h2>
      <p>
        Keto is stricter (usually under 20–50g carbs/day). For{" "}
        <Link href="/blog/ai-recipe-generator-keto" className="text-amber-600 hover:text-amber-700 underline">
          keto
        </Link>
        , say so. For general low-carb, &quot;low-carb&quot; or &quot;reduced carb&quot; works. See{" "}
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          diet-specific guides
        </Link>.
      </p>

      <h2>Proteins and Veggies</h2>
      <p>
        <Link href="/blog/ai-recipe-generator-chicken" className="text-amber-600 hover:text-amber-700 underline">
          Chicken
        </Link>
        , fish, beef, eggs, and non-starchy veggies are low-carb staples. Ask for &quot;chicken and broccoli, low-carb&quot; or &quot;salmon with asparagus.&quot;
      </p>

      <h2>Substitutions</h2>
      <p>
        Cauliflower rice, zucchini noodles, almond flour—AI can suggest swaps. Verify for baking. Our{" "}
        <Link href="/blog/ai-recipe-substitutions" className="text-amber-600 hover:text-amber-700 underline">
          substitutions guide
        </Link>{" "}
        has more.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save your favorite low-carb recipes for next time.
      </p>
    </ArticleWrapper>
  );
}
