import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    // Get product ID from URL or params
    const pathId = params.id;

    // Try to parse as UUID, otherwise treat as slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathId);

    let product;
    if (isUUID) {
      product = await prisma.product.findUnique({
        where: { id: pathId, status: "ACTIVE" },
        include: {
          variants: {
            where: { status: { in: ["IN_STOCK", "LOW_STOCK"] } },
          },
        },
      });
    } else {
      product = await prisma.product.findUnique({
        where: { slug: pathId, status: "ACTIVE" },
        include: {
          variants: {
            where: { status: { in: ["IN_STOCK", "LOW_STOCK"] } },
          },
        },
      });
    }

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