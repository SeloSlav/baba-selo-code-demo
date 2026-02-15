import { Metadata } from "next";
import { Suspense } from "react";
import { BLOG_POSTS } from "./blog-config";
import BlogPageClient from "./BlogPageClient";

const POSTS_PER_PAGE = 6;
const SITE_URL = "https://www.babaselo.com";

type Props = { searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams;
  const pageNum = Math.max(1, parseInt(page || "1", 10));
  const totalPages = Math.ceil(BLOG_POSTS.length / POSTS_PER_PAGE);
  const currentPage = Math.min(pageNum, totalPages);

  const canonical =
    currentPage === 1 ? `${SITE_URL}/blog` : `${SITE_URL}/blog?page=${currentPage}`;
  const prev =
    currentPage > 1
      ? currentPage === 2
        ? `${SITE_URL}/blog`
        : `${SITE_URL}/blog?page=${currentPage - 1}`
      : undefined;
  const next =
    currentPage < totalPages ? `${SITE_URL}/blog?page=${currentPage + 1}` : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title:
      currentPage === 1
        ? "Baba Selo AI Recipe Generator Blog"
        : `Baba Selo AI Recipe Generator Blog - Page ${currentPage}`,
    alternates: {
      canonical,
      ...(prev && { prev }),
      ...(next && { next }),
    },
  };
}

export default async function BlogPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-amber-50/80 flex items-center justify-center">Loading...</div>}>
      <BlogPageClient />
    </Suspense>
  );
}
