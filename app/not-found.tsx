import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f5fa] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        The page you requested does not exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-sm hover:bg-brand-600 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
