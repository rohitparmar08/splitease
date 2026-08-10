import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorMessage = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 flex items-start space-x-3 my-4">
      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 underline text-xs font-semibold hover:text-rose-200"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
