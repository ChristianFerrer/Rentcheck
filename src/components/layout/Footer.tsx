import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="container-app py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
            <span className="font-semibold text-gray-900">
              Rent<span className="text-brand-600">Check</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} RentCheck. Los precios son estimaciones
            orientativas.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/radar" className="hover:text-gray-900 transition-colors">
              Radar
            </Link>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Analizar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
