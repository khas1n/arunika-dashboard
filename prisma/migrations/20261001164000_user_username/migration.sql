ALTER TABLE "user" ADD COLUMN "username" TEXT;

UPDATE "user"
SET "username" = split_part("email", '@', 1)
WHERE "username" IS NULL;

ALTER TABLE "user" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
