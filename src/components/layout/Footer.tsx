import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="container-app py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/house.png" alt="RentCheck logo" width={28} height={28} className="rounded-lg" />
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
