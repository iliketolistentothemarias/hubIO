export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#1C1B18] pt-20">
      <div className="container-custom section-padding">
        <div className="mb-8">
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg w-64 mb-2"></div>
          <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-3"></div>
              <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

