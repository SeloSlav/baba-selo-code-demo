import { Metadata } from "next";
import { getPostBySlug } from "../blog-config";

type Props = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = "https://www.babaselo.com";

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found | Baba Selo AI Recipe Generator Blog",
      description: "The blog post you're looking for doesn't exist.",
      metadataBase: new URL(SITE_URL),
    };
  }

  const title = `${post.title} | Baba Selo AI Recipe Generator Blog`;
  const description = post.excerpt;
  const url = `${SITE_URL}/blog/${slug}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Baba Selo",
      type: "article",
      publishedTime: post.date,
      // opengraph-image.tsx in this folder provides the image
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
