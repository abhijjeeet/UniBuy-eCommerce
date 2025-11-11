-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountPct" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "usageLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Coupon" ("code", "createdAt", "discountPct", "expiresAt", "id", "isActive", "updatedAt") SELECT "code", "createdAt", "discountPct", "expiresAt", "id", "isActive", "updatedAt" FROM "Coupon";
DROP TABLE "Coupon";
ALTER TABLE "new_Coupon" RENAME TO "Coupon";
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
