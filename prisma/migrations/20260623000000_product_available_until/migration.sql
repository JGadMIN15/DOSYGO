-- Optional "available until" date: past this moment the product is hidden from the store
ALTER TABLE "Product" ADD COLUMN "availableUntil" TIMESTAMP(3);
