import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Dietary restrictions don&apos;t have to limit your cooking. Many AI recipe generators handle vegan, keto, gluten-free, and other diets well—if you know how to ask.
      </p>

      <h2>State Your Diet Up Front</h2>
      <p>
        Tell the AI your diet in the first message: &quot;vegan recipe with chickpeas and spinach&quot; or &quot;keto-friendly dinner, under 10g carbs.&quot; Most tools, including{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          FoodsGPT, Supercook, and Baba Selo
        </Link>
        , adapt when you specify.
      </p>

      <h2>Tools With Strong Diet Support</h2>
      <p>
        FoodsGPT offers diabetes meal plans. Supercook filters by Keto, Vegan, Paleo, Gluten-Free.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you chat naturally—&quot;something vegan and quick&quot; works. For weekly planning, see our{" "}
        <Link href="/blog/ai-recipe-generator-meal-planning" className="text-amber-600 hover:text-amber-700 underline">
          meal planning guide
        </Link>.
      </p>

      <h2>Double-Check Ingredients</h2>
      <p>
        AI can slip—verify hidden gluten, dairy, or carbs. Our{" "}
        <Link href="/blog/ai-generated-recipes-safe" className="text-amber-600 hover:text-amber-700 underline">
          safety guide for AI recipes
        </Link>{" "}
        has more tips. When in doubt, trust your knowledge and adjust.
      </p>
    </ArticleWrapper>
  );
}
