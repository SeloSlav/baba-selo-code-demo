import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { DeleteRecipeProvider } from "./context/DeleteRecipeContext";
import { PointsProvider } from "./context/PointsContext";
import PWABanner from "./components/PWABanner";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: "no",
};

export const metadata = {
  title: "Baba Selo - Your Magical Recipe Companion",

  description:
    "Discover and save amazing recipes with Baba Selo's magical guidance.",

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
    title: "Baba Selo - Your Magical Recipe Companion",

    description:
      "Discover and save amazing recipes with Baba Selo's magical guidance.",

    url: "https://babaselo.com",

    type: "website",

    images: [
      {
        url: "https://babaselo.com/og-image.jpg",

        width: 1200,

        height: 630,

        alt: "Baba Selo Recipe Preview",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Baba Selo - Your Magical Recipe Companion",

    description:
      "Discover and save amazing recipes with Baba Selo's magical guidance.",

    images: ["https://babaselo.com/twitter-image.jpg"],
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
          <DeleteRecipeProvider>
            <PointsProvider>
              <PWABanner />
              {children}
            </PointsProvider>
          </DeleteRecipeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}