export const dynamic = "force-dynamic";

import { getSettings } from "@/lib/settings";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";
import CartView from "./cart-view";

export default async function CartPage() {
  const s = await getSettings();

  // Logged-in customers can apply ONE won discount at checkout.
  const customer = await getCurrentCustomer();
  const rewards = customer
    ? await prisma.discountReward.findMany({
        where: { customerId: customer.id, used: false },
        orderBy: { percent: "desc" },
        select: { id: true, percent: true },
      })
    : [];

  return (
    <CartView
      freeShippingCents={s.freeShippingCents}
      shippingCents={s.shippingCents}
      rewards={rewards}
    />
  );
}
