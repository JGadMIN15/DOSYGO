-- Store the Stripe Product id so edits update the same Stripe product
ALTER TABLE "Product" ADD COLUMN "stripeProductId" TEXT;
