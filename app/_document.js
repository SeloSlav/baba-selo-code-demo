import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Meta tags for SEO */}
                <meta name="description" content="Baba Selo - Your magical recipe companion!" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                {/* Open Graph meta tags for social sharing */}
                <meta property="og:title" content="Baba Selo - A Recipe Wonderland" />
                <meta property="og:description" content="Discover and save amazing recipes with Baba Selo's magical guidance." />
                <meta property="og:image" content="https://babaselo.com/og-image.jpg" />
                <meta property="og:url" content="https://babaselo.com" />
                <meta property="og:type" content="website" />

                {/* Twitter card meta tags */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Baba Selo - A Recipe Wonderland" />
                <meta name="twitter:description" content="Discover and save amazing recipes with Baba Selo's magical guidance." />
                <meta name="twitter:image" content="https://babaselo.com/twitter-image.jpg" />

                {/* Favicon */}
                <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
                <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
                <link rel="shortcut icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <meta name="apple-mobile-web-app-title" content="Baba Selo" />
                <link rel="manifest" href="/site.webmanifest" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
