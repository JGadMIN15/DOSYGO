export const dynamic = "force-dynamic";

import { getSettings } from "@/lib/settings";
import CartView from "./cart-view";

export default async function CartPage() {
  const s = await getSettings();
  return (
    <CartView
      freeShippingCents={s.freeShippingCents}
      shippingCents={s.shippingCents}
    />
  );
}
