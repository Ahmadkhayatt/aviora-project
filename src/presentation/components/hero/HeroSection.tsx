"use client"

import React from "react";
import Link from "next/link";
import { Button } from "@/presentation/components/ui/Button";
import { Badge } from "@/presentation/components/ui/Badge";

export interface HeroSectionProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly ctaPrimary?: {
    readonly text: string;
    readonly href: string;
  };
  readonly ctaSecondary?: {
    readonly text: string;
    readonly href: string;
  };
  readonly badge?: string;
  readonly imageUrl?: string;
}

export function HeroSection({
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  badge,
  imageUrl = "/images/hero-jewelry.jpg",
}: HeroSectionProps) {
  const defaultTitle = "Timeless Elegance";
  const defaultSubtitle = "Discover exquisite jewelry pieces crafted with precision and artistry for your most cherished moments";

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/80 via-charcoal-950/60 to-charcoal-950/80 z-10" />
        <img
          src={imageUrl}
          alt="Luxury jewelry collection"
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1515562141207-9e7c1a2d8e3c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {badge && (
            <Badge
              variant="gold"
              className="animate-pulse-gold text-base px-4 py-2"
            >
              {badge}
            </Badge>
          )}

          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight">
            {title || defaultTitle}
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {subtitle || defaultSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            {ctaPrimary && (
              <Link href={ctaPrimary.href} passHref>
                <Button
                  size="lg"
                  className="bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-semibold px-8 py-4 transition-all duration-300 hover:scale-105"
                >
                  {ctaPrimary.text}
                </Button>
              </Link>
            )}

            {ctaSecondary && (
              <Link href={ctaSecondary.href} passHref>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-charcoal-950 px-8 py-4 transition-all duration-300 hover:scale-105"
                >
                  {ctaSecondary.text}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-20 bg-gradient-to-b from-gold-500/50 to-transparent" />
    </section>
  );
}