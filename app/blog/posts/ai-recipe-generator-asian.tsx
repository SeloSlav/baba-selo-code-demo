import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        Asian flavors and AI recipe generators are a great combo. Get stir-fry, noodle, and rice bowl ideas with pantry staples in seconds.
      </p>

      <h2>Specify the Style</h2>
      <p>
        &quot;Asian stir-fry&quot; or &quot;Chinese-style&quot; vs &quot;Thai curry&quot; vs &quot;Japanese&quot;—each has different flavors. Tell the AI what you have: soy sauce, rice vinegar, ginger, etc. Our{" "}
        <Link href="/blog/how-to-use-ai-recipe-generators-guide" className="text-amber-600 hover:text-amber-700 underline">
          prompting guide
        </Link>{" "}
        has more.
      </p>

      <h2>Asian + Protein + Rice or Noodles</h2>
      <p>
        <Link href="/blog/ai-recipe-generator-rice" className="text-amber-600 hover:text-amber-700 underline">
          Rice
        </Link>{" "}
        and noodles are staples. Combine with{" "}
        <Link href="/blog/ai-recipe-generator-chicken" className="text-amber-600 hover:text-amber-700 underline">
          chicken
        </Link>{" "}
        or tofu: &quot;chicken stir-fry with rice&quot; or &quot;vegan noodle bowl.&quot; For{" "}
        <Link href="/blog/ai-recipe-generator-pasta" className="text-amber-600 hover:text-amber-700 underline">
          pasta
        </Link>
        , Asian noodle dishes use similar techniques.
      </p>

      <h2>Quick and One-Pot</h2>
      <p>
        Stir-fries are fast. Add &quot;20 minutes&quot; or &quot;one wok&quot; for{" "}
        <Link href="/blog/ai-recipe-generator-quick-meals" className="text-amber-600 hover:text-amber-700 underline">
          quick meals
        </Link>{" "}
        and minimal cleanup.
      </p>

      <h2>Gluten-Free Asian</h2>
      <p>
        Soy sauce has gluten—use tamari for gluten-free. Tell the AI &quot;gluten-free Asian&quot; if needed. See our{" "}
        <Link href="/blog/ai-recipe-generator-gluten-free" className="text-amber-600 hover:text-amber-700 underline">
          gluten-free guide
        </Link>
        .{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        lets you save your favorite Asian recipes for next time.
      </p>
    </ArticleWrapper>
  );
}
