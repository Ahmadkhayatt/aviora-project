import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    // Get product ID from URL or params
    const pathId = params.id;

    let product;
    // Unified query using findFirst with OR condition for UUID or slug
    product = await prisma.product.findFirst({
      where: {
        status: "ACTIVE",
        OR: [
          { id: pathId },
          { slug: pathId }
        ]
      },
      include: {
        variants: {
          where: { status: { in: ["IN_STOCK", "LOW_STOCK"] } },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found or inactive", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: product, timestamp: new Date().toISOString() },
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