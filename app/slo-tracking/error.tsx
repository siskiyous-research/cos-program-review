'use client';

export default function SLOTrackingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const msg = typeof error?.message === 'string' ? error.message : String(error);
  const stack = typeof error?.stack === 'string' ? error.stack : '';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Something went wrong</h2>
        <pre className="text-left text-sm text-red-600 bg-red-50 p-4 rounded-lg mb-4 overflow-auto max-h-48 whitespace-pre-wrap">
          {msg}
        </pre>
        {stack && (
          <details className="text-left mb-4">
            <summary className="text-sm text-gray-500 cursor-pointer">Stack trace</summary>
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-64 whitespace-pre-wrap">
              {stack}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
