import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ProductStatus, JewelryMaterial } from "@prisma/client";

const productCreationSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.string(),
  basePrice: z.number().min(0),
  availableSizes: z.array(z.number()),
  availableMaterials: z.array(z.string()),
  availableGemstones: z.array(z.string()),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
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
    const validated = productCreationSchema.parse(body);

    // Generate slug from name
    const slug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product with this slug already exists", timestamp: new Date().toISOString() },
        { status: 409 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description,
        category: validated.category as any,
        basePrice: validated.basePrice,
        coverImage: validated.coverImage || "",
        images: validated.images || [],
        availableSizes: validated.availableSizes,
        availableMaterials: validated.availableMaterials as JewelryMaterial[],
        availableGemstones: validated.availableGemstones,
        isFeatured: validated.isFeatured || false,
        status: ProductStatus.ACTIVE,
      },
    });

    return NextResponse.json(
      { success: true, data: product, timestamp: new Date().toISOString() },
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