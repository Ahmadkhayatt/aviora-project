import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: "Product not found", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    // Soft delete - set status to ARCHIVED
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: { status: ProductStatus.ARCHIVED },
    });

    return NextResponse.json(
      { success: true, data: updatedProduct, timestamp: new Date().toISOString() },
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