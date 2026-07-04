// ====================================================================
// AVIORA — Database Seed Script
// Seeds: Admin user, demo products, and sample variants.
// Run: npx prisma db seed
// ====================================================================

import { PrismaClient, JewelryMaterial } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding AVIORA database...");

  // ── Admin User ──
  const admin = await prisma.user.upsert({
    where: { email: "admin@avoria.com" },
    update: {},
    create: {
      email: "admin@avoria.com",
      passwordHash: "$2b$10$placeholder", // Replace with real bcrypt hash
      firstName: "AVIORA",
      lastName: "Admin",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`  ✓ Admin user created: ${admin.email}`);

  // ── Demo Customer ──
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: "$2b$10$placeholder",
      firstName: "Jane",
      lastName: "Doe",
      role: "CUSTOMER",
      isActive: true,
    },
  });
  console.log(`  ✓ Customer created: ${customer.email}`);

  // ── Sample Products ──
  const products = [
    {
      name: "Celeste Engagement Ring",
      slug: "celeste-engagement-ring",
      description: "A breathtaking solitaire engagement ring featuring a brilliant round diamond set in 18K white gold. The Celeste collection embodies timeless elegance and uncompromising craftsmanship.",
      category: "ENGAGEMENT_RING" as const,
      basePrice: 450000,
      coverImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
        "https://images.unsplash.com/photo-1515562141207-9e7c1a2d8e3c?w=800",
      ],
      availableSizes: [5, 5.5, 6, 6.5, 7, 7.5, 8],
      availableMaterials: ["GOLD_18K_WHITE" as JewelryMaterial, "PLATINUM" as JewelryMaterial, "GOLD_18K_ROSE" as JewelryMaterial],
      availableGemstones: ["Diamond", "Sapphire"],
      isFeatured: true,
    },
    {
      name: "Noir Signet Ring",
      slug: "noir-signet-ring",
      description: "A bold signet ring crafted from black titanium with a brushed finish. The perfect statement piece for the modern connoisseur.",
      category: "SIGNET_RING" as const,
      basePrice: 125000,
      coverImage: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800",
      images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800"],
      availableSizes: [7, 8, 9, 10, 11, 12],
      availableMaterials: ["TITANIUM" as JewelryMaterial, "PALLADIUM" as JewelryMaterial],
      availableGemstones: [],
      isFeatured: true,
    },
    {
      name: "Lumina Tennis Bracelet",
      slug: "lumina-tennis-bracelet",
      description: "An exquisite tennis bracelet set with round brilliant diamonds in 18K yellow gold. Each stone is carefully matched for exceptional brilliance.",
      category: "BRACELET" as const,
      basePrice: 890000,
      coverImage: "https://images.unsplash.com/photo-1619119062239-5eb607ea5da9?w=800",
      images: ["https://images.unsplash.com/photo-1619119062239-5eb607ea5da9?w=800"],
      availableSizes: [6.5, 7, 7.5],
      availableMaterials: ["GOLD_18K_YELLOW" as JewelryMaterial, "GOLD_18K_WHITE" as JewelryMaterial],
      availableGemstones: ["Diamond"],
      isFeatured: true,
    },
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData,
    });
    createdProducts.push(product);
    console.log(`  ✓ Product created: ${product.name}`);
  }

  // ── Product Variants ──
  for (const product of createdProducts) {
    // Generate 1-3 variants per product
    const variantsCount = Math.min(product.availableSizes.length, 3);
    for (let i = 0; i < variantsCount; i++) {
      const size = product.availableSizes[i]!;
      const material = product.availableMaterials[i % product.availableMaterials.length]!;
      const gemstone = product.availableGemstones[i % (product.availableGemstones.length || 1)] || null;

      const sku = `${product.slug.toUpperCase().replace(/-/g, "_")}_${size}_${material}`;
      const barcode = `0${String(product.slug.length).padStart(2, "0")}${String(i).padStart(10, "0")}`;

      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: product.id,
          sku,
          barcode: barcode.padEnd(13, "0"),
          size,
          material,
          gemstone,
          price: product.basePrice + i * 5000,
          quantity: 10 + i * 5,
          status: "IN_STOCK",
        },
      });
    }
    console.log(`  ✓ ${variantsCount} variants created for ${product.name}`);
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
