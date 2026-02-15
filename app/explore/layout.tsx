import { Metadata } from "next";

const SITE_URL = "https://www.babaselo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Explore AI Recipes | Baba Selo - Discover & Save Community Recipes",
  description:
    "Browse AI-generated recipes from the Baba Selo community. Filter by cuisine, time, diet, and difficulty. Discover delicious recipes created with our AI recipe generator.",
  alternates: {
    canonical: `${SITE_URL}/explore`,
  },
  openGraph: {
    title: "Explore AI Recipes | Baba Selo",
    description:
      "Browse AI-generated recipes from the Baba Selo community. Filter by cuisine, time, diet, and difficulty.",
    url: `${SITE_URL}/explore`,
    siteName: "Baba Selo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore AI Recipes | Baba Selo",
    description:
      "Browse AI-generated recipes from the Baba Selo community. Filter by cuisine, time, diet, and difficulty.",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
