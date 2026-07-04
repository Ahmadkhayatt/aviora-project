"use client"

import React from "react";
import { ProductCard } from "@/presentation/components/product/ProductCard";
import { Button } from "@/presentation/components/ui/Button";

export interface FeaturedProductsProps {
  readonly products: readonly any[];
  readonly title?: string;
  readonly subtitle?: string;
}

export function FeaturedProducts({ products, title, subtitle }: FeaturedProductsProps) {
  const defaultTitle = "Featured Collection";
  const defaultSubtitle = "Discover our most treasured designs, each meticulously crafted to perfection";

  return (
    <section className="py-20 bg-charcoal-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            {title || defaultTitle}
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {subtitle || defaultSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-16">
          <Button
            size="lg"
            className="bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-semibold px-8 py-4"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            View Full Collection
          </Button>
        </div>
      </div>
    </section>
  );
}