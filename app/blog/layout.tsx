import { Metadata } from "next";

const SITE_URL = "https://www.babaselo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Baba Selo AI Recipe Generator Blog",
  description: "Recipes, tips, and AI cooking insights from Baba Selo. Compare AI recipe tools, get cooking tips, and discover the best AI recipe generator for your kitchen.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    title: "Baba Selo AI Recipe Generator Blog",
    description: "Recipes, tips, and AI cooking insights from Baba Selo.",
    url: `${SITE_URL}/blog`,
    siteName: "Baba Selo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baba Selo AI Recipe Generator Blog",
    description: "Recipes, tips, and AI cooking insights from Baba Selo.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
