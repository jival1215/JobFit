"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/saved", label: "Saved" },
  { href: "/account", label: "Account" },
  { href: "/about", label: "About" }
];

function navClass(isActive: boolean, isPending: boolean) {
  if (isActive || isPending) {
    return "rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm transition";
  }
  return "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-ink hover:shadow-sm";
}

export function Navbar() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState("");
  const pendingItem = navItems.find((item) => item.href === pendingHref);

  useEffect(() => {
    setPendingHref("");
  }, [pathname]);

  useEffect(() => {
    if (!pendingHref) return;
    const timeout = window.setTimeout(() => setPendingHref(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  function beginNavigation(href: string) {
    if (href !== pathname) setPendingHref(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-xl">
      {pendingHref ? (
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-brand-50">
          <div className="h-full w-1/3 animate-[route-progress_1s_ease-in-out_infinite] rounded-full bg-brand-600" />
        </div>
      ) : null}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => beginNavigation("/")} className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-sm font-black text-white">
            JF
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">JobFIT</span>
        </Link>
        <div className="hidden items-center gap-2 rounded-full border border-line bg-cloud p-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isPending = pendingHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => beginNavigation(item.href)}
                aria-current={isActive ? "page" : undefined}
                className={navClass(isActive, isPending)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {pendingItem ? (
            <span className="hidden rounded-full border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 sm:inline-flex">
              Loading {pendingItem.label}...
            </span>
          ) : null}
          <Link
            href="/account"
            onClick={() => beginNavigation("/account")}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-slate-50"
          >
            Sign in
          </Link>
          <Link
            href="/upload"
            onClick={() => beginNavigation("/upload")}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Start matching
          </Link>
        </div>
      </nav>
    </header>
  );
}
