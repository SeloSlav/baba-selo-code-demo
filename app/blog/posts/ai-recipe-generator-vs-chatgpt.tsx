import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        ChatGPT can suggest recipes—but dedicated AI recipe tools like Baba Selo offer saving and food images. Here&apos;s when each makes sense.
      </p>

      <h2>When ChatGPT Is Enough</h2>
      <p>
        For one-off questions (&quot;what goes with lamb?&quot;), quick ideas, or general cooking advice, ChatGPT works fine. No account needed for basic use, and it&apos;s already in your workflow if you use it for other tasks.
      </p>

      <h2>When a Dedicated AI Recipe Generator Wins</h2>
      <p>
        If you want to <strong>save recipes</strong> to a profile or <strong>generate AI food images</strong>, a dedicated tool is better.{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you chat to create recipes, save them, and get AI-generated photos in multiple styles. ChatGPT doesn&apos;t save recipes or create food images.
      </p>

      <h2>Our Recommendation</h2>
      <p>
        Use ChatGPT for quick, disposable answers. Use a dedicated AI recipe generator when you want to build a collection or get shareable recipe images. Compare{" "}
        <Link href="/blog/ai-recipe-generator-comparison" className="text-amber-600 hover:text-amber-700 underline">
          six popular tools
        </Link>{" "}
        to find your fit.
      </p>
    </ArticleWrapper>
  );
}
