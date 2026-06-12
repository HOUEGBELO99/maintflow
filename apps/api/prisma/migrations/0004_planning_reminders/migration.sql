-- Preventive-planning enrichments: rule reference/reminder lead/active flag,
-- plus an automatic-reminder log (back-office Planification screen).

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('scheduled', 'sent', 'done');

-- AlterTable: PlanRule gains code / reminderLead / active.
ALTER TABLE "plan_rules" ADD COLUMN "code" TEXT;
ALTER TABLE "plan_rules" ADD COLUMN "reminderLead" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "plan_rules" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- Backfill deterministic codes (PM-01, PM-02, …) for any pre-existing rows so the
-- NOT NULL + unique constraint can be applied. The seed overwrites these exactly.
WITH ranked AS (
  SELECT
    "id",
    'PM-' || LPAD((ROW_NUMBER() OVER (PARTITION BY "siteId" ORDER BY "createdAt", "id"))::text, 2, '0') AS code
  FROM "plan_rules"
)
UPDATE "plan_rules" p SET "code" = r.code FROM ranked r WHERE p."id" = r."id";

ALTER TABLE "plan_rules" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "plan_rules_siteId_code_key" ON "plan_rules"("siteId", "code");

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "ruleId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "machineId" UUID NOT NULL,
    "technicianId" UUID,
    "dueDate" DATE NOT NULL,
    "firedAt" TIMESTAMP(3) NOT NULL,
    "lead" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_siteId_firedAt_idx" ON "reminders"("siteId", "firedAt");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "plan_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
