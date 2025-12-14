-- Baseline schema creation for Ambassador CRM (includes Activity and visit link)

-- Enums
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AMBASSADOR');
CREATE TYPE "VisitType" AS ENUM ('TASTING', 'TRAINING', 'CHECKUP');

-- Users
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "telegramId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AMBASSADOR',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- Facilities
CREATE TABLE "Facility" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "format" TEXT,
    "tier" TEXT,
    "mustList" JSONB
);

-- Activities
CREATE TABLE "Activity" (
    "id" SERIAL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Activity_code_key" ON "Activity"("code");

-- Products
CREATE TABLE "Product" (
    "id" SERIAL PRIMARY KEY,
    "line" TEXT NOT NULL,
    "flavor" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- Distributors
CREATE TABLE "Distributor" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL
);

-- Orders
CREATE TABLE "Order" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER,
    "facilityId" INTEGER,
    "distributorId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedBy" TEXT,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Visits
CREATE TABLE "Visit" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "facilityId" INTEGER NOT NULL,
    "activityId" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoUrl" TEXT,
    "isValidGeo" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- OrderItems
CREATE TABLE "OrderItem" (
    "id" SERIAL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL
);

-- Join table for Visit <-> Product (VisitProducts)
CREATE TABLE "_VisitProducts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);
CREATE UNIQUE INDEX "_VisitProducts_AB_unique" ON "_VisitProducts"("A", "B");
CREATE INDEX "_VisitProducts_B_index" ON "_VisitProducts"("B");

-- Foreign keys
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_VisitProducts" ADD CONSTRAINT "_VisitProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_VisitProducts" ADD CONSTRAINT "_VisitProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
