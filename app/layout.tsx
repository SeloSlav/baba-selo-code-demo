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
  title: "Baba Selo | Your AI Balkan Recipe Companion—Accurate Recipes, Grandma Vibes",
  description:
    "The perfect AI Balkan recipe companion. Actually accurate recipes, sounds and acts like your grandma, gives real advice—not generic bot nonsense. Create, save, and cook with confidence.",
  keywords: ["Balkan recipes", "AI recipe companion", "grandma recipes", "Baba Selo", "accurate Balkan cooking", "AI cooking assistant"],
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
    title: "Baba Selo | Your AI Balkan Recipe Companion—Accurate Recipes, Grandma Vibes",
    description:
      "The perfect AI Balkan recipe companion. Actually accurate recipes, sounds and acts like your grandma, gives real advice—not generic bot nonsense.",
    url: "https://www.babaselo.com",
    type: "website",
    siteName: "Baba Selo",
    images: [
      {
        url: "https://www.babaselo.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Baba Selo - Your AI Balkan recipe companion with accurate recipes and grandma vibes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baba Selo | Your AI Balkan Recipe Companion—Accurate Recipes, Grandma Vibes",
    description:
      "The perfect AI Balkan recipe companion. Actually accurate recipes, sounds and acts like your grandma, gives real advice—not generic bot nonsense.",
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