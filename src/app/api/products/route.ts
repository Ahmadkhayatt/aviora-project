import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productsQuerySchema = z.object({
  category: z.string().optional(),
  featured: z.string().transform(val => val === "true").optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default("1"),
  pageSize: z.string().transform(Number).default("12"),
});

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const validated = productsQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    // Build where clause
    const where: any = {
      status: "ACTIVE", // Only show active products
    };

    if (validated.category) {
      where.category = validated.category;
    }

    if (validated.featured) {
      where.isFeatured = true;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (validated.page - 1) * validated.pageSize;
    const take = validated.pageSize;

    // Execute queries in parallel
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),

      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / validated.pageSize);

    return NextResponse.json(
      {
        success: true,
        data: products,
        page: validated.page,
        pageSize: validated.pageSize,
        totalCount,
        totalPages,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
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