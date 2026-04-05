export default function DirectoryLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        <div className="mb-8">
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-48 mb-4"></div>
          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl w-full max-w-xl"></div>
        </div>
        <div className="flex gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-24"></div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64">
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

