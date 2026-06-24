import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { getOrderDocProps } from "@/lib/order-doc";
import OrderDocument from "@/app/admin/_components/order-document";

export default async function FacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const doc = await getOrderDocProps(id);
  if (!doc) notFound();

  return <OrderDocument type="factura" {...doc} />;
}
