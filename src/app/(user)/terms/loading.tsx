export default function TermsLoading() {
  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-8 w-full bg-gray-600 rounded mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-600 rounded w-full" />
        <div className="h-4 bg-gray-600 rounded w-5/6" />
        <div className="h-4 bg-gray-600 rounded w-4/6" />
      </div>
      <div className="space-y-3 mt-8">
        <div className="h-4 bg-gray-600 rounded w-full" />
        <div className="h-4 bg-gray-600 rounded w-5/6" />
        <div className="h-4 bg-gray-600 rounded w-3/6" />
      </div>
    </main>
  );
}
