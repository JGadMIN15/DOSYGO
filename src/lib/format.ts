// Money is stored as integer cents everywhere. Format for display in EUR.
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });
}
