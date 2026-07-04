import Link from "next/link";
import { BRAND_NAME } from "@/shared/constants";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-charcoal-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <nav className="container-luxe flex h-16 items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-wide text-charcoal-900">
            {BRAND_NAME}
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/catalog" className="text-sm font-medium text-charcoal-600 transition-colors hover:text-charcoal-900">
              Catalog
            </Link>
            <Link href="/search" className="text-sm font-medium text-charcoal-600 transition-colors hover:text-charcoal-900">
              Search
            </Link>
            <Link href="/contact" className="text-sm font-medium text-charcoal-600 transition-colors hover:text-charcoal-900">
              Contact
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-charcoal-200 bg-charcoal-950 text-charcoal-300">
        <div className="container-luxe py-12">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="font-serif text-xl font-semibold text-white">{BRAND_NAME}</p>
            <p className="text-sm">&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
