"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — redirects to Master Data > Users browse page */
export default function AdminUsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/users");
  }, [router]);

  return <p className="text-gray-500 p-6">Redirecting to Users…</p>;
}
