-- CreateTable
CREATE TABLE "fish_species" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientificName" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fish_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultivation_method" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultivation_method_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fish_species_code_key" ON "fish_species"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cultivation_method_code_key" ON "cultivation_method"("code");

-- Seed the rows the backfill points at. Codes are the stable identity.
INSERT INTO "fish_species" ("id", "code", "name", "scientificName", "active", "updatedAt")
VALUES ('seed_fish_species_nila', 'NILA', 'Nila', 'Oreochromis niloticus', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "cultivation_method" ("id", "code", "name", "active", "updatedAt")
VALUES ('seed_cultivation_method_biofloc', 'BIOFLOC', 'Biofloc', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- AlterTable
ALTER TABLE "batch_pond" ADD COLUMN "fishSpeciesId" TEXT,
ADD COLUMN "cultivationMethodId" TEXT;

-- Existing cycles are BATCH 1 Nila grown with Biofloc.
UPDATE "batch_pond"
SET "fishSpeciesId" = (
    SELECT "id" FROM "fish_species" WHERE "code" = 'NILA'
)
WHERE "fishSpeciesId" IS NULL;

UPDATE "batch_pond"
SET "cultivationMethodId" = (
    SELECT "id" FROM "cultivation_method" WHERE "code" = 'BIOFLOC'
)
WHERE "cultivationMethodId" IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "batch_pond"
        WHERE "fishSpeciesId" IS NULL OR "cultivationMethodId" IS NULL
    ) THEN
        RAISE EXCEPTION 'batch_pond is missing Nila or Biofloc';
    END IF;
END $$;

ALTER TABLE "batch_pond" ALTER COLUMN "fishSpeciesId" SET NOT NULL,
ALTER COLUMN "cultivationMethodId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "batch_pond_fishSpeciesId_idx" ON "batch_pond"("fishSpeciesId");

-- CreateIndex
CREATE INDEX "batch_pond_cultivationMethodId_idx" ON "batch_pond"("cultivationMethodId");

-- AddForeignKey
ALTER TABLE "batch_pond" ADD CONSTRAINT "batch_pond_fishSpeciesId_fkey" FOREIGN KEY ("fishSpeciesId") REFERENCES "fish_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pond" ADD CONSTRAINT "batch_pond_cultivationMethodId_fkey" FOREIGN KEY ("cultivationMethodId") REFERENCES "cultivation_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
