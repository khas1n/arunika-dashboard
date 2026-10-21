-- Soft revoke for TreatmentLog (operator correction). Rows stay for audit.

ALTER TABLE "treatment_log"
  ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "revokedById" TEXT;

CREATE INDEX "treatment_log_revokedById_idx" ON "treatment_log"("revokedById");

ALTER TABLE "treatment_log"
  ADD CONSTRAINT "treatment_log_revokedById_fkey"
  FOREIGN KEY ("revokedById") REFERENCES "user"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
