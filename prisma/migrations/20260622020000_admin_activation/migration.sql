-- Allow accounts that have not set a password yet (activation flow)
ALTER TABLE "AdminUser" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- One-time activation token (stored hashed)
ALTER TABLE "AdminUser" ADD COLUMN "setupToken" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "setupTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_setupToken_key" ON "AdminUser"("setupToken");
