"use client";

/**
 * Skeleton placeholder for recipe cards.
 * Psychological trick: showing structure immediately makes loading feel ~40% faster
 * (Nielsen Norman Group). Shimmer suggests active loading.
 */
export const RecipeCardSkeleton = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-amber-100/50 animate-pulse">
    <div className="relative h-48 bg-amber-100 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
    </div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-amber-100 rounded w-3/4" />
      <div className="h-4 bg-amber-100/80 rounded w-full" />
      <div className="h-4 bg-amber-100/80 rounded w-2/3" />
      <div className="flex gap-2 pt-2">
        <div className="h-6 bg-amber-100 rounded-full w-20" />
        <div className="h-6 bg-amber-100 rounded-full w-16" />
      </div>
    </div>
  </div>
);
