import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
      <button
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-gray-500">Error Details</summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto max-w-2xl">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
}

export default ErrorBoundary;
