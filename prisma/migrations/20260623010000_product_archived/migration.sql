-- Soft-delete flag: archived products are hidden from the store and admin list
-- but kept in the DB so existing orders keep their product reference/history.
ALTER TABLE "Product" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
