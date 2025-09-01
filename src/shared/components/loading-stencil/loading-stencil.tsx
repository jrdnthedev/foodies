export default function LoadingStencil() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-4 w-48 bg-gray-200 animate-pulse rounded mt-4"></div>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 bg-gray-200 animate-pulse rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-5/6 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
