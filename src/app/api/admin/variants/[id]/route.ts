import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InventoryStatus } from "@prisma/client";

const variantUpdateSchema = z.object({
  sku: z.string().min(3).optional(),
  barcode: z.string().min(5).optional(),
  size: z.number().optional(),
  material: z.string().optional(),
  gemstone: z.string().optional(),
  price: z.number().min(0).optional(),
  quantity: z.number().min(0).optional(),
  status: z.enum([
    InventoryStatus.IN_STOCK,
    InventoryStatus.LOW_STOCK,
    InventoryStatus.OUT_OF_STOCK,
    InventoryStatus.DISCONTINUED,
  ]).optional(),
  images: z.array(z.string()).optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Auth and admin verification
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", timestamp: new Date().toISOString() },
        { status: 401 }
      );
    }

    const userRecord = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    if (userRecord?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions", timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = variantUpdateSchema.parse(body);

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: params.id },
    });

    if (!existingVariant) {
      return NextResponse.json(
        { success: false, error: "Variant not found", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    // Check for uniqueness if fields are being updated
    if (validated.sku && validated.sku !== existingVariant.sku) {
      const skuExists = await prisma.productVariant.findFirst({
        where: { sku: validated.sku, id: { not: params.id } },
      });
      if (skuExists) {
        return NextResponse.json(
          { success: false, error: "SKU already exists", timestamp: new Date().toISOString() },
          { status: 409 }
        );
      }
    }

    if (validated.barcode && validated.barcode !== existingVariant.barcode) {
      const barcodeExists = await prisma.productVariant.findFirst({
        where: { barcode: validated.barcode, id: { not: params.id } },
      });
      if (barcodeExists) {
        return NextResponse.json(
          { success: false, error: "Barcode already exists", timestamp: new Date().toISOString() },
          { status: 409 }
        );
      }
    }

    // If quantity is being updated, update status automatically
    let status = existingVariant.status;
    if (validated.quantity !== undefined && validated.quantity !== existingVariant.quantity) {
      if (validated.quantity > 5) {
        status = InventoryStatus.IN_STOCK;
      } else if (validated.quantity > 0) {
        status = InventoryStatus.LOW_STOCK;
      } else {
        status = InventoryStatus.OUT_OF_STOCK;
      }
    }

    if (validated.status) {
      status = validated.status;
    }

    // Update variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id: params.id },
      data: {
        ...validated,
        status,
        material: validated.material as any,
      },
    });

    return NextResponse.json(
      { success: true, data: updatedVariant, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message, timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}