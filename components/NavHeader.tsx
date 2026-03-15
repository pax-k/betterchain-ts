"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavHeader() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-white">
      <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="text-sm font-bold tracking-tight">
          FactCheck
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`text-sm ${
              pathname === "/"
                ? "text-[var(--foreground)] font-medium"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Check
          </Link>
          <Link
            href="/history"
            className={`text-sm ${
              pathname.startsWith("/history")
                ? "text-[var(--foreground)] font-medium"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            History
          </Link>
        </div>
      </div>
    </nav>
  );
}
