/**
 * Migrate existing local product images to Cloudinary
 * Reads products with localImage starting with /products/,
 * uploads the local file to Cloudinary, and updates the DB.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function main() {
  const products = await prisma.product.findMany({
    where: {
      localImage: { startsWith: "/products/" },
    },
    select: { id: true, sku: true, localImage: true, imageUrl: true },
  });

  console.log(`Found ${products.length} products with local images to migrate`);

  let migrated = 0, failed = 0, skipped = 0;

  for (const p of products) {
    const localPath = path.join(process.cwd(), "public", p.localImage!);

    // If file doesn't exist locally, try uploading from the original URL
    const source = fs.existsSync(localPath) ? localPath : p.imageUrl;
    if (!source) { skipped++; continue; }

    try {
      const result = await cloudinary.uploader.upload(source, {
        folder: "perez-refrigeracion",
        public_id: p.sku,
        overwrite: false,
        resource_type: "image",
      });

      await prisma.product.update({
        where: { id: p.id },
        data: { localImage: result.secure_url },
      });

      migrated++;
      if (migrated % 100 === 0) console.log(`  ${migrated}/${products.length} migrated...`);
    } catch (e: any) {
      // If already exists, just update DB with the URL
      if (e?.http_code === 400 || e?.error?.message?.includes("already exists")) {
        const url = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/perez-refrigeracion/${p.sku}`;
        await prisma.product.update({
          where: { id: p.id },
          data: { localImage: url },
        });
        migrated++;
        if (migrated % 100 === 0) console.log(`  ${migrated}/${products.length} migrated...`);
      } else {
        failed++;
        console.error(`  Failed ${p.sku}:`, e?.message?.substring(0, 80));
      }
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${failed} failed, ${skipped} skipped`);

  // Clean up local images
  if (failed === 0) {
    const productsDir = path.join(process.cwd(), "public", "products");
    const files = fs.readdirSync(productsDir);
    for (const f of files) {
      fs.unlinkSync(path.join(productsDir, f));
    }
    console.log(`Cleaned up ${files.length} local image files`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
