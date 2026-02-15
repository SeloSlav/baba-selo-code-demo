import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Use AI recipe generators to plan your week. Get meal ideas, shopping lists, and recipes that fit your schedule and goals.
      </p>

      <h2>Start With Your Constraints</h2>
      <p>
        Tell the AI: &quot;I need 5 dinners for the week, 30 min each, family-friendly.&quot; Or &quot;meal plan for 2, keto, under $80.&quot; The more you specify, the better the plan. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more tips.
      </p>

      <h2>Tools for Meal Planning</h2>
      <p>
        DishGen and ChefGPT offer built-in meal planners.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you chat to build a plan and{" "}
        <Link href="/blog/save-ai-generated-recipes" className="text-amber-600 hover:text-amber-700 underline">
          save recipes
        </Link>{" "}
        to your profile. For dietary needs, see{" "}
        <Link href="/blog/ai-recipe-generators-vegan-keto-glutenfree" className="text-amber-600 hover:text-amber-700 underline">
          vegan, keto, gluten-free options
        </Link>.
      </p>

      <h2>From Plan to Shopping List</h2>
      <p>
        Many AI tools can generate a shopping list from your meal plan. Ask explicitly: &quot;give me a consolidated shopping list for these 5 recipes.&quot; Compare{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          six AI recipe tools
        </Link>{" "}
        to find the best fit for planning.
      </p>
    </ArticleWrapper>
  );
}
