-- A recorded zero cannot be a mortality or feed event, because those
-- quantities must stay above zero. The flags say the day was reported.

ALTER TABLE "pond_daily_record"
  ADD COLUMN "deathsReported" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "feedReported" BOOLEAN NOT NULL DEFAULT false;

UPDATE "pond_daily_record" AS record
SET "deathsReported" = true
WHERE record."observedOn" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "mortality_event" AS event
    WHERE event."batchPondId" = record."batchPondId"
      AND (event."occurredAt" AT TIME ZONE 'Asia/Jakarta')::date = record."observedOn"
  );

UPDATE "pond_daily_record" AS record
SET "feedReported" = true
WHERE record."observedOn" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "feed_application" AS event
    WHERE event."batchPondId" = record."batchPondId"
      AND (event."occurredAt" AT TIME ZONE 'Asia/Jakarta')::date = record."observedOn"
  );
