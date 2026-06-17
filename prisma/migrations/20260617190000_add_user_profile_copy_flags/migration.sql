ALTER TABLE "users"
ADD COLUMN "copiedAboutMeFromMentor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "copiedProfileFromMentor" BOOLEAN NOT NULL DEFAULT false;
