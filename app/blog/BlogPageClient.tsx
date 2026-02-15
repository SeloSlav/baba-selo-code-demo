"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BLOG_POSTS } from "./blog-config";

const POSTS_PER_PAGE = 6;

function BlogPostCard({
  post,
}: {
  post: (typeof BLOG_POSTS)[number];
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block rounded-xl border border-amber-100 bg-white hover:bg-amber-50/80 hover:border-amber-200 transition-all duration-200 group shadow-sm overflow-hidden"
    >
      {!imageError && (
        <div className="relative w-full aspect-video overflow-hidden bg-amber-100">
          <Image
            src={`/blog-images/${post.slug}.png`}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 672px"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <div className="p-5">
        <time className="text-sm text-amber-600/80">{post.date}</time>
        <h2 className="text-xl font-semibold text-amber-900 mt-1 group-hover:text-amber-700 transition-colors">
          {post.title}
        </h2>
        <p className="text-amber-800/70 mt-2">{post.excerpt}</p>
        <span className="inline-block mt-3 text-sm text-amber-600">{post.readTime}</span>
      </div>
    </Link>
  );
}

export default function BlogPageClient() {
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const totalPages = Math.ceil(BLOG_POSTS.length / POSTS_PER_PAGE);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const posts = useMemo(
    () => BLOG_POSTS.slice(start, start + POSTS_PER_PAGE),
    [start]
  );

  return (
    <div className="min-h-screen bg-amber-50/80">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="sticky top-0 bg-amber-50/95 backdrop-blur-sm z-10 py-4 -mx-4 px-4 mb-8 shadow-sm border-b border-amber-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">Baba Selo AI Recipe Generator Blog</h1>
            <p className="text-amber-800/70 text-sm mt-0.5">
              Recipes, tips, and AI cooking insights.
            </p>
          </div>
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

        <div className="space-y-4">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>

        {totalPages > 1 && (
          <nav
            className="mt-12 pt-8 border-t border-amber-200 flex items-center justify-center gap-2"
            aria-label="Blog pagination"
          >
            {currentPage > 1 && (
              <Link
                href={currentPage === 2 ? "/blog" : `/blog?page=${currentPage - 1}`}
                className="px-4 py-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-900 font-medium"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-amber-800/80 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/blog?page=${currentPage + 1}`}
                className="px-4 py-2 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-900 font-medium"
              >
                Next →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
