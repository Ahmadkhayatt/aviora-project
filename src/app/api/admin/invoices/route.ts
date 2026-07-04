import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const adminInvoicesQuerySchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().transform(Number).default("1"),
  pageSize: z.string().transform(Number).default("10"),
});

export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const validated = adminInvoicesQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    // Build where clause
    const where: any = {};

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.startDate || validated.endDate) {
      where.createdAt = {};
      if (validated.startDate) {
        where.createdAt.gte = new Date(validated.startDate);
      }
      if (validated.endDate) {
        where.createdAt.lte = new Date(validated.endDate + "T23:59:59.999Z");
      }
    }

    // Calculate pagination
    const skip = (validated.page - 1) * validated.pageSize;
    const take = validated.pageSize;

    // Execute queries in parallel
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),

      prisma.invoice.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / validated.pageSize);

    return NextResponse.json(
      {
        success: true,
        data: invoices,
        page: validated.page,
        pageSize: validated.pageSize,
        totalCount,
        totalPages,
        timestamp: new Date().toISOString(),
      },
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