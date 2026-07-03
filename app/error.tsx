"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-error-50 text-error-500">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-gray-900">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-sm hover:bg-brand-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
