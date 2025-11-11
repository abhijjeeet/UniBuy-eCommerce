-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountPct" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "discount" REAL DEFAULT 0,
    "finalAmount" REAL NOT NULL DEFAULT 0,
    "couponCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "landmark" TEXT,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_couponCode_fkey" FOREIGN KEY ("couponCode") REFERENCES "Coupon" ("code") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "city", "createdAt", "fullName", "id", "landmark", "phone", "postalCode", "state", "status", "totalPrice", "userId") SELECT "address", "city", "createdAt", "fullName", "id", "landmark", "phone", "postalCode", "state", "status", "totalPrice", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
