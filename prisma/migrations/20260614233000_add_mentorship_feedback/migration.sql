DROP INDEX IF EXISTS "history_mentee_id_key";
DROP INDEX IF EXISTS "history_mentor_id_key";

ALTER TABLE "history"
ADD COLUMN     "eventName" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "joinUrl" TEXT,
ADD COLUMN     "inviteeName" TEXT,
ADD COLUMN     "inviteeEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "calendlyEventUri" TEXT,
ADD COLUMN     "calendlyEventUuid" TEXT,
ADD COLUMN     "feedbackRequestedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "mentorshipFeedback" (
    "id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "mentoringRating" INTEGER NOT NULL,
    "mentorClarityRating" INTEGER NOT NULL,
    "mentorSupportRating" INTEGER NOT NULL,
    "goalProgressRating" INTEGER NOT NULL,
    "platformExperienceRating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentorshipFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "history_calendlyEventUri_key" ON "history"("calendlyEventUri");
CREATE UNIQUE INDEX "history_calendlyEventUuid_key" ON "history"("calendlyEventUuid");
CREATE INDEX "history_mentee_id_endTime_idx" ON "history"("mentee_id", "endTime");
CREATE INDEX "history_mentor_id_endTime_idx" ON "history"("mentor_id", "endTime");
CREATE UNIQUE INDEX "mentorshipFeedback_history_id_key" ON "mentorshipFeedback"("history_id");
CREATE INDEX "mentorshipFeedback_mentee_id_createdAt_idx" ON "mentorshipFeedback"("mentee_id", "createdAt");
CREATE INDEX "mentorshipFeedback_mentor_id_createdAt_idx" ON "mentorshipFeedback"("mentor_id", "createdAt");

ALTER TABLE "mentorshipFeedback" ADD CONSTRAINT "mentorshipFeedback_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentorshipFeedback" ADD CONSTRAINT "mentorshipFeedback_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentorshipFeedback" ADD CONSTRAINT "mentorshipFeedback_mentee_id_fkey" FOREIGN KEY ("mentee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
