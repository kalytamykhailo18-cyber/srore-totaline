/**
 * Totaline Scraper
 * Logs into store.totaline.ar, extracts products with prices, and saves to database
 */

import "dotenv/config";
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const TOTALINE_URL = process.env.TOTALINE_URL || "https://store.totaline.ar";
const TOTALINE_EMAIL = process.env.TOTALINE_EMAIL || "";
const TOTALINE_PASSWORD = process.env.TOTALINE_PASSWORD || "";
const MARKUP = parseInt(process.env.MARKUP_PERCENTAGE || "50");

interface ScrapedProduct {
  sku: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  url: string;
}

async function uploadToCloudinary(url: string, sku: string): Promise<string | null> {
  try {
    const result = await cloudinary.uploader.upload(url, {
      folder: "perez-refrigeracion",
      public_id: sku,
      overwrite: false,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (e: any) {
    if (e?.http_code === 400 && e?.message?.includes("already exists")) {
      // Already uploaded, return existing URL
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/perez-refrigeracion/${sku}`;
    }
    return null;
  }
}

function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function login(page: puppeteer.Page): Promise<boolean> {
  console.log("Logging in to Totaline...");
  await page.goto(`${TOTALINE_URL}/customer/account/login/`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  await page.type("#email", TOTALINE_EMAIL, { delay: 20 });
  await page.type("#pass", TOTALINE_PASSWORD, { delay: 20 });

  // Click login button
  await page.evaluate(() => {
    const btn = document.querySelector("#send2") as HTMLButtonElement;
    if (btn) btn.click();
  });

  await new Promise((r) => setTimeout(r, 5000));
  const url = page.url();
  const loggedIn = !url.includes("login");
  console.log(loggedIn ? "Login successful!" : "Login FAILED");
  return loggedIn;
}

async function scrapeCategory(page: puppeteer.Page, categoryUrl: string, categoryName: string): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  let pageNum = 1;

  while (true) {
    const url = pageNum === 1 ? categoryUrl : `${categoryUrl}?p=${pageNum}`;
    console.log(`  Scraping ${categoryName} page ${pageNum}...`);

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
    } catch {
      console.log(`  Failed to load page ${pageNum}, stopping`);
      break;
    }

    const pageProducts = await page.evaluate(() => {
      const items: Array<{
        sku: string; name: string; price: number;
        imageUrl: string; inStock: boolean; url: string;
      }> = [];

      document.querySelectorAll(".product-item").forEach((el) => {
        const nameEl = el.querySelector(".product-item-link");
        const priceEl = el.querySelector(".price-wrapper [data-price-amount]") ||
                        el.querySelector(".price");
        const imgEl = el.querySelector(".product-image-photo") as HTMLImageElement;
        const skuEl = el.querySelector("[data-product-sku]");
        const linkEl = el.querySelector("a.product-item-link") as HTMLAnchorElement;

        const name = nameEl?.textContent?.trim() || "";
        // Always parse from displayed text (Argentine format: $1.234.567,89)
        // Remove non-digits/dots/commas, then remove dots (thousands), then replace comma with dot (decimal)
        const txt = priceEl?.textContent?.replace(/[^0-9.,]/g, "") || "0";
        const price = parseFloat(txt.replace(/\./g, "").replace(",", ".")) || 0;
        const sku = skuEl?.getAttribute("data-product-sku") ||
                    el.querySelector("[data-product-id]")?.getAttribute("data-product-id") || "";
        const imageUrl = imgEl?.src || imgEl?.getAttribute("data-src") || "";
        const url = linkEl?.href || "";
        const stockEl = el.querySelector(".stock.unavailable");
        const inStock = !stockEl;

        if (name && price > 0 && price < 9000000) {
          items.push({ sku, name, price, imageUrl, inStock, url });
        }
      });

      return items;
    });

    if (pageProducts.length === 0) break;

    products.push(...pageProducts.map((p) => ({ ...p, category: categoryName })));
    console.log(`  Found ${pageProducts.length} products on page ${pageNum}`);

    // Check if there's a next page
    const hasNext = await page.evaluate(() => {
      const next = document.querySelector(".pages-item-next a");
      return !!next;
    });

    if (!hasNext) break;
    pageNum++;
    await new Promise((r) => setTimeout(r, 1000)); // Rate limit
  }

  return products;
}

async function getCategories(page: puppeteer.Page): Promise<Array<{ name: string; url: string }>> {
  console.log("Getting categories...");
  await page.goto(TOTALINE_URL, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 2000));

  const categories = await page.evaluate(() => {
    const cats: Array<{ name: string; url: string }> = [];
    document.querySelectorAll("nav.navigation li.level0 > a, nav.navigation li.level1 > a").forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const name = a.textContent?.trim() || "";
      const skip = ["ver todo", "home", "inicio"];
      if (href && name && href.includes("totaline.ar") && !href.includes("#") && !href.includes("javascript") && !skip.includes(name.toLowerCase())) {
        cats.push({ name, url: href });
      }
    });
    return cats;
  });

  console.log(`Found ${categories.length} categories`);
  return categories;
}

// Generic parent categories — products in these should go to a more specific sub-category if available
const GENERIC_CATEGORIES = new Set([
  "Insumos y Partes",
  "Linea Residencial",
  "Linea Light Commercial",
  "Linea Commercial",
  "Heating",
  "Linea Industrial",
  "Linea Comercial",
]);

async function syncProducts(products: ScrapedProduct[]) {
  console.log(`\nSyncing ${products.length} products to database...`);

  const log = await prisma.syncLog.create({
    data: { type: "full", productsTotal: products.length },
  });

  let added = 0, updated = 0, errors = 0;

  // Sort products: specific categories first, generic parents last
  // Within the same dedup, the more specific category wins
  products.sort((a, b) => {
    const aGeneric = GENERIC_CATEGORIES.has(a.category) ? 1 : 0;
    const bGeneric = GENERIC_CATEGORIES.has(b.category) ? 1 : 0;
    return aGeneric - bGeneric;
  });

  const seenSkus = new Set<string>();

  // Create/update categories
  const categoryMap = new Map<string, number>();
  const uniqueCategories = [...new Set(products.map((p) => p.category))];
  for (const catName of uniqueCategories) {
    const slug = slugify(catName);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name: catName },
      create: { name: catName, slug },
    });
    categoryMap.set(catName, cat.id);
  }

  // Upsert products
  for (const p of products) {
    if (!p.sku || seenSkus.has(p.sku)) continue;
    seenSkus.add(p.sku);

    const resellerPrice = Math.round(p.price * (1 + MARKUP / 100));
    const categoryId = categoryMap.get(p.category) || null;

    try {
      // Skip Totaline placeholder/branding images
      const isPlaceholder = !p.imageUrl ||
        p.imageUrl.includes("placeholder") ||
        p.imageUrl.includes("logo-totaline") ||
        /\d+_logo/i.test(p.imageUrl);

      // Upload image to Cloudinary (skip placeholders)
      let localImage: string | null = null;
      let imageUrl: string | null = isPlaceholder ? null : p.imageUrl;
      if (imageUrl) {
        localImage = await uploadToCloudinary(imageUrl, p.sku);
      }

      const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
      if (existing) {
        // For placeholder products, clear out any old image references
        const newImageUrl = isPlaceholder ? null : (imageUrl || existing.imageUrl);
        const newLocalImage = isPlaceholder ? null : (localImage || existing.localImage);
        await prisma.product.update({
          where: { sku: p.sku },
          data: {
            name: p.name,
            supplierPrice: p.price,
            resellerPrice,
            stockStatus: p.inStock,
            categoryId,
            imageUrl: newImageUrl,
            localImage: newLocalImage,
            totalineUrl: p.url || existing.totalineUrl,
            lastSynced: new Date(),
            active: true,
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: p.sku,
            name: p.name,
            supplierPrice: p.price,
            resellerPrice,
            stockStatus: p.inStock,
            categoryId,
            imageUrl,
            localImage,
            totalineUrl: p.url,
            lastSynced: new Date(),
          },
        });
        added++;
      }
    } catch (e) {
      errors++;
      console.error(`Error syncing ${p.sku}:`, (e as Error).message?.substring(0, 80));
    }
  }

  // Mark products not seen as inactive
  const removed = await prisma.product.updateMany({
    where: { isManual: false, sku: { notIn: [...seenSkus] }, active: true },
    data: { active: false },
  });

  await prisma.syncLog.update({
    where: { id: log.id },
    data: {
      finishedAt: new Date(),
      productsAdded: added,
      productsUpdated: updated,
      productsRemoved: removed.count,
      errors,
    },
  });

  console.log(`\nSync complete: ${added} added, ${updated} updated, ${removed.count} removed, ${errors} errors`);
}

async function main() {
  console.log("=== Totaline Scraper ===");
  console.log(`Markup: ${MARKUP}%`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // Login
    const loggedIn = await login(page);
    if (!loggedIn) throw new Error("Login failed");

    // Get categories
    const categories = await getCategories(page);
    if (categories.length === 0) throw new Error("No categories found");

    // Scrape each category
    const allProducts: ScrapedProduct[] = [];
    for (const cat of categories) {
      console.log(`\nCategory: ${cat.name}`);
      const products = await scrapeCategory(page, cat.url, cat.name);
      allProducts.push(...products);
      console.log(`  Total from ${cat.name}: ${products.length}`);
      await new Promise((r) => setTimeout(r, 1000)); // Rate limit between categories
    }

    console.log(`\nTotal products scraped: ${allProducts.length}`);

    // Sync to database
    await syncProducts(allProducts);
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Scraper error:", e);
  process.exit(1);
});
