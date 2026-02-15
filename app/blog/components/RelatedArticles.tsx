"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPostBySlug, getAllPosts } from "../blog-config";
import { RELATED_ARTICLES } from "../blog-constants";

interface RelatedArticlesProps {
  currentSlug: string;
}

export function RelatedArticles({ currentSlug }: RelatedArticlesProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const related = useMemo(() => {
    const relatedSlugs = RELATED_ARTICLES[currentSlug];
    if (relatedSlugs?.length) {
      return relatedSlugs.map((slug) => getPostBySlug(slug)).filter(Boolean);
    }
    // Fallback: show 3 other posts by date (every post gets internal links)
    const all = getAllPosts()
      .filter((p) => p.slug !== currentSlug)
      .sort((a, b) => b.date.localeCompare(a.date));
    return all.slice(0, 3);
  }, [currentSlug]);

  if (related.length === 0) return null;

  const handleImageError = (slug: string) => {
    setImageErrors((prev) => ({ ...prev, [slug]: true }));
  };

  return (
    <div className="mt-12 pt-8 border-t border-amber-200">
      <h2 className="text-xl font-semibold text-amber-900 mb-6">Related Articles</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block p-4 rounded-xl border border-amber-100 bg-white hover:bg-amber-50/80 hover:border-amber-200 transition-all group"
          >
            {!imageErrors[post.slug] && (
              <div className="relative w-full aspect-video mb-3 rounded-lg overflow-hidden bg-amber-100">
                <Image
                  src={`/blog-images/${post.slug}.png`}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  onError={() => handleImageError(post.slug)}
                />
              </div>
            )}
            <h3 className="font-semibold text-amber-900 group-hover:text-amber-700 line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-amber-600 mt-1">{post.readTime}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
