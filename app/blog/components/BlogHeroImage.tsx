"use client";

import { useState } from "react";
import Image from "next/image";

export function BlogHeroImage({ slug, alt }: { slug: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) return null;

  return (
    <div className="relative w-full aspect-video mb-6 rounded-xl overflow-hidden bg-amber-100">
      <Image
        src={`/blog-images/${slug}.png`}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 672px"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
