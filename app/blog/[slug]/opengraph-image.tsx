import { ImageResponse } from "next/og";
import { getPostBySlug } from "../blog-config";

export const runtime = "edge";
export const alt = "Baba Selo Blog Post";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title = post?.title ?? "Baba Selo AI Recipe Generator Blog";
  const siteName = "Baba Selo";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
          padding: "48px 64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#78350f",
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#92400e",
              opacity: 0.9,
            }}
          >
            {siteName} · AI Recipe Generator Blog
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            👨‍🍳
          </div>
          <span style={{ fontSize: 18, color: "#78350f", fontWeight: 600 }}>
            babaselo.com/blog
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
