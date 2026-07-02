import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/shared/constants";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-charcoal-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920')] bg-cover bg-center opacity-40" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-charcoal-950/60 to-charcoal-950" />

        <div className="container-luxe relative z-10 text-center">
          <p className="animate-fade-in text-sm font-medium uppercase tracking-[0.3em] text-gold-400">
            Est. 2024
          </p>
          <h1 className="animate-slide-up mt-6 font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            {BRAND_NAME}
          </h1>
          <p className="animate-fade-in mx-auto mt-6 max-w-2xl text-lg text-charcoal-300">
            {BRAND_TAGLINE}
          </p>
          <div className="animate-slide-up mt-10 flex items-center justify-center gap-4">
            <Link href="/catalog" className="btn-gold text-base">
              Explore Collection
            </Link>
            <Link href="/contact" className="btn-outline border-white/30 text-white hover:bg-white/10">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Featured / Placeholder sections */}
      <section className="py-24">
        <div className="container-luxe">
          <div className="text-center">
            <h2 className="section-heading">Our Collection</h2>
            <p className="section-subheading">
              Each piece is a masterpiece of craftsmanship and design.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
