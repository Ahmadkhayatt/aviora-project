"use client"

import React from "react";
import Image from "next/image";
import { Badge } from "@/presentation/components/ui/Badge";
import { Card } from "@/presentation/components/ui/Card";
import { Modal } from "@/presentation/components/ui/Modal";
import { ToastContainer, showToast } from "@/presentation/components/ui/Toast";
import { cn } from "@/shared/utils/class-utils";

export interface ProductDetailProps {
  readonly product: any;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [isVariantModalOpen, setIsVariantModalOpen] = React.useState(false);
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = React.useState<string | null>(null);
  const [selectedGemstone, setSelectedGemstone] = React.useState<string | null>(null);

  const handleAddToCart = () => {
    showToast("success", "Product added to cart!", {
      type: "success",
      duration: 3000,
    });
  };

  const handleVariantChange = () => {
    if (selectedSize && selectedMaterial) {
      setIsVariantModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer />

      <div className="container mx-auto px-4 py-12">
        <nav className="text-sm text-charcoal-500 mb-8">
          <ol className="flex items-center space-x-2">
            <li><a href="/" className="hover:text-gold-600">Home</a></li>
            <li>/</li>
            <li><a href="/catalog" className="hover:text-gold-600">Catalog</a></li>
            <li>/</li>
            <li className="text-charcoal-950">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative rounded-2xl overflow-hidden border-2 border-charcoal-200">
              <Image
                src={product.coverImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image: string, index: number) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden border border-charcoal-200">
                    <Image
                      src={image}
                      alt={`${product.name} - view ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-charcoal-950 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 text-charcoal-600">
                <Badge variant="slate">
                  {product.category.toString().replace(/_/g, " ")}
                </Badge>
                {product.isFeatured && (
                  <Badge variant="gold">Featured</Badge>
                )}
              </div>
            </div>

            <div className="text-4xl font-bold text-luxury-primary">
              ${product.basePrice.toLocaleString()}
            </div>

            <div className="prose max-w-none">
              <h3 className="font-serif text-xl font-semibold text-charcoal-950 mb-3">
                Description
              </h3>
              <p className="text-charcoal-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variant Selection */}
            <div className="space-y-6">
              <h3 className="font-serif text-xl font-semibold text-charcoal-950">
                Select Variant
              </h3>

              {/* Size Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-charcoal-900">
                  Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {product.availableSizes.map((size: any) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                        selectedSize === size
                          ? "border-gold-500 bg-gold-50 text-gold-700"
                          : "border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-charcoal-900">
                  Material
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.availableMaterials.map((material: any) => (
                    <button
                      key={material}
                      onClick={() => setSelectedMaterial(material)}
                      className={cn(
                        "flex items-center gap-2 py-2 px-4 rounded-full border transition-all",
                        selectedMaterial === material
                          ? "border-gold-500 bg-gold-50 text-gold-700"
                          : "border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
                      )}
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300" />
                      <span className="text-sm">{material.toString().split('_')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemstone Selector */}
              {product.availableGemstones.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-charcoal-900">
                    Gemstone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedGemstone(null)}
                      className={cn(
                        "py-2 px-4 rounded-full border text-sm font-medium transition-all",
                        selectedGemstone === null
                          ? "border-gold-500 bg-gold-50 text-gold-700"
                          : "border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
                      )}
                    >
                      No Gemstone
                    </button>
                    {product.availableGemstones.map((gemstone: string) => (
                      <button
                        key={gemstone}
                        onClick={() => setSelectedGemstone(gemstone)}
                        className={cn(
                          "py-2 px-4 rounded-full border text-sm font-medium transition-all",
                          selectedGemstone === gemstone
                            ? "border-gold-500 bg-gold-50 text-gold-700"
                            : "border-charcoal-300 bg-white text-charcoal-700 hover:border-charcoal-400"
                        )}
                      >
                        {gemstone}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Variant Summary */}
              {(selectedSize && selectedMaterial) && (
                <div className="bg-charcoal-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-charcoal-900">
                    Selected Variant
                  </div>
                  <div className="text-sm text-charcoal-700">
                    Size: {selectedSize} | Material: {selectedMaterial.split('_')[1]} | 
                    Gemstone: {selectedGemstone || 'None'}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleVariantChange}
                disabled={!selectedSize || !selectedMaterial}
                className={cn(
                  "flex-1 py-4 px-6 rounded-lg font-semibold transition-all",
                  !selectedSize || !selectedMaterial
                    ? "bg-charcoal-200 text-charcoal-500 cursor-not-allowed"
                    : "bg-charcoal-950 text-white hover:bg-charcoal-900 active:scale-95"
                )}
              >
                Select This Variant
              </button>
              <button
                onClick={handleAddToCart}
                className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-semibold rounded-lg transition-all active:scale-95"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card variant="default" padded={true} className="space-y-4">
            <h3 className="font-serif text-xl font-semibold text-charcoal-950">
              Features
            </h3>
            <ul className="space-y-2 text-charcoal-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-luxury-primary rounded-full" />
                {product.availableSizes.length} size options available
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-luxury-primary rounded-full" />
                {product.availableMaterials.length} material choices
              </li>
              {product.availableGemstones.length > 0 && (
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-luxury-primary rounded-full" />
                  Custom gemstone options available
                </li>
              )}
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-luxury-primary rounded-full" />
                Free worldwide shipping
              </li>
            </ul>
          </Card>

          <Card variant="default" padded={true} className="space-y-4">
            <h3 className="font-serif text-xl font-semibold text-charcoal-950">
              SKU & Barcode
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-charcoal-600">SKU</div>
                <div className="font-mono text-sm bg-charcoal-100 px-3 py-2 rounded">
                  {product.variants?.[0]?.sku || 'TBD'}
                </div>
              </div>
              <div>
                <div className="text-sm text-charcoal-600">Barcode</div>
                <div className="font-mono text-sm bg-charcoal-100 px-3 py-2 rounded">
                  {product.variants?.[0]?.barcode || 'TBD'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Variant Selection Modal */}
      <VariantSelectorModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        selectedSize={selectedSize}
        selectedMaterial={selectedMaterial}
        selectedGemstone={selectedGemstone}
      />
    </div>
  );
}

function VariantSelectorModal({
  isOpen,
  onClose,
  selectedSize,
  selectedMaterial,
  selectedGemstone,
}: any) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Variant Selected"
      description="Review your selection and proceed to checkout"
    >
      <div className="space-y-6">
        <div className="bg-charcoal-50 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-charcoal-600">Size</div>
              <div className="font-semibold">{selectedSize}</div>
            </div>
            <div>
              <div className="text-charcoal-600">Material</div>
              <div className="font-semibold">{selectedMaterial?.split('_')[1]}</div>
            </div>
            <div>
              <div className="text-charcoal-600">Gemstone</div>
              <div className="font-semibold">{selectedGemstone || 'None'}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 border border-charcoal-300 rounded-lg text-charcoal-700 hover:bg-charcoal-50 transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => {
              showToast("success", "Variant added to cart successfully!", {
                type: "success",
                duration: 3000,
              });
              onClose();
            }}
            className="flex-1 py-3 px-6 bg-luxury-primary text-charcoal-950 font-semibold rounded-lg hover:bg-luxury-secondary transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Modal>
  );
}