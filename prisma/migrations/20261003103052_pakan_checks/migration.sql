-- Check constraints Prisma cannot express. Quantities are integer grams
-- (or ekor for fish counts). Events must be positive, so a zero or negative
-- entry is rejected by the database as well as by the application.

ALTER TABLE "batch"
  ADD CONSTRAINT "batch_bibisLeadDays_check" CHECK ("bibisLeadDays" >= 0);

ALTER TABLE "pond_fasting_pattern"
  ADD CONSTRAINT "pond_fasting_pattern_feedDayCount_check" CHECK ("feedDayCount" >= 1),
  ADD CONSTRAINT "pond_fasting_pattern_fastDayCount_check" CHECK ("fastDayCount" >= 0);

ALTER TABLE "fasting_override"
  ADD CONSTRAINT "fasting_override_interval_check" CHECK ("endsAt" > "startsAt");

ALTER TABLE "pond_daily_record"
  ADD CONSTRAINT "pond_daily_record_doc_check" CHECK ("doc" >= 1);

ALTER TABLE "pond_stocking"
  ADD CONSTRAINT "pond_stocking_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "mortality_event"
  ADD CONSTRAINT "mortality_event_quantity_check" CHECK ("quantity" > 0);

ALTER TABLE "feed_receipt"
  ADD CONSTRAINT "feed_receipt_quantityGrams_check" CHECK ("quantityGrams" > 0);

ALTER TABLE "feed_application"
  ADD CONSTRAINT "feed_application_quantityGrams_check" CHECK ("quantityGrams" > 0);

ALTER TABLE "treatment_log"
  ADD CONSTRAINT "treatment_log_quantityGrams_check" CHECK ("quantityGrams" > 0);

ALTER TABLE "bibis_record"
  ADD CONSTRAINT "bibis_record_quantityGrams_check" CHECK ("quantityGrams" > 0);

ALTER TABLE "stock_opname"
  ADD CONSTRAINT "stock_opname_system_check" CHECK ("systemQuantityGrams" >= 0),
  ADD CONSTRAINT "stock_opname_physical_check" CHECK ("physicalQuantityGrams" >= 0),
  ADD CONSTRAINT "stock_opname_adjustment_check"
    CHECK ("adjustmentGrams" = "physicalQuantityGrams" - "systemQuantityGrams");
