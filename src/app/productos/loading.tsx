export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block lg:w-60 flex-shrink-0">
            <div className="skeleton h-[55vh] rounded-xl" />
          </div>
          <div className="flex-1">
            <div className="skeleton h-12 rounded-xl mb-5" />
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="skeleton aspect-square" style={{ borderRadius: 0 }} />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-2.5 w-1/2" />
                    <div className="skeleton h-3 w-2/3" />
                    <div className="skeleton h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
