"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "@/components/auth/AuthButton";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">
              Rent<span className="text-brand-600">Check</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`btn-ghost text-sm ${pathname === "/" ? "text-brand-600 bg-brand-50" : ""}`}
            >
              Analizar
            </Link>
            <Link
              href="/radar"
              className={`btn-ghost text-sm ${pathname === "/radar" ? "text-brand-600 bg-brand-50" : ""}`}
            >
              Radar
            </Link>
            <Link
              href="/mis-analisis"
              className={`btn-ghost text-sm ${pathname === "/mis-analisis" ? "text-brand-600 bg-brand-50" : ""}`}
            >
              Historial
            </Link>
          </nav>

          {/* Auth + mobile toggle */}
          <div className="flex items-center gap-2">
            <AuthButton />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menú"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" ? "text-brand-600 bg-brand-50" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Analizar
            </Link>
            <Link
              href="/radar"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/radar" ? "text-brand-600 bg-brand-50" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Radar
            </Link>
            <Link
              href="/mis-analisis"
              onClick={() => setMobileOpen(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/mis-analisis" ? "text-brand-600 bg-brand-50" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Historial
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
