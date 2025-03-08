import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCcw, ArrowLeft } from 'lucide-react';

const ErrorPage = ({ error, resetError }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card text-card-foreground rounded-xl shadow-lg dark:shadow-primary/10 border border-border p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Database Error</h3>
            <p className="text-muted-foreground">
              {error?.message || 'An unexpected error occurred while connecting to the database.'}
            </p>
          </div>

          <div className="w-full border-t border-border my-4" />

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => resetError()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage; 