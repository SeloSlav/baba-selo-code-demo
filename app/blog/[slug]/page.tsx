import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs } from "../blog-config";
import { AuthorBlock } from "../components/AuthorBlock";
import { RelatedArticles } from "../components/RelatedArticles";
import { BlogHeroImage } from "../components/BlogHeroImage";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const postMeta = getPostBySlug(slug);

  if (!postMeta) {
    notFound();
  }

  let PostContent: React.ComponentType;
  try {
    const mod = await import(`../posts/${slug}`);
    PostContent = mod.default;
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-amber-50/80">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Back to Blog
          </Link>
          <Link href="/" className="flex-shrink-0 w-24 h-24 relative block" aria-label="Go to Baba Selo home">
            <Image
              src="/baba-removebg.png"
              alt="Baba Selo"
              fill
              className="object-contain"
              sizes="96px"
            />
          </Link>
        </div>

        <header className="mb-8">
          <BlogHeroImage slug={slug} alt={postMeta.title} />
          <time className="text-sm text-amber-600/80">{postMeta.date}</time>
          <h1 className="text-3xl md:text-4xl font-bold text-amber-900 mt-1">{postMeta.title}</h1>
          <p className="text-amber-600 mt-2">{postMeta.readTime}</p>
        </header>

        <div className="text-amber-900 p-6 rounded-xl border border-amber-100 bg-white shadow-sm">
          <PostContent />
        </div>

        <AuthorBlock />
        <RelatedArticles currentSlug={slug} />

        <div className="mt-8 pt-6 border-t border-amber-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
