// app/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="brand">
            <Link href="/" className="brand-link">
              Survey Dashboard
            </Link>
          </div>
          <nav className="nav">
            <Link
              href="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/companies"
              className={`nav-link ${isActive("/companies") ? "active" : ""}`}
            >
              Companies
            </Link>
            <Link
              href="/users"
              className={`nav-link ${isActive("/users") ? "active" : ""}`}
            >
              Users
            </Link>
            <Link
              href="/compare"
              className={`nav-link ${isActive("/compare") ? "active" : ""}`}
            >
              Compare
            </Link>
          </nav>
        </header>

        <main className="site-main">{children}</main>

        <footer className="site-footer">
          <span>© {new Date().getFullYear()} Survey Dashboard</span>
        </footer>

        {/* Minimal global styles */}
        <style>{`
          :root { --bg:#fafafa; --panel:#fff; --line:#e5e7eb; --text:#111827; --muted:#6b7280; --accent:#2563eb; }
          * { box-sizing: border-box; }
          html, body { padding:0; margin:0; height:100%; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: var(--text); background: var(--bg); }
          a { color: inherit; text-decoration: none; }

          .site-header {
            position: sticky; top: 0; z-index: 50;
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 16px; background: var(--panel); border-bottom: 1px solid var(--line);
          }
          .brand-link { font-weight: 700; letter-spacing: .2px; }
          .nav { display: flex; gap: 10px; }
          .nav-link { padding: 6px 10px; border-radius: 8px; color: #374151; }
          .nav-link:hover { background: #f3f4f6; }
          .nav-link.active { background: #eef2ff; color: var(--accent); }

          .site-main { padding: 16px; min-height: calc(100vh - 56px - 44px); }
          .site-footer {
            border-top: 1px solid var(--line);
            padding: 10px 16px; font-size: 12px; color: var(--muted); background: var(--panel);
          }

          @media (max-width: 640px) {
            .nav { gap: 6px; }
            .nav-link { padding: 6px 8px; }
            .site-main { padding: 12px; }
          }
        `}</style>
      </body>
    </html>
  );
}
