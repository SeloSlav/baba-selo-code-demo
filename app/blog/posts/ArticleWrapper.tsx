import React from "react";

const ARTICLE_CLASS =
  "max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-amber-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ul]:my-4 [&_p]:my-3 [&_p]:text-amber-800/90 [&_table]:text-sm";

export function ArticleWrapper({ children }: { children: React.ReactNode }) {
  return <article className={ARTICLE_CLASS}>{children}</article>;
}
