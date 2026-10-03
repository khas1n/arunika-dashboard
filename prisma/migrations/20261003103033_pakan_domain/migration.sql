-- CreateTable
CREATE TABLE "batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "molassesCarbonFraction" DECIMAL(6,4) NOT NULL DEFAULT 0.37,
    "plannedSeedWeightGrams" DECIMAL(10,4),
    "bibisLeadDays" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pond" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_source" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feeding_rate_band" (
    "id" TEXT NOT NULL,
    "minWeightGrams" DECIMAL(10,3) NOT NULL,
    "maxWeightGrams" DECIMAL(10,3) NOT NULL,
    "frMin" DECIMAL(6,4) NOT NULL,
    "frMax" DECIMAL(6,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feeding_rate_band_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_additive" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gramsPerFeedGram" DECIMAL(10,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_additive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_pond" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "pondId" TEXT NOT NULL,
    "feedId" TEXT,
    "plannedSeedCount" INTEGER,
    "volumeM3" DECIMAL(8,2),
    "plannedFeedDayCount" INTEGER,
    "plannedFastDayCount" INTEGER,
    "densityPerM3" DECIMAL(8,2),
    "aeratorType" TEXT,
    "probiotic" TEXT,
    "proteinFraction" DECIMAL(6,4),
    "carbonFraction" DECIMAL(6,4),
    "nitrogenFraction" DECIMAL(6,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_pond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_pond_treatment" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_pond_treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pond_fasting_pattern" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "feedDayCount" INTEGER NOT NULL,
    "fastDayCount" INTEGER NOT NULL,
    "anchorOn" DATE NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pond_fasting_pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fasting_override" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,

    CONSTRAINT "fasting_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pond_daily_record" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "doc" INTEGER NOT NULL,
    "observedOn" DATE,
    "averageWeightGrams" DECIMAL(10,3),
    "frMin" DECIMAL(6,4),
    "frMax" DECIMAL(6,4),
    "floc" DECIMAL(10,2),
    "ph" DECIMAL(4,2),
    "tds" DECIMAL(10,2),
    "dissolvedOxygen" DECIMAL(5,2),
    "temperatureC" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pond_daily_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pond_stocking" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "seedSourceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "occurredOn" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pond_stocking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortality_event" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortality_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bibis_record" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "feedingOn" DATE NOT NULL,
    "quantityGrams" INTEGER NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bibis_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_receipt" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantityGrams" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_application" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "bibisRecordId" TEXT,
    "quantityGrams" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_opname" (
    "id" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "systemQuantityGrams" INTEGER NOT NULL,
    "physicalQuantityGrams" INTEGER NOT NULL,
    "adjustmentGrams" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_log" (
    "id" TEXT NOT NULL,
    "batchPondId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "quantityGrams" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batch_name_key" ON "batch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pond_code_key" ON "pond"("code");

-- CreateIndex
CREATE UNIQUE INDEX "feed_name_key" ON "feed"("name");

-- CreateIndex
CREATE UNIQUE INDEX "seed_source_name_key" ON "seed_source"("name");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_code_key" ON "treatment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_name_key" ON "treatment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "feeding_rate_band_minWeightGrams_key" ON "feeding_rate_band"("minWeightGrams");

-- CreateIndex
CREATE UNIQUE INDEX "feed_additive_name_key" ON "feed_additive"("name");

-- CreateIndex
CREATE INDEX "batch_pond_pondId_idx" ON "batch_pond"("pondId");

-- CreateIndex
CREATE INDEX "batch_pond_feedId_idx" ON "batch_pond"("feedId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_pond_batchId_pondId_key" ON "batch_pond"("batchId", "pondId");

-- CreateIndex
CREATE INDEX "batch_pond_treatment_treatmentId_idx" ON "batch_pond_treatment"("treatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_pond_treatment_batchPondId_treatmentId_key" ON "batch_pond_treatment"("batchPondId", "treatmentId");

-- CreateIndex
CREATE UNIQUE INDEX "pond_fasting_pattern_batchPondId_effectiveFrom_key" ON "pond_fasting_pattern"("batchPondId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "fasting_override_batchPondId_startsAt_idx" ON "fasting_override"("batchPondId", "startsAt");

-- CreateIndex
CREATE INDEX "fasting_override_userId_idx" ON "fasting_override"("userId");

-- CreateIndex
CREATE INDEX "fasting_override_revokedById_idx" ON "fasting_override"("revokedById");

-- CreateIndex
CREATE INDEX "pond_daily_record_batchPondId_observedOn_idx" ON "pond_daily_record"("batchPondId", "observedOn");

-- CreateIndex
CREATE UNIQUE INDEX "pond_daily_record_batchPondId_doc_key" ON "pond_daily_record"("batchPondId", "doc");

-- CreateIndex
CREATE INDEX "pond_stocking_batchPondId_occurredOn_idx" ON "pond_stocking"("batchPondId", "occurredOn");

-- CreateIndex
CREATE INDEX "pond_stocking_seedSourceId_idx" ON "pond_stocking"("seedSourceId");

-- CreateIndex
CREATE INDEX "pond_stocking_userId_idx" ON "pond_stocking"("userId");

-- CreateIndex
CREATE INDEX "mortality_event_batchPondId_occurredAt_idx" ON "mortality_event"("batchPondId", "occurredAt");

-- CreateIndex
CREATE INDEX "mortality_event_userId_idx" ON "mortality_event"("userId");

-- CreateIndex
CREATE INDEX "bibis_record_batchPondId_feedingOn_idx" ON "bibis_record"("batchPondId", "feedingOn");

-- CreateIndex
CREATE INDEX "bibis_record_feedId_idx" ON "bibis_record"("feedId");

-- CreateIndex
CREATE INDEX "bibis_record_preparedAt_idx" ON "bibis_record"("preparedAt");

-- CreateIndex
CREATE INDEX "bibis_record_userId_idx" ON "bibis_record"("userId");

-- CreateIndex
CREATE INDEX "feed_receipt_feedId_occurredAt_idx" ON "feed_receipt"("feedId", "occurredAt");

-- CreateIndex
CREATE INDEX "feed_receipt_batchId_idx" ON "feed_receipt"("batchId");

-- CreateIndex
CREATE INDEX "feed_receipt_userId_idx" ON "feed_receipt"("userId");

-- CreateIndex
CREATE INDEX "feed_application_batchPondId_occurredAt_idx" ON "feed_application"("batchPondId", "occurredAt");

-- CreateIndex
CREATE INDEX "feed_application_feedId_occurredAt_idx" ON "feed_application"("feedId", "occurredAt");

-- CreateIndex
CREATE INDEX "feed_application_bibisRecordId_idx" ON "feed_application"("bibisRecordId");

-- CreateIndex
CREATE INDEX "feed_application_userId_idx" ON "feed_application"("userId");

-- CreateIndex
CREATE INDEX "stock_opname_feedId_occurredAt_idx" ON "stock_opname"("feedId", "occurredAt");

-- CreateIndex
CREATE INDEX "stock_opname_userId_idx" ON "stock_opname"("userId");

-- CreateIndex
CREATE INDEX "treatment_log_batchPondId_occurredAt_idx" ON "treatment_log"("batchPondId", "occurredAt");

-- CreateIndex
CREATE INDEX "treatment_log_treatmentId_occurredAt_idx" ON "treatment_log"("treatmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "treatment_log_userId_idx" ON "treatment_log"("userId");

-- AddForeignKey
ALTER TABLE "batch_pond" ADD CONSTRAINT "batch_pond_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pond" ADD CONSTRAINT "batch_pond_pondId_fkey" FOREIGN KEY ("pondId") REFERENCES "pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pond" ADD CONSTRAINT "batch_pond_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pond_treatment" ADD CONSTRAINT "batch_pond_treatment_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pond_treatment" ADD CONSTRAINT "batch_pond_treatment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pond_fasting_pattern" ADD CONSTRAINT "pond_fasting_pattern_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fasting_override" ADD CONSTRAINT "fasting_override_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fasting_override" ADD CONSTRAINT "fasting_override_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fasting_override" ADD CONSTRAINT "fasting_override_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pond_daily_record" ADD CONSTRAINT "pond_daily_record_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pond_stocking" ADD CONSTRAINT "pond_stocking_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pond_stocking" ADD CONSTRAINT "pond_stocking_seedSourceId_fkey" FOREIGN KEY ("seedSourceId") REFERENCES "seed_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pond_stocking" ADD CONSTRAINT "pond_stocking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortality_event" ADD CONSTRAINT "mortality_event_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortality_event" ADD CONSTRAINT "mortality_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibis_record" ADD CONSTRAINT "bibis_record_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibis_record" ADD CONSTRAINT "bibis_record_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bibis_record" ADD CONSTRAINT "bibis_record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_receipt" ADD CONSTRAINT "feed_receipt_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_receipt" ADD CONSTRAINT "feed_receipt_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_receipt" ADD CONSTRAINT "feed_receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_application" ADD CONSTRAINT "feed_application_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_application" ADD CONSTRAINT "feed_application_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_application" ADD CONSTRAINT "feed_application_bibisRecordId_fkey" FOREIGN KEY ("bibisRecordId") REFERENCES "bibis_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_application" ADD CONSTRAINT "feed_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname" ADD CONSTRAINT "stock_opname_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "feed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_opname" ADD CONSTRAINT "stock_opname_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_log" ADD CONSTRAINT "treatment_log_batchPondId_fkey" FOREIGN KEY ("batchPondId") REFERENCES "batch_pond"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_log" ADD CONSTRAINT "treatment_log_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_log" ADD CONSTRAINT "treatment_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
