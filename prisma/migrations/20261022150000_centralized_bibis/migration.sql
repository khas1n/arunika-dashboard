-- Bibis preparation is no longer owned by one pond. Existing rows keep
-- their pond. New rows may leave batchPondId null. No opening stock is written.

ALTER TABLE "bibis_record" ALTER COLUMN "batchPondId" DROP NOT NULL;

ALTER TABLE "bibis_record" ADD COLUMN "clientRequestId" TEXT;
ALTER TABLE "feed_receipt" ADD COLUMN "clientRequestId" TEXT;
ALTER TABLE "feed_application" ADD COLUMN "clientRequestId" TEXT;
ALTER TABLE "stock_opname" ADD COLUMN "clientRequestId" TEXT;

CREATE UNIQUE INDEX "bibis_record_clientRequestId_key" ON "bibis_record"("clientRequestId");
CREATE UNIQUE INDEX "feed_receipt_clientRequestId_key" ON "feed_receipt"("clientRequestId");
CREATE UNIQUE INDEX "feed_application_clientRequestId_key" ON "feed_application"("clientRequestId");
CREATE UNIQUE INDEX "stock_opname_clientRequestId_key" ON "stock_opname"("clientRequestId");

DROP INDEX "bibis_record_feedId_idx";
CREATE INDEX "bibis_record_feedId_feedingOn_idx" ON "bibis_record"("feedId", "feedingOn");
