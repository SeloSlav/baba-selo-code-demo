import { RecipeCardSkeleton } from "../components/RecipeCardSkeleton";

export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="sticky top-0 bg-amber-50/95 backdrop-blur-sm z-10 py-4 -mx-4 px-4 shadow-sm border-b border-amber-100">
        <div className="h-10 bg-amber-100 rounded w-48 mb-4 animate-pulse" />
        <div className="h-14 bg-amber-100 rounded-xl animate-pulse" />
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <RecipeCardSkeleton key={n} />
        ))}
      </div>
    </div>
  );
}
