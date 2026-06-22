import { getStripe } from "@/lib/stripe";

export interface ProductForStripe {
  name: string;
  description: string;
  price: number; // euros
  images: string; // JSON array of URLs/paths
  stripeProductId: string | null;
  stripePriceId: string | null;
}

// Stripe product images must be absolute public URLs. Convert local
// "/productos/..." paths to absolute using NEXT_PUBLIC_APP_URL; keep https URLs.
function absoluteImageUrls(imagesJson: string): string[] {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  let arr: unknown;
  try {
    arr = JSON.parse(imagesJson);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => String(v))
    .map((u) => (u.startsWith("http") ? u : base ? `${base}${u}` : ""))
    .filter((u) => u.startsWith("https://"))
    .slice(0, 8);
}

/**
 * Mirror a product to Stripe (Product + Price) with the same data.
 * Stripe Prices are immutable, so a new Price is created when the amount
 * changes. Returns the ids to persist. Callers should treat failures as
 * non-fatal (the product still lives in our DB).
 */
export async function syncProductToStripe(product: ProductForStripe): Promise<{
  stripeProductId: string;
  stripePriceId: string;
}> {
  const stripe = getStripe();
  const images = absoluteImageUrls(product.images);
  const unitAmount = Math.round(product.price * 100);
  const description = product.description.slice(0, 5000);

  // --- Product (create or update) ---
  let stripeProductId = product.stripeProductId;
  if (stripeProductId) {
    await stripe.products.update(stripeProductId, {
      name: product.name,
      description,
      images,
      active: true,
    });
  } else {
    const created = await stripe.products.create({
      name: product.name,
      description,
      images,
    });
    stripeProductId = created.id;
  }

  // --- Price (immutable -> create a new one if missing or amount changed) ---
  let stripePriceId = product.stripePriceId;
  let needNewPrice = !stripePriceId;
  if (stripePriceId) {
    try {
      const existing = await stripe.prices.retrieve(stripePriceId);
      if (existing.unit_amount !== unitAmount || existing.currency !== "eur") {
        needNewPrice = true;
      }
    } catch {
      needNewPrice = true; // stale id
    }
  }

  if (needNewPrice) {
    const price = await stripe.prices.create({
      product: stripeProductId,
      currency: "eur",
      unit_amount: unitAmount,
    });
    stripePriceId = price.id;
    await stripe.products.update(stripeProductId, { default_price: stripePriceId });
  }

  return { stripeProductId, stripePriceId: stripePriceId as string };
}

/** Archive (deactivate) a Stripe product. Non-fatal. */
export async function archiveStripeProduct(stripeProductId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.products.update(stripeProductId, { active: false });
}
