import { AlertCircle } from "lucide-react";

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen bg-[#fff0c9] flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="mb-4 flex justify-center">
          <AlertCircle size={48} color="#ef4444" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-4 text-sm">
          Don't worry, this happens sometimes. Please try refreshing the page.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;