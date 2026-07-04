import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request) {
  try {
    // Admin authentication via middleware headers
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

    // Verify admin role via Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true },
    });

    if (prismaUser?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions", timestamp: new Date().toISOString() },
        { status: 403 }
      );
    }

    // Execute queries in parallel
    const [
      totalProducts,
      totalVariants,
      totalInventoryUnits,
      lowStockProducts,
      outOfStockProducts,
      activeProducts,
    ] = await Promise.all([
      // Total products (active only)
      prisma.product.count({
        where: { status: "ACTIVE" },
      }),

      // Total variants (all variants)
      prisma.productVariant.count(),

      // Total inventory units (sum of quantities)
      prisma.productVariant.aggregate({
        _sum: { quantity: true },
        where: { status: { in: ["IN_STOCK", "LOW_STOCK"] } },
      }),

      // Low stock products (products with at least one low stock variant)
      prisma.product.count({
        where: {
          status: "ACTIVE",
          variants: {
            some: { status: "LOW_STOCK" },
          },
        },
      }),

      // Out of stock products (products with at least one out of stock variant)
      prisma.product.count({
        where: {
          status: "ACTIVE",
          variants: {
            some: { status: "OUT_OF_STOCK" },
          },
        },
      }),

      // Active products
      prisma.product.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    const result = {
      totalProducts,
      totalVariants,
      totalInventoryUnits: totalInventoryUnits._sum.quantity || 0,
      lowStockCount: lowStockProducts,
      outOfStockCount: outOfStockProducts,
      activeProductCount: activeProducts,
    };

    return NextResponse.json(
      { success: true, data: result, timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
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