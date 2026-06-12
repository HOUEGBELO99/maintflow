-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'chef_maintenance', 'chef_atelier', 'technicien', 'operateur');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "MachineState" AS ENUM ('ok', 'fault', 'maintenance');

-- CreateEnum
CREATE TYPE "Criticality" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "FaultType" AS ENUM ('mecanique', 'electrique', 'hydraulique', 'logiciel');

-- CreateEnum
CREATE TYPE "FaultSeverity" AS ENUM ('critical', 'medium', 'low');

-- CreateEnum
CREATE TYPE "FaultStatus" AS ENUM ('pending', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "InterventionKind" AS ENUM ('corrective', 'preventive');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('critical', 'warning', 'info');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked');

-- CreateTable
CREATE TABLE "sites" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hourlyDowntimeCost" INTEGER NOT NULL DEFAULT 850,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "workshop" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "color" TEXT,
    "initials" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicians" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "available" BOOLEAN NOT NULL DEFAULT true,
    "onTime" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "doneThisMonth" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "workshop" TEXT NOT NULL,
    "invitedById" UUID NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workshop" TEXT NOT NULL,
    "installedAt" DATE NOT NULL,
    "state" "MachineState" NOT NULL DEFAULT 'ok',
    "runtime" INTEGER NOT NULL DEFAULT 0,
    "criticality" "Criticality" NOT NULL DEFAULT 'medium',
    "hourlyCost" INTEGER NOT NULL DEFAULT 0,
    "lifespanYears" INTEGER NOT NULL DEFAULT 10,
    "posX" INTEGER NOT NULL DEFAULT 0,
    "posY" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faults" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "machineId" UUID NOT NULL,
    "type" "FaultType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FaultSeverity" NOT NULL,
    "status" "FaultStatus" NOT NULL DEFAULT 'pending',
    "rootCause" TEXT,
    "reportedById" UUID NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "takenAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "machineId" UUID NOT NULL,
    "technicianId" UUID NOT NULL,
    "kind" "InterventionKind" NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'planned',
    "linkedFaultId" UUID,
    "planRuleId" UUID,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "actualDuration" DOUBLE PRECISION,
    "rating" INTEGER,
    "signedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "unitCost" INTEGER NOT NULL DEFAULT 0,
    "forTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_usages" (
    "id" UUID NOT NULL,
    "interventionId" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "part_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_rules" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "machineId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "everyWeeks" INTEGER NOT NULL,
    "technicianId" UUID,
    "duration" DOUBLE PRECISION NOT NULL,
    "nextDue" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "faultId" UUID,
    "interventionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "level" "NotificationLevel" NOT NULL,
    "text" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_siteId_idx" ON "users"("siteId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "technicians_userId_key" ON "technicians"("userId");

-- CreateIndex
CREATE INDEX "invitations_siteId_status_idx" ON "invitations"("siteId", "status");

-- CreateIndex
CREATE INDEX "machines_siteId_state_idx" ON "machines"("siteId", "state");

-- CreateIndex
CREATE INDEX "machines_siteId_workshop_idx" ON "machines"("siteId", "workshop");

-- CreateIndex
CREATE UNIQUE INDEX "machines_siteId_code_key" ON "machines"("siteId", "code");

-- CreateIndex
CREATE INDEX "faults_siteId_status_idx" ON "faults"("siteId", "status");

-- CreateIndex
CREATE INDEX "faults_machineId_idx" ON "faults"("machineId");

-- CreateIndex
CREATE INDEX "faults_severity_status_idx" ON "faults"("severity", "status");

-- CreateIndex
CREATE UNIQUE INDEX "interventions_linkedFaultId_key" ON "interventions"("linkedFaultId");

-- CreateIndex
CREATE INDEX "interventions_siteId_status_idx" ON "interventions"("siteId", "status");

-- CreateIndex
CREATE INDEX "interventions_technicianId_status_idx" ON "interventions"("technicianId", "status");

-- CreateIndex
CREATE INDEX "interventions_machineId_idx" ON "interventions"("machineId");

-- CreateIndex
CREATE INDEX "interventions_scheduledFor_idx" ON "interventions"("scheduledFor");

-- CreateIndex
CREATE INDEX "parts_siteId_idx" ON "parts"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "parts_siteId_ref_key" ON "parts"("siteId", "ref");

-- CreateIndex
CREATE UNIQUE INDEX "part_usages_interventionId_partId_key" ON "part_usages"("interventionId", "partId");

-- CreateIndex
CREATE INDEX "plan_rules_siteId_nextDue_idx" ON "plan_rules"("siteId", "nextDue");

-- CreateIndex
CREATE INDEX "attachments_faultId_idx" ON "attachments"("faultId");

-- CreateIndex
CREATE INDEX "attachments_interventionId_idx" ON "attachments"("interventionId");

-- CreateIndex
CREATE INDEX "notifications_siteId_read_idx" ON "notifications"("siteId", "read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faults" ADD CONSTRAINT "faults_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faults" ADD CONSTRAINT "faults_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faults" ADD CONSTRAINT "faults_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_linkedFaultId_fkey" FOREIGN KEY ("linkedFaultId") REFERENCES "faults"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_planRuleId_fkey" FOREIGN KEY ("planRuleId") REFERENCES "plan_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_usages" ADD CONSTRAINT "part_usages_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_rules" ADD CONSTRAINT "plan_rules_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_rules" ADD CONSTRAINT "plan_rules_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_faultId_fkey" FOREIGN KEY ("faultId") REFERENCES "faults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

