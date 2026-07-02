import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const variantCreationSchema = z.object({
  productId: z.string(),
  sku: z.string().min(3),
  barcode: z.string().min(5),
  size: z.number(),
  material: z.string(),
  gemstone: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(0),
});

export async function POST(request: Request) {
  try {
    // Auth check (middleware should have already verified this)
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

    // Verify admin role in Prisma
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
    const validated = variantCreationSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    // Check if SKU already exists
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: validated.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { success: false, error: "SKU already exists", timestamp: new Date().toISOString() },
        { status: 409 }
      );
    }

    // Check if barcode already exists
    const existingBarcode = await prisma.productVariant.findUnique({
      where: { barcode: validated.barcode },
    });

    if (existingBarcode) {
      return NextResponse.json(
        { success: false, error: "Barcode already exists", timestamp: new Date().toISOString() },
        { status: 409 }
      );
    }

    // Auto-generate SKU if not provided (should be provided in schema)
    let sku = validated.sku;

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: validated.productId,
        sku,
        barcode: validated.barcode,
        size: validated.size,
        material: validated.material as any,
        gemstone: validated.gemstone,
        price: validated.price,
        quantity: validated.quantity,
      },
    });

    return NextResponse.json(
      { success: true, data: variant, timestamp: new Date().toISOString() },
      { status: 201 }
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