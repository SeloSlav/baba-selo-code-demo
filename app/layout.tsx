import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { DeleteRecipeProvider } from "./context/DeleteRecipeContext";
import { PointsProvider } from "./context/PointsContext";
import { PlanDebugProvider } from "./context/PlanDebugContext";
import PWABanner from "./components/PWABanner";
import { PlanDebugToggle } from "./components/PlanDebugToggle";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
};

export const metadata = {
  title: "AI Recipe Generator | Baba Selo - Create & Save Recipes with AI",
  description:
    "AI Recipe Generator that creates personalized recipes, generates food images, and helps you save & share your culinary creations. Chat with Baba Selo for magical recipe guidance.",
  keywords: ["AI recipe generator", "AI recipes", "recipe generator", "Baba Selo", "AI cooking assistant"],
  icons: {
    icon: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        url: "/favicon-96x96.png",
      },
      { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "AI Recipe Generator | Baba Selo - Create & Save Recipes with AI",
    description:
      "AI Recipe Generator that creates personalized recipes, generates food images, and helps you save & share your culinary creations. Chat with Baba Selo for magical recipe guidance.",
    url: "https://www.babaselo.com",
    type: "website",
    siteName: "Baba Selo",
    images: [
      {
        url: "https://www.babaselo.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AI Recipe Generator - Baba Selo creates and saves recipes with AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Recipe Generator | Baba Selo - Create & Save Recipes with AI",
    description:
      "AI Recipe Generator that creates personalized recipes, generates food images, and helps you save & share your culinary creations.",
    images: ["https://www.babaselo.com/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PlanDebugProvider>
            <DeleteRecipeProvider>
              <PointsProvider>
                <PWABanner />
                {children}
                <PlanDebugToggle />
              </PointsProvider>
            </DeleteRecipeProvider>
          </PlanDebugProvider>
        </AuthProvider>
      </body>
    </html>
  );
}