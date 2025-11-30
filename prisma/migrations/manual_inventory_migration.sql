-- Migration: add_inventory_and_supplier
-- This migration adds supplier and priceStatus to Material, creates InventoryItem table, and updates Role enum

-- Step 1: Update Role enum (remove VIEWER, add SIN_ACCESO_FRONTEND)
-- First, update existing VIEWER users to EDITOR
UPDATE "User" SET role = 'EDITOR' WHERE role = 'VIEWER';

-- Add new role value
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SIN_ACCESO_FRONTEND';

-- Step 2: Add new columns to Material table
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "supplier" TEXT NOT NULL DEFAULT 'Otro';
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "priceStatus" TEXT NOT NULL DEFAULT 'available';

-- Step 3: Update existing materials from Van Rossum
UPDATE "Material" 
SET "supplier" = 'Van Rossum' 
WHERE "supplierUrl" IS NOT NULL AND "supplierUrl" LIKE '%vanrossum.com.ar%';

-- Step 4: Create InventoryItem table
CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "lastRestocked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "InventoryItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on materialId
CREATE INDEX IF NOT EXISTS "InventoryItem_materialId_idx" ON "InventoryItem"("materialId");
