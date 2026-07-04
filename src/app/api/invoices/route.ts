import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const invoiceCreationSchema = z.object({
  items: z.array(
    z.object({
      variantId: z.string(),
      quantity: z.number().min(1),
    })
  ).min(1),
});

export async function POST(request: Request) {
  try {
    // Authentication check
    const user = await requireAuth();

    const body = await request.json();
    const validated = invoiceCreationSchema.parse(body);

    // Get variants for validation and stock checking
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: validated.items.map((item) => item.variantId) } },
      include: { product: true },
    });

    if (variants.length !== validated.items.length) {
      return NextResponse.json(
        { success: false, error: "Some variants not found", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    // Check stock availability
    const insufficientStockItems = [];
    for (const item of validated.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (variant && variant.quantity < item.quantity) {
        insufficientStockItems.push({
          variantId: item.variantId,
          variantSku: variant.sku,
          available: variant.quantity,
          requested: item.quantity,
        });
      }
    }

    if (insufficientStockItems.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient stock for some items",
          timestamp: new Date().toISOString(),
          data: { insufficientStockItems },
        },
        { status: 400 }
      );
    }

    // Calculate invoice totals
    let subtotal = 0;
    for (const item of validated.items) {
      const variant = variants.find((v) => v.id === item.variantId);
      if (variant) {
        subtotal += variant.price * item.quantity;
      }
    }

    const taxAmount = Math.round(subtotal * 0.10); // 10% tax
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, "0")}`;

    // Create invoice and items in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: user.id,
          subtotal,
          taxAmount,
          totalAmount,
          status: "PENDING",
          billingName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          billingEmail: user.email,
        },
      });

      // Create invoice items and update variant quantities
      for (const item of validated.items) {
        const variant = variants.find((v) => v.id === item.variantId);

        if (variant) {
          // Create invoice item
          await tx.invoiceItem.create({
            data: {
              invoiceId: newInvoice.id,
              variantId: item.variantId,
              productName: variant.product.name,
              sku: variant.sku,
              size: variant.size,
              material: variant.material,
              gemstone: variant.gemstone,
              quantity: item.quantity,
              unitPrice: variant.price,
              lineTotal: variant.price * item.quantity,
            },
          });

          // Update variant quantity
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      return newInvoice;
    });

    // Fetch the created invoice with items
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
        user: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: completeInvoice, timestamp: new Date().toISOString() },
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