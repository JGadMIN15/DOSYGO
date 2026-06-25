-- Store money as integer cents (was floating euros). Convert existing data ×100.
ALTER TABLE "Product" ALTER COLUMN "price" TYPE INTEGER USING (ROUND("price" * 100))::integer;
ALTER TABLE "Order" ALTER COLUMN "total" TYPE INTEGER USING (ROUND("total" * 100))::integer;
ALTER TABLE "OrderItem" ALTER COLUMN "price" TYPE INTEGER USING (ROUND("price" * 100))::integer;
