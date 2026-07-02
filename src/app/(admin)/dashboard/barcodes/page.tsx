"use client";

import { useState } from "react";
import { BarcodeSVG } from "@/presentation/components/barcode/BarcodeSVG";
import { BarcodeFormat } from "@/shared/types";

export default function AdminBarcodesPage() {
  const [input, setInput] = useState("ER-18YW-007-DIA-0001");
  const [format, setFormat] = useState<BarcodeFormat>(BarcodeFormat.CODE128B);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-charcoal-900">Barcode Generator</h1>
        <p className="mt-1 text-sm text-charcoal-500">
          Generate and preview barcodes for product variants.
        </p>
      </div>

      <div className="card-luxe max-w-lg space-y-4">
        <div>
          <label className="label-luxe" htmlFor="barcode-input">
            SKU or Product Code
          </label>
          <input
            id="barcode-input"
            type="text"
            className="input-luxe"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter SKU code..."
          />
        </div>

        <div>
          <label className="label-luxe" htmlFor="barcode-format">
            Format
          </label>
          <select
            id="barcode-format"
            className="input-luxe"
            value={format}
            onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
          >
            <option value={BarcodeFormat.CODE128B}>Code-128B</option>
            <option value={BarcodeFormat.EAN13}>EAN-13</option>
          </select>
        </div>
      </div>

      <div className="card-luxe inline-block">
        {input && (
          <BarcodeSVG
            data={input}
            format={format}
            barHeight={80}
            barWidthUnit={1.5}
            showText
            scale={1}
          />
        )}
      </div>
    </div>
  );
}
