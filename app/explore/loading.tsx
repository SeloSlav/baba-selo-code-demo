export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="sticky top-0 bg-white z-10 py-4 -mx-4 px-4 shadow-sm">
        <div className="h-10 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
