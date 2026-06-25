import { prisma } from "@/lib/prisma";

export interface StoreSettings {
  ivaPercent: number;
  freeShippingCents: number;
  shippingCents: number;
}

const DEFAULTS: StoreSettings = {
  ivaPercent: 21,
  freeShippingCents: 10000,
  shippingCents: 599,
};

export async function getSettings(): Promise<StoreSettings> {
  const s = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!s) return DEFAULTS;
  return {
    ivaPercent: s.ivaPercent,
    freeShippingCents: s.freeShippingCents,
    shippingCents: s.shippingCents,
  };
}
