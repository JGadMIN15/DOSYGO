-- Editable store settings (single row)
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "ivaPercent" INTEGER NOT NULL DEFAULT 21,
    "freeShippingCents" INTEGER NOT NULL DEFAULT 10000,
    "shippingCents" INTEGER NOT NULL DEFAULT 599,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- Seed the single default row
INSERT INTO "Settings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);
