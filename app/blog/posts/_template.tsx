/**
 * Template for new blog posts.
 * Copy this file and rename to {slug}.tsx, then add the post to posts-data.json.
 *
 * 1. Create app/blog/posts/{slug}.tsx (copy from this template)
 * 2. Add entry to app/blog/posts-data.json: { slug, title, excerpt, date, readTime }
 * 3. Add to blog-constants.ts RELATED_ARTICLES if needed
 * 4. Run: npm run generate-blog-images {slug}
 */
import Link from "next/link";
import { ArticleWrapper } from "./ArticleWrapper";

export default function PostContent() {
  return (
    <ArticleWrapper>
      <p className="lead text-amber-800/90 text-lg">
        {/* Lead paragraph - appears as intro */}
      </p>

      <h2>Section Heading</h2>
      <p>
        Body text. Use{" "}
        <Link href="/" className="text-amber-600 hover:text-amber-700 underline font-medium">
          Baba Selo
        </Link>{" "}
        for internal links.
      </p>

      <ul>
        <li><strong>Bold:</strong> Description.</li>
      </ul>
    </ArticleWrapper>
  );
}
