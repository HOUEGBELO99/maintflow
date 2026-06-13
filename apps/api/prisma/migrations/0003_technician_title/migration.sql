-- Add a display title to technicians (e.g. "Technicien sénior"), shown on the
-- back-office Techniciens screen. Not derivable from the UserRole enum.
ALTER TABLE "technicians" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Technicien';
