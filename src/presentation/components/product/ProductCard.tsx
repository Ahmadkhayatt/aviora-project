"use client"

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/presentation/components/ui/Badge";
import { Card } from "@/presentation/components/ui/Card";

export interface ProductCardProps {
  readonly product: any;
  readonly onClick?: (product: any) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const handleClick = () => {
    onClick?.(product);
  };

  const content = (
    <Card variant="interactive" padded={false} className="overflow-hidden group">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.coverImage}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.isFeatured && (
          <div className="absolute top-2 left-2">
            <Badge variant="gold" size="sm">Featured</Badge>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="font-serif font-semibold text-charcoal-950 text-lg mb-2 line-clamp-1">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-luxury-primary">
            ${product.basePrice.toLocaleString()}
          </div>
          <Badge variant="slate" size="sm">
            {product.category.toString().replace(/_/g, " ")}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm text-charcoal-600">
            Materials: {product.availableMaterials.slice(0, 3).map((m: any) => (
              <span key={m} className="inline-block bg-charcoal-100 text-charcoal-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                {m.toString().includes('_') ? m.toString().split('_')[1] : m.toString()}
              </span>
            ))}
          </div>
          {product.availableGemstones.length > 0 && (
            <div className="text-sm text-charcoal-600">
              Gemstones: {product.availableGemstones.slice(0, 2).join(", ")}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-charcoal-200">
          <div className="text-xs text-charcoal-500 mb-2">
            {product.availableSizes.length} sizes available
          </div>
          <div className="flex flex-wrap gap-1">
            {product.availableMaterials.slice(0, 4).map((material: any) => (
              <div
                key={material}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-medium"
                title={material.toString()}
              >
                {material.toString().charAt(0)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );

  if (onClick) {
    return (
      <button
        onClick={handleClick}
        className="text-left w-full transition-transform duration-200 hover:scale-[1.02]"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={`/catalog/${product.slug}`} className="block transition-transform duration-200 hover:scale-[1.02]">
      {content}
    </Link>
  );
}