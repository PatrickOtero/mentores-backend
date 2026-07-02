ALTER TABLE "history"
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "cancelUrl" TEXT,
ADD COLUMN     "rescheduleUrl" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "schedulingUrl" TEXT,
ADD COLUMN     "calendlyInviteeUri" TEXT;
