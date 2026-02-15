/**
 * Blog post metadata - used for SEO, OG images, and image generation script.
 */
import postsData from "./posts-data.json";

export const BLOG_POSTS = postsData as readonly {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
}[];

export type BlogPostSlug = (typeof BLOG_POSTS)[number]["slug"];

export function getPostBySlug(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

export function getAllPosts() {
  return [...BLOG_POSTS];
}
